import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contactSchema, extractItems, type ContactPayload, type QuoteItem } from '../lib/schema.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../lib/env.js';
import { leadNotification, leadConfirmation } from '../emails/templates.js';
import { propostaParaCliente, propostaParaEquipe } from '../emails/proposta.js';
import { gerarProposta } from '../proposta/gerar.js';
import { agendarProposta } from '../proposta/agenda.js';
import { registrarLead } from '../lib/medicao.js';
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
});

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

  const notification = leadNotification({
    ...data,
    items: itens,
    receivedAt: formatDate(new Date()),
  });

  try {
    // O lead é o que não pode se perder — envia e confirma antes de responder.
    await sendMail({
      to: env.MAIL_TO,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
      // Responder no cliente de e-mail fala direto com quem preencheu.
      replyTo: `"${data.nome}" <${data.email}>`,
    });
  } catch (err) {
    console.error('[contato] falha ao enviar notificação:', err);
    return res.status(502).json({
      ok: false,
      error:
        'Não foi possível enviar sua solicitação agora. Tente novamente ou escreva para contato@hcleanoil.com.br.',
    });
  }

  /* A partir daqui nada bloqueia a resposta: o lead já está registrado, e o
     cliente não deve esperar a geração do PDF para ver "enviado" na tela. */
  res.json({ ok: true, leadId });

  /* Medição server-side, depois da resposta: o evento do navegador pode não
     chegar por causa de bloqueador, e este não depende do cliente. Falha aqui
     não afeta o lead, que já está na caixa comercial. */
  registrarLead({
    leadId,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone || undefined,
    estado: data.estado || undefined,
    produtos: data.produto || undefined,
    itens,
    // `_ga` traz o client id do GA4; sem ele o container trata como sessão nova.
    clientId: typeof req.body?._ga === 'string' ? req.body._ga : undefined,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  }).catch(() => {});

  // A confirmação é cortesia: se falhar, o lead já está salvo — apenas registra.
  if (env.SEND_CONFIRMATION) {
    const confirmation = leadConfirmation(data);
    sendMail({
      to: data.email,
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
    cc: env.MAIL_TO,
    subject: email.subject,
    html: email.html,
    text: email.text,
    anexos: [{ filename: proposta.arquivo, content: proposta.pdf }],
  });
  console.log(`[proposta] ${proposta.numero} enviada para ${data.email}`);
}
