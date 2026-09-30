import express from 'express';
import cors from 'cors';
import { env } from './lib/env.js';
import { conferirSmtp, estadoSmtp } from './lib/saude.js';
import { contatoRouter, enviarPropostaAutomatica } from './routes/contato.js';
import { retomarAgendados, limparAntigos, encerrarAgenda } from './proposta/agenda.js';
import {
  retomarPendentes,
  limparVencidos,
  encerrarFila,
  pendentesNaFila,
} from './leads/fila.js';

const app = express();

app.set('trust proxy', 1); // atrás de proxy/CDN, para o rate limit ver o IP real
app.use(express.json({ limit: '64kb' }));
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ['POST', 'GET'],
  }),
);

/**
 * Estado do serviço.
 *
 * Continua respondendo 200 mesmo com o SMTP fora, e isso é deliberado. O
 * healthcheck do Docker mata e recria o container que falha, e reiniciar não
 * consertaria um MX apontado para o lugar errado — só tiraria do ar o site que
 * estava servindo bem, e derrubaria com ele os timers de retentativa da fila.
 * Um 503 aqui transformaria um problema de DNS em indisponibilidade total.
 *
 * O que faltava no incidente não era o container morrer: era alguém conseguir
 * ver que o SMTP estava fora. Por isso o estado vai no corpo. `ok` responde
 * "o processo serve requisições"; `smtp` e `leadsPendentes` respondem "os
 * leads estão chegando na caixa comercial" — e é `leadsPendentes > 0` de forma
 * sustentada que merece alerta no monitoramento.
 */
app.get('/health', (_req, res) => {
  const smtp = estadoSmtp();
  res.json({
    ok: true,
    smtp: smtp.estado,
    ...(smtp.detalhe ? { smtpErro: smtp.detalhe } : {}),
    ...(smtp.verificadoEm ? { smtpVerificadoEm: smtp.verificadoEm } : {}),
    leadsPendentes: pendentesNaFila(),
  });
});
app.use('/api', contatoRouter);

app.listen(env.PORT, () => {
  console.log(`HCLEAN API em http://localhost:${env.PORT}`);

  /* Diagnóstico de credenciais: avisa cedo, mas não derruba o processo —
     o /health continua respondendo enquanto o SMTP é ajustado. O resultado
     agora fica guardado e aparece no /health: antes ficava só no console, e o
     container seguia "saudável" enquanto todo lead era recusado.

     Reconfere de dez em dez minutos, para o /health refletir a recuperação
     (ou a queda) sem precisar de restart. */
  const conferir = () =>
    conferirSmtp().then((estado) =>
      console.log(
        estado === 'ok' ? 'SMTP conectado.' : `SMTP indisponível: ${estadoSmtp().detalhe}`,
      ),
    );
  conferir();
  setInterval(conferir, 10 * 60 * 1000).unref();

  /* Leads gravados que o SMTP ainda não aceitou. Estes são pedidos reais de
     clientes que já viram "enviado" na tela — reenviar é obrigatório. */
  retomarPendentes().catch((err) => console.error('[lead] falha ao retomar pendentes:', err));

  /* Propostas que ficaram agendadas quando o processo parou. O que venceu
     durante a parada sai agora; o resto volta para a fila. */
  retomarAgendados(enviarPropostaAutomatica).catch((err) =>
    console.error('[proposta] falha ao retomar agendados:', err),
  );

  /* Varredura do que ficou para trás: um envio que falhou depois de gravar,
     ou um arquivo de um deploy interrompido. Sem isso o volume só cresce. */
  const faxina = () => {
    limparAntigos()
      .then((n) => n && console.log(`[proposta] ${n} agendamento(s) antigo(s) removido(s)`))
      .catch(() => {});
    limparVencidos()
      .then((n) => n && console.error(`[lead] ${n} lead(s) vencido(s) removido(s) sem envio`))
      .catch(() => {});
  };
  faxina();
  setInterval(faxina, 60 * 60 * 1000).unref();
});

/* Encerramento limpo: o Docker manda SIGTERM no restart. Os timers são
   descartados, mas os arquivos ficam no volume e voltam na próxima subida. */
for (const sinal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sinal, () => {
    encerrarAgenda();
    encerrarFila();
    process.exit(0);
  });
}
