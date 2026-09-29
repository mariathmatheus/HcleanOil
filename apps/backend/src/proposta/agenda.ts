/**
 * Agenda o envio da proposta para alguns minutos depois do pedido.
 *
 * A proposta sai em segundos, e uma cotação que chega instantaneamente
 * denuncia que ninguém olhou o pedido. O atraso devolve ao envio o tempo de
 * quem monta a proposta à mão.
 *
 * Os agendamentos vivem em disco, não em memória: um deploy no meio da janela
 * descartaria a proposta em silêncio, e o cliente nunca receberia. Ao subir, o
 * processo relê a pasta, reagenda o que ainda está no futuro e dispara o que
 * venceu enquanto estava fora do ar.
 */
import { mkdir, readdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../lib/env.js';
import type { QuoteItem } from '../lib/schema.js';
import type { ContactPayload } from '../lib/schema.js';

const PASTA = join(env.PROPOSTAS_DIR, 'agendados');

/** Um envio pendente, como fica gravado no disco. */
type Agendamento = {
  id: string;
  /** Epoch em ms. Comparado com Date.now() para saber o que já venceu. */
  enviarEm: number;
  criadoEm: number;
  dados: ContactPayload;
  itens: QuoteItem[];
};

/**
 * Prazo limite para um agendamento importar.
 *
 * Um arquivo que sobreviveu a isso é lixo: ou a máquina ficou fora do ar por
 * mais de um dia, e mandar a cotação agora seria pior do que não mandar, ou
 * o envio falhou de vez. De todo modo não deve ficar ocupando disco.
 */
const VALIDADE_MS = 24 * 60 * 60 * 1000;

/** Timers vivos neste processo, para o encerramento poder limpá-los. */
const timers = new Map<string, NodeJS.Timeout>();

/** Sorteia o atraso dentro da janela configurada. */
function sortearAtraso(): number {
  const min = env.PROPOSTA_ATRASO_MIN_S;
  const max = Math.max(min, env.PROPOSTA_ATRASO_MAX_S);
  return Math.round((min + Math.random() * (max - min)) * 1000);
}

const minutos = (ms: number) => (ms / 60000).toFixed(1);

/**
 * Marca a proposta para sair depois do atraso sorteado.
 *
 * `enviar` é injetado em vez de importado para o agendador não depender do
 * gerador de PDF: quem chama decide o que fazer quando a hora chegar.
 */
export async function agendarProposta(
  dados: ContactPayload,
  itens: QuoteItem[],
  enviar: (dados: ContactPayload, itens: QuoteItem[]) => Promise<void>,
): Promise<void> {
  const atraso = sortearAtraso();
  const item: Agendamento = {
    id: randomUUID(),
    enviarEm: Date.now() + atraso,
    criadoEm: Date.now(),
    dados,
    itens,
  };

  await mkdir(PASTA, { recursive: true });
  await writeFile(join(PASTA, `${item.id}.json`), JSON.stringify(item), 'utf8');

  console.log(`[proposta] agendada para daqui a ${minutos(atraso)} min (${item.id.slice(0, 8)})`);
  armar(item, enviar);
}

/** Cria o timer e garante que o arquivo saia do disco depois do envio. */
function armar(
  item: Agendamento,
  enviar: (dados: ContactPayload, itens: QuoteItem[]) => Promise<void>,
): void {
  /* setTimeout satura acima de ~24,8 dias (o limite de 32 bits), e um valor
     maior dispara na hora. A janela aqui é de minutos, mas o clamp evita que
     um relógio torto ou um arquivo adulterado provoque envio imediato. */
  const espera = Math.min(Math.max(item.enviarEm - Date.now(), 0), 2_147_483_647);

  const timer = setTimeout(() => {
    timers.delete(item.id);
    enviar(item.dados, item.itens)
      .catch((err) => console.error('[proposta] falha ao enviar agendada:', err))
      // O arquivo sai do disco mesmo se o envio falhar: repetir indefinidamente
      // encheria a caixa do cliente com a mesma cotação.
      .finally(() => {
        unlink(join(PASTA, `${item.id}.json`)).catch(() => {});
      });
  }, espera);

  /* unref: um agendamento pendente não deve segurar o processo vivo no
     encerramento. O arquivo em disco é o que garante a retomada. */
  timer.unref();
  timers.set(item.id, timer);
}

/**
 * Relê a pasta na subida do processo.
 *
 * Reagenda o que ainda está no futuro, dispara o que venceu durante a parada e
 * descarta o que passou da validade.
 */
export async function retomarAgendados(
  enviar: (dados: ContactPayload, itens: QuoteItem[]) => Promise<void>,
): Promise<void> {
  let arquivos: string[];
  try {
    arquivos = (await readdir(PASTA)).filter((f) => f.endsWith('.json'));
  } catch {
    return; // pasta ainda não existe: nada agendado
  }

  let retomados = 0;
  let vencidos = 0;
  let descartados = 0;

  for (const arquivo of arquivos) {
    const caminho = join(PASTA, arquivo);
    try {
      const item = JSON.parse(await readFile(caminho, 'utf8')) as Agendamento;

      if (Date.now() - item.criadoEm > VALIDADE_MS) {
        await unlink(caminho).catch(() => {});
        descartados++;
        continue;
      }

      if (item.enviarEm <= Date.now()) vencidos++;
      else retomados++;
      armar(item, enviar);
    } catch {
      // JSON corrompido não tem como ser enviado; some com ele.
      await unlink(caminho).catch(() => {});
      descartados++;
    }
  }

  if (retomados || vencidos || descartados) {
    console.log(
      `[proposta] agendados: ${retomados} reagendados, ${vencidos} vencidos, ${descartados} descartados`,
    );
  }
}

/**
 * Apaga o que ficou para trás.
 *
 * Chamado na subida e uma vez por hora. Sem isso, um envio que falhou antes do
 * unlink, ou um arquivo escrito num deploy interrompido, ficaria no volume
 * para sempre.
 */
export async function limparAntigos(): Promise<number> {
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
      }
    } catch {
      /* Outro processo pode ter removido no meio do caminho. */
    }
  }
  return removidos;
}

/** Cancela os timers vivos, para o processo encerrar sem espera. */
export function encerrarAgenda(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
