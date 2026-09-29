import express from 'express';
import cors from 'cors';
import { env } from './lib/env.js';
import { verifyConnection } from './lib/mailer.js';
import { contatoRouter, enviarPropostaAutomatica } from './routes/contato.js';
import { retomarAgendados, limparAntigos, encerrarAgenda } from './proposta/agenda.js';

const app = express();

app.set('trust proxy', 1); // atrás de proxy/CDN, para o rate limit ver o IP real
app.use(express.json({ limit: '64kb' }));
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ['POST', 'GET'],
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', contatoRouter);

app.listen(env.PORT, () => {
  console.log(`HCLEAN API em http://localhost:${env.PORT}`);

  // Diagnóstico de credenciais: avisa cedo, mas não derruba o processo —
  // o /health continua respondendo enquanto o SMTP é ajustado.
  verifyConnection()
    .then(() => console.log('SMTP conectado.'))
    .catch((err) => console.error('SMTP indisponível:', err.message));

  /* Propostas que ficaram agendadas quando o processo parou. O que venceu
     durante a parada sai agora; o resto volta para a fila. */
  retomarAgendados(enviarPropostaAutomatica).catch((err) =>
    console.error('[proposta] falha ao retomar agendados:', err),
  );

  /* Varredura do que ficou para trás: um envio que falhou depois de gravar,
     ou um arquivo de um deploy interrompido. Sem isso o volume só cresce. */
  const faxina = () =>
    limparAntigos()
      .then((n) => n && console.log(`[proposta] ${n} agendamento(s) antigo(s) removido(s)`))
      .catch(() => {});
  faxina();
  setInterval(faxina, 60 * 60 * 1000).unref();
});

/* Encerramento limpo: o Docker manda SIGTERM no restart. Os timers são
   descartados, mas os arquivos ficam no volume e voltam na próxima subida. */
for (const sinal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sinal, () => {
    encerrarAgenda();
    process.exit(0);
  });
}
