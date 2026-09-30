/**
 * Fila em disco dos leads que ainda não chegaram à caixa comercial.
 *
 * Antes, a rota esperava o SMTP responder para só então devolver 200. Quando o
 * MX da zona passou a apontar para um túnel que não fala SMTP, o nodemailer
 * pendurava vinte segundos e todo envio virava 502: quem preencheu via erro e
 * o pedido não ficava em lugar nenhum. Nada guardava o lead, então nada podia
 * ser reenviado depois — cada formulário submetido naquela janela foi perdido
 * de vez.
 *
 * A ordem agora é outra: grava primeiro, responde 200, tenta o e-mail depois.
 * O arquivo em disco é a garantia; o e-mail é só o transporte. Enquanto o
 * arquivo existir, o lead ainda vai chegar — nesta tentativa, na próxima
 * retentativa com recuo, ou na subida seguinte do processo.
 *
 * Mesmo desenho da agenda de propostas (`../proposta/agenda.ts`): um JSON por
 * item, retomada na subida, faxina por idade. A diferença é o que acontece
 * quando o envio falha. A proposta apaga o arquivo mesmo em falha, porque
 * repetir encheria a caixa do cliente com a mesma cotação. Aqui é o contrário:
 * o arquivo só sai do disco depois de o servidor SMTP aceitar a mensagem.
 */
import { mkdir, readdir, readFile, writeFile, unlink, stat, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../lib/env.js';
import { sendMail } from '../lib/mailer.js';
import { leadNotification } from '../emails/templates.js';
import type { ContactPayload, QuoteItem } from '../lib/schema.js';

const PASTA = join(env.PROPOSTAS_DIR, 'leads-pendentes');

/**
 * Um lead pendente, como fica gravado no disco.
 *
 * Guarda tudo que a notificação precisa para ser remontada de zero numa outra
 * execução do processo: o formulário inteiro, os itens já separados, o valor
 * calculado e o leadId. Gravar só o corpo do e-mail pronto seria menor, mas
 * amarraria o arquivo à versão do template que estava no ar na hora — um
 * deploy no meio da fila deixaria de conseguir reenviar.
 */
type LeadPendente = {
  /** O mesmo leadId que foi para a resposta e para a medição. Serve de nome de arquivo. */
  leadId: string;
  criadoEm: number;
  /** Quantas vezes o envio já foi tentado, para o recuo e para o diagnóstico. */
  tentativas: number;
  /** Momento em que o e-mail foi formatado, para o "recebido em" não virar a hora do reenvio. */
  recebidoEm: string;
  valor: number;
  dados: ContactPayload;
  itens: QuoteItem[];
};

/**
 * Prazo limite para um lead pendente importar.
 *
 * Sete dias, e não as 24 h da agenda de propostas: uma cotação que chega um dia
 * atrasada é pior do que nenhuma, mas um lead comercial atrasado ainda vale
 * muito mais do que um lead perdido. O prazo existe só para o volume não
 * crescer sem fim se o SMTP ficar quebrado para sempre.
 */
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Recuo entre tentativas, em ms.
 *
 * Começa curto — a maioria das falhas é um soluço de rede de alguns segundos —
 * e abre até meia hora, que é a escala de um problema de DNS ou de um servidor
 * em manutenção. Depois da última, o arquivo fica no disco e a retomada da
 * próxima subida cuida dele: insistir de minuto em minuto por dias só geraria
 * log.
 */
const RECUOS_MS = [15_000, 60_000, 5 * 60_000, 30 * 60_000];

/** Timers vivos neste processo, para o encerramento poder limpá-los. */
const timers = new Map<string, NodeJS.Timeout>();

/** Quantos leads estão gravados e ainda não foram aceitos pelo SMTP. */
let pendentes = 0;

/** Lido pelo /health: sem isso o container ficava "saudável" recusando lead. */
export function pendentesNaFila(): number {
  return pendentes;
}

const caminhoDe = (leadId: string) => join(PASTA, `${leadId}.json`);

/**
 * Grava o lead antes de qualquer envio.
 *
 * É a única parte do fluxo que a rota espera: alguns milissegundos de escrita
 * em disco, no lugar dos vinte segundos de timeout do SMTP. Se esta escrita
 * falhar, a rota fica sabendo e pode decidir — é o único caso em que ainda
 * vale tentar o e-mail de forma bloqueante.
 */
export async function gravarLead(lead: {
  leadId: string;
  recebidoEm: string;
  valor: number;
  dados: ContactPayload;
  itens: QuoteItem[];
}): Promise<void> {
  const item: LeadPendente = { ...lead, criadoEm: Date.now(), tentativas: 0 };

  await mkdir(PASTA, { recursive: true });

  /* Escreve em temporário e renomeia: o rename é atômico no mesmo diretório,
     então a retomada nunca encontra um JSON cortado no meio por uma queda de
     energia — encontra o arquivo completo ou não encontra nada. */
  const temporario = `${caminhoDe(item.leadId)}.tmp`;
  await writeFile(temporario, JSON.stringify(item), 'utf8');
  await rename(temporario, caminhoDe(item.leadId));

  pendentes++;
}

/** Remonta a notificação a partir do arquivo e manda para a caixa comercial. */
async function notificar(item: LeadPendente): Promise<void> {
  const notificacao = leadNotification({
    ...item.dados,
    items: item.itens,
    receivedAt: item.recebidoEm,
  });

  await sendMail({
    to: env.MAIL_TO,
    subject: notificacao.subject,
    html: notificacao.html,
    text: notificacao.text,
    // Responder no cliente de e-mail fala direto com quem preencheu.
    replyTo: `"${item.dados.nome}" <${item.dados.email}>`,
  });
}

/**
 * Tenta enviar e, dando certo, apaga o arquivo.
 *
 * O unlink vem depois do sendMail resolver, nunca no `finally`: enquanto o
 * servidor SMTP não tiver aceitado a mensagem, o disco é a única cópia do
 * lead. Em falha, reagenda com recuo; esgotadas as tentativas, deixa o arquivo
 * para a retomada da próxima subida.
 */
export async function tentarEnviar(item: LeadPendente): Promise<boolean> {
  try {
    await notificar(item);
    await unlink(caminhoDe(item.leadId)).catch(() => {});
    pendentes = Math.max(0, pendentes - 1);
    timers.delete(item.leadId);
    if (item.tentativas > 0) {
      console.log(
        `[lead] ${item.leadId.slice(0, 8)} enviado na tentativa ${item.tentativas + 1}`,
      );
    }
    return true;
  } catch (err) {
    const proximo = RECUOS_MS[item.tentativas];
    const tentado: LeadPendente = { ...item, tentativas: item.tentativas + 1 };

    /* Persiste o contador antes de reagendar: sem isso um restart no meio do
       recuo zeraria as tentativas e o lead giraria para sempre. */
    await writeFile(caminhoDe(item.leadId), JSON.stringify(tentado), 'utf8').catch(() => {});

    console.error(
      `[lead] ${item.leadId.slice(0, 8)} falhou na tentativa ${tentado.tentativas}` +
        (proximo ? ` — nova tentativa em ${Math.round(proximo / 1000)}s` : ' — aguarda próxima subida') +
        `: ${err instanceof Error ? err.message : String(err)}`,
    );

    if (proximo !== undefined) armar(tentado, proximo);
    return false;
  }
}

/** Cria o timer da retentativa. */
function armar(item: LeadPendente, espera: number): void {
  const timer = setTimeout(() => {
    timers.delete(item.leadId);
    tentarEnviar(item).catch((err) => console.error('[lead] erro na retentativa:', err));
  }, espera);

  /* unref: uma retentativa pendente não deve segurar o processo vivo no
     encerramento. O arquivo em disco é o que garante a retomada. */
  timer.unref();
  timers.set(item.leadId, timer);
}

/**
 * Dispara a primeira tentativa sem bloquear quem chamou.
 *
 * A rota já respondeu 200 quando isto roda — de propósito. O que o usuário vê
 * não depende mais de o SMTP estar de pé.
 */
export function enviarEmSegundoPlano(lead: {
  leadId: string;
  recebidoEm: string;
  valor: number;
  dados: ContactPayload;
  itens: QuoteItem[];
}): void {
  const item: LeadPendente = { ...lead, criadoEm: Date.now(), tentativas: 0 };
  tentarEnviar(item).catch((err) => console.error('[lead] erro no envio inicial:', err));
}

/**
 * Relê a pasta na subida do processo.
 *
 * Todo arquivo aqui é um lead que a caixa comercial ainda não recebeu. Dispara
 * o reenvio de cada um, espaçando as tentativas: se o SMTP voltou depois de uma
 * queda longa, abrir dez conexões no mesmo instante é um bom jeito de o
 * servidor tratar a subida como abuso.
 */
export async function retomarPendentes(): Promise<void> {
  let arquivos: string[];
  try {
    arquivos = (await readdir(PASTA)).filter((f) => f.endsWith('.json'));
  } catch {
    return; // pasta ainda não existe: nada pendente
  }

  let retomados = 0;
  let descartados = 0;

  for (const arquivo of arquivos) {
    const caminho = join(PASTA, arquivo);
    try {
      const item = JSON.parse(await readFile(caminho, 'utf8')) as LeadPendente;

      if (Date.now() - item.criadoEm > VALIDADE_MS) {
        /* Só depois de uma semana. O lead já não serve comercialmente, e o log
           fica com o registro de que existiu — é o que dá para fazer. */
        console.error(
          `[lead] ${item.leadId?.slice(0, 8)} descartado sem envio (${item.dados?.email}) — passou de ${VALIDADE_MS / 86_400_000} dias`,
        );
        await unlink(caminho).catch(() => {});
        descartados++;
        continue;
      }

      pendentes++;
      /* Reinicia o contador de tentativas: as do processo anterior já
         esgotaram o recuo, e esta subida é uma nova chance com a escada
         inteira disponível. O criadoEm é que limita o total. */
      armar({ ...item, tentativas: 0 }, retomados * 2_000);
      retomados++;
    } catch {
      // JSON corrompido não tem como ser enviado; some com ele.
      console.error(`[lead] arquivo ilegível descartado: ${arquivo}`);
      await unlink(caminho).catch(() => {});
      descartados++;
    }
  }

  if (retomados || descartados) {
    console.log(`[lead] pendentes: ${retomados} reenfileirado(s), ${descartados} descartado(s)`);
  }
}

/**
 * Apaga o que passou da validade.
 *
 * Chamado na subida e uma vez por hora, como a faxina das propostas. Sem isso
 * um SMTP quebrado por semanas encheria o volume.
 */
export async function limparVencidos(): Promise<number> {
  let arquivos: string[];
  try {
    arquivos = (await readdir(PASTA)).filter((f) => f.endsWith('.json'));
  } catch {
    return 0;
  }

  let removidos = 0;
  for (const arquivo of arquivos) {
    const caminho = join(PASTA, arquivo);
    try {
      /* mtime em vez do campo criadoEm: pega também o arquivo ilegível, que
         é justamente o que nunca sairia daqui por conta própria. */
      const info = await stat(caminho);
      if (Date.now() - info.mtimeMs > VALIDADE_MS) {
        await unlink(caminho);
        removidos++;
        pendentes = Math.max(0, pendentes - 1);
      }
    } catch {
      /* Outro processo pode ter removido no meio do caminho. */
    }
  }
  return removidos;
}

/** Cancela os timers vivos, para o processo encerrar sem espera. */
export function encerrarFila(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
