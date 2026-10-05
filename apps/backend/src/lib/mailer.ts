import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env.js';
import { logoAttachment } from '../emails/logo.js';

let transporter: Transporter | null = null;
/** O host do transporte em cache, para o log dizer por onde o e-mail saiu. */
let hostEmUso: string | null = null;

/**
 * Os endereços do servidor de e-mail, na ordem de preferência.
 *
 * O primeiro é o configurado; os seguintes são alternativas do MESMO servidor.
 * Duplicatas saem porque tentar o mesmo nome duas vezes só dobra a espera.
 */
function hostsCandidatos(): string[] {
  return [...new Set([env.SMTP_HOST, ...env.SMTP_HOST_ALTERNATIVOS])];
}

function criarTransporte(host: string): Transporter {
  return nodemailer.createTransport({
    host,
    port: env.SMTP_PORT,
    // 465 usa TLS implícito; nas demais portas o STARTTLS é negociado.
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },

    /* Prazos explícitos. O padrão do nodemailer para abrir a conexão é de dois
       minutos, e o socket espera dez: um SMTP_HOST que aponte para um endereço
       morto (foi o que aconteceu quando o alvo do MX virou CNAME do túnel)
       segura a resposta do formulário até o sistema desistir do TCP. Quem
       preencheu fica olhando o botão girar e a borda da Cloudflare corta em
       100 s. Dez segundos é folga de sobra para este servidor, que responde o
       handshake em menos de dois.

       Com mais de um candidato o prazo também limita a soma: três hosts a dez
       segundos ainda cabem antes do corte da borda. */
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,

    /* O nome validado no certificado vem de SMTP_SERVERNAME e NÃO do host
       conectado. É o que permite conectar por IP literal — ou por um nome
       alternativo — sem desligar a verificação: a senha só viaja depois que o
       servidor provou ser quem diz ser. */
    ...(env.SMTP_SERVERNAME
      ? { tls: { servername: env.SMTP_SERVERNAME, rejectUnauthorized: true } }
      : {}),
  });
}

/** Qual endereço o transporte em uso está usando. Para o /health relatar. */
export function hostDeEnvio(): string | null {
  return hostEmUso;
}

/**
 * Descarta o transporte em cache.
 *
 * Necessário porque o transporte fica guardado: sem isto, um envio que passou
 * a sair por um endereço alternativo continuaria saindo por ele para sempre,
 * mesmo depois de o host configurado voltar — e o contorno viraria o normal,
 * silenciosamente, até a alternativa também cair.
 */
export function esquecerTransporte() {
  transporter?.close?.();
  transporter = null;
  hostEmUso = null;
}

/**
 * Abre um transporte que de fato conecta, percorrendo os candidatos.
 *
 * O transporte que funcionou fica em cache: o custo de descobrir é pago uma
 * vez, não a cada e-mail. Quando nenhum conecta, o erro propagado é o do
 * PRIMEIRO candidato — o host configurado — porque é o que descreve o
 * problema real; o do IP literal no fim da lista só confundiria o diagnóstico.
 */
async function transporteVivo(): Promise<Transporter> {
  if (transporter) return transporter;

  const candidatos = hostsCandidatos();
  let primeiroErro: unknown;

  for (const host of candidatos) {
    const tentativa = criarTransporte(host);
    try {
      await tentativa.verify();
      transporter = tentativa;
      hostEmUso = host;
      if (host !== candidatos[0]) {
        /* Alto de propósito: o envio foi salvo, mas a configuração continua
           errada e alguém precisa consertá-la antes de a alternativa cair
           também. A vigilância relata isso pelo /health. */
        console.error(
          `[smtp] "${candidatos[0]}" não respondeu; enviando por "${host}".` +
            ' Corrija o SMTP_HOST — este é um contorno, não a solução.',
        );
      }
      return tentativa;
    } catch (err) {
      primeiroErro ??= err;
      tentativa.close?.();
      console.error(`[smtp] "${host}" falhou: ${err instanceof Error ? err.message : err}`);
    }
  }

  throw primeiroErro ?? new Error('nenhum host SMTP configurado respondeu');
}

type SendArgs = {
  to: string;
  cc?: string;
  /** Cópia oculta. Vazio quando MAIL_BCC não está configurado. */
  bcc?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Anexos além da marca — a proposta em PDF, por exemplo. */
  anexos?: { filename: string; content: Buffer }[];
};

export async function sendMail({
  to,
  cc,
  bcc = env.MAIL_BCC,
  subject,
  html,
  text,
  replyTo,
  anexos = [],
}: SendArgs) {
  /* `transporteVivo` e não `getTransporter`: se o host configurado não
     resolve, o e-mail sai por um endereço alternativo do mesmo servidor em
     vez de falhar. O lead já estaria gravado em disco e seria reenviado, mas
     "reenviado em algum momento" não é o mesmo que "chegou agora" para quem
     precisa responder a um pedido de orçamento. */
  const transport = await transporteVivo();

  return transport.sendMail({
    from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM}>`,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    // A marca do cabeçalho viaja junto; sem isso o cid não resolve.
    attachments: [logoAttachment, ...anexos],
  });
}

/**
 * Confere as credenciais na subida do processo, para falhar cedo.
 *
 * Passa pelos candidatos: o /health deve dizer "ok" quando o envio funciona
 * por QUALQUER um deles, senão alertaria sobre um problema que não existe —
 * e um alerta que mente é um alerta que ninguém lê depois.
 */
export async function verifyConnection() {
  await transporteVivo();
}
