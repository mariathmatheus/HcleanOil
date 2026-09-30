import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contactSchema, extractItems, type ContactPayload, type QuoteItem } from '../lib/schema.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../lib/env.js';
import { leadNotification, leadConfirmation } from '../emails/templates.js';
import { propostaParaCliente, propostaParaEquipe } from '../emails/proposta.js';
import { gerarProposta } from '../proposta/gerar.js';
import { montarOrcamento } from '../proposta/orcamento.js';
import { agendarProposta } from '../proposta/agenda.js';
import { registrarLead } from '../lib/medicao.js';
import { gravarLead, enviarEmSegundoPlano } from '../leads/fila.js';
import { randomUUID } from 'node:crypto';

export const contatoRouter = Router();

/* Um formulário de contato é alvo fácil de spam; 5 envios por IP a cada
   15 minutos é folgado para uso real e curto para robô. */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Muitas solicitações. Tente novamente em alguns minutos.',
  },

  /* Só pedido aceito consome a cota. Antes, quem errasse o telefone três vezes
     — e o 400 de validação é justamente o erro de quem está preenchendo de
     verdade — gastava mais da metade da cota antes de conseguir enviar o
     primeiro lead. O robô continua contido: ele busca o 200, e é o 200 que
     conta. (`skipFailedRequests` do express-rate-limit 7.5.0 devolve o hit
     quando a resposta sai com status >= 400.) */
  skipFailedRequests: true,
});

/**
 * Extrai o client id do cookie _ga.
 *
 * O cookie tem o formato "GA1.1.1234567890.1699999999"; o identificador que
 * o GA4 usa são os dois últimos campos juntos.
 */
function clientIdDoGa(cookie?: string): string | undefined {
  if (!cookie) return undefined;
  const partes = cookie.split('.');
  return partes.length >= 4 ? `${partes[2]}.${partes[3]}` : cookie;
}

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d);

contatoRouter.post('/contato', limiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
    });
  }

  const data = parsed.data;

  // Honeypot preenchido: responde como sucesso para não ensinar o robô.
  if (data.empresa_site) {
    return res.json({ ok: true });
  }

  /* As quantidades chegam em campos de nome dinâmico; separá-las uma vez só
     serve tanto ao e-mail de notificação quanto ao cálculo da proposta. */
  const itens = extractItems(data);

  /* Identificador do lead. Viaja na resposta e no evento server-side para o
     container de medição deduplicar os dois caminhos. */
  const leadId = randomUUID();

  /* Valor estimado do pedido, pela mesma tabela que monta a proposta.
     Sem `value` o Google Ads nao consegue otimizar por valor de conversao:
     "maximizar valor" e tROAS ficam cegos e todo lead pesa igual, o de uma
     manta e o de um kit de mil litros.

     Pedido que exige cotacao entra com o que ja tem preco de tabela; quando
     nem isso existe, vai um valor de referencia em vez de zero — zero
     desligaria o lance por valor para esse lead. */
  const orcamento = montarOrcamento(itens, {
    produto: data.produto || undefined,
    estado: data.estado || undefined,
  });
  const valorLead = orcamento.total > 0 ? orcamento.total : env.VALOR_LEAD_SEM_PRECO;

  /* Hora em que o pedido chegou, congelada aqui. Vai no arquivo da fila para
     que um reenvio de amanhã continue dizendo "recebido em" a hora certa, e
     não a hora em que o SMTP voltou. */
  const recebidoEm = formatDate(new Date());
  const naFila = { leadId, recebidoEm, valor: valorLead, dados: data, itens };

  /* O lead é o que não pode se perder — e é justamente por isso que o e-mail
     deixou de ser o que a resposta espera.

     Antes a rota aguardava o sendMail e devolvia 502 em falha. Quando o MX da
     zona passou a apontar para um túnel que não fala SMTP, cada envio pendurou
     vinte segundos e voltou 502: o usuário viu erro e o pedido não ficou em
     lugar nenhum, porque nada o havia gravado. O que não pode se perder tem de
     estar em disco antes de a resposta sair, não na caixa de e-mail.

     Gravação em disco leva milissegundos e não depende de rede. */
  try {
    await gravarLead(naFila);
  } catch (err) {
    /* Disco cheio ou volume somente-leitura: o único caso em que não existe
       cópia do lead. Aqui o e-mail bloqueante volta a ser a melhor chance —
       melhor esperar o SMTP do que descartar o pedido em silêncio. */
    console.error('[contato] falha ao gravar lead em disco:', err);
    try {
      const notificacao = leadNotification({ ...data, items: itens, receivedAt: recebidoEm });
      await sendMail({
        to: env.MAIL_TO,
        subject: notificacao.subject,
        html: notificacao.html,
        text: notificacao.text,
        replyTo: `"${data.nome}" <${data.email}>`,
      });
    } catch (erroEnvio) {
      console.error('[contato] lead sem disco e sem e-mail:', erroEnvio);
      return res.status(502).json({
        ok: false,
        error:
          'Não foi possível enviar sua solicitação agora. Tente novamente ou escreva para contato@hcleanoil.com.br.',
      });
    }
  }

  /* A partir daqui nada bloqueia a resposta: o lead já está registrado em
     disco, e o cliente não deve esperar nem o SMTP nem a geração do PDF para
     ver "enviado" na tela. O formato desta resposta é contrato com o
     frontend — `leadId` e `valor` alimentam o evento generate_lead. */
  res.json({ ok: true, leadId, valor: valorLead });

  /* Notificação para a caixa comercial, agora depois da resposta. Falha aqui
     não chega ao usuário: a fila retenta com recuo e, se o SMTP continuar
     fora, o arquivo espera a próxima subida do processo. */
  enviarEmSegundoPlano(naFila);

  /* Medição server-side, depois da resposta: o evento do navegador pode não
     chegar por causa de bloqueador, e este não depende do cliente. Falha aqui
     não afeta o lead, que já está na caixa comercial. */
  registrarLead({
    leadId,
    valor: valorLead,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone || undefined,
    estado: data.estado || undefined,
    produtos: data.produto || undefined,
    itens,
    /* O cookie _ga vem como "GA1.1.<clientId>.<timestamp>"; o container
       espera só as duas últimas partes. Sem isso cada lead server-side vira
       sessão nova e a conversão perde a campanha que a originou. */
    clientId: clientIdDoGa(data._ga),
    gclid: data.gclid || data.gbraid || data.wbraid || data._gcl_aw || undefined,
    paginaOrigem: data.pagina_origem || undefined,
    utms: Object.fromEntries(
      Object.entries(data).filter(
        ([k, v]) => k.startsWith('utm_') && typeof v === 'string' && v,
      ) as [string, string][],
    ),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  }).catch(() => {});

  /* A confirmação é cortesia: se falhar, o lead já está em disco e a fila
     cuida da notificação — apenas registra. Segue não-bloqueante. */
  if (env.SEND_CONFIRMATION) {
    const confirmation = leadConfirmation(data);
    sendMail({
      to: data.email,
      replyTo: env.MAIL_TO,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    }).catch((err) => {
      console.error('[contato] falha ao enviar confirmação:', err);
    });
  }

  /* Proposta em PDF, alguns minutos depois — o tempo de quem monta a cotação
     à mão. O agendamento é gravado em disco antes de a requisição terminar,
     então um deploy no meio da janela não perde o envio.

     Só sai automaticamente quando todo item tem preço de tabela — havendo
     item sob cotação (hoje só o tanque), a equipe precifica à mão. */
  if (env.ENVIAR_PROPOSTA) {
    agendarProposta(data, itens, enviarPropostaAutomatica).catch((err) => {
      console.error('[proposta] falha ao agendar:', err);
    });
  }
});

/**
 * Gera a proposta e envia ao cliente, com cópia para a equipe.
 *
 * Roda depois da resposta HTTP: renderizar o PDF leva cerca de um segundo, e
 * segurar o formulário por isso pioraria a experiência de quem enviou.
 */
export async function enviarPropostaAutomatica(
  data: ContactPayload,
  itens: QuoteItem[],
): Promise<void> {
  if (!itens.length) return; // pedido sem quantidade: nada a cotar

  const proposta = await gerarProposta({
    nome: data.nome,
    empresa: data.empresa,
    email: data.email,
    telefone: data.telefone || undefined,
    estado: data.estado || undefined,
    produto: data.produto || undefined,
    mensagem: data.mensagem || undefined,
    itens,
  });

  if (proposta.orcamento.exigeCotacao) {
    /* Há item sem preço. A proposta vai só para a equipe, que completa os
       valores antes de mandar ao cliente — melhor atrasar do que enviar um
       documento comercial incompleto. */
    const aviso = propostaParaEquipe(data, proposta);
    await sendMail({
      to: env.MAIL_TO,
      /* O corpo deste aviso pede para responder ao cliente, mas sem isto o
         botão "Responder" caía na própria caixa que enviou. */
      replyTo: `"${data.nome}" <${data.email}>`,
      subject: aviso.subject,
      html: aviso.html,
      text: aviso.text,
      anexos: [{ filename: proposta.arquivo, content: proposta.pdf }],
    });
    console.log(`[proposta] ${proposta.numero} exige cotação — enviada só à equipe`);
    return;
  }

  const email = propostaParaCliente(data, proposta);
  await sendMail({
    to: data.email,
    /* Cópia oculta, não `cc`: em cópia visível o cliente enxerga a caixa
       interna, e um "responder a todos" dele vira ruído na equipe. */
    bcc: env.MAIL_TO,
    /* O corpo diz "é só responder a este e-mail", então a resposta precisa
       chegar na caixa comercial — não no remetente de disparo. */
    replyTo: env.MAIL_TO,
    subject: email.subject,
    html: email.html,
    text: email.text,
    anexos: [{ filename: proposta.arquivo, content: proposta.pdf }],
  });
  console.log(`[proposta] ${proposta.numero} enviada para ${data.email}`);
}
