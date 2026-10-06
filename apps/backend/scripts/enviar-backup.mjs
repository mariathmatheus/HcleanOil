/**
 * Manda o backup para fora do servidor, por e-mail.
 *
 * Existe porque o backup diario fica NO MESMO DISCO que ele protege. Cobre
 * container recriado e `docker volume rm`, que sao os casos provaveis — mas se
 * a VPS for perdida, as copias vao com ela.
 *
 * Em Node e nao em shell com `mutt`: o mutt precisaria da propria configuracao
 * de SMTP, com a senha repetida num segundo lugar para manter em sincronia.
 * Aqui o envio usa o MESMO transporte do site, com o mesmo contorno de host
 * alternativo — o que ja foi testado e consertado valendo tambem para isto.
 *
 * Dois anexos, com papeis diferentes:
 *
 *   propostas-*.tar.gz   para RESTAURAR. Volta direto no `restaurar.sh`.
 *   leads-historico.csv  para CONSULTAR. Uma linha por lead desde sempre,
 *                        nada apagado, abre no Excel. E este o historico
 *                        real: a fila esvazia quando o e-mail sai, o CSV nao.
 *
 * Roda dentro do container, onde o .env e o SMTP ja estao:
 *   docker compose exec -T backend node scripts/enviar-backup.mjs /caminho.tar.gz
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

const { sendMail } = await import('../dist/lib/mailer.js');
const { env } = await import('../dist/lib/env.js');

const PASTA_BACKUP = process.env.PASTA_BACKUP ?? '/backups';
const CSV = join(env.PROPOSTAS_DIR, 'leads-historico.csv');

/** O backup mais recente da pasta. */
async function ultimoBackup() {
  const explicito = process.argv[2];
  if (explicito) return explicito;

  const nomes = (await readdir(PASTA_BACKUP)).filter(
    (n) => n.startsWith('propostas-') && n.endsWith('.tar.gz'),
  );
  if (!nomes.length) throw new Error(`nenhum backup em ${PASTA_BACKUP}`);
  /* O nome carrega a data em ISO, entao ordem alfabetica E ordem cronologica
     — nao precisa consultar o mtime de cada arquivo. */
  nomes.sort();
  return join(PASTA_BACKUP, nomes[nomes.length - 1]);
}

const caminho = await ultimoBackup();
const tar = await readFile(caminho);
const anexos = [{ filename: basename(caminho), content: tar }];

let linhas = 0;
try {
  const csv = await readFile(CSV);
  /* Menos o cabecalho. O BOM nao conta como linha. */
  linhas = csv.toString('utf8').split('\n').filter((l) => l.trim()).length - 1;
  anexos.push({ filename: 'leads-historico.csv', content: csv });
} catch {
  /* Sem CSV ainda: nenhum lead passou pelo formulario desde a mudanca. Manda
     so o tar, em vez de falhar — o backup de restauracao e o que nao pode
     deixar de sair. */
}

const mb = (tar.length / 1024 / 1024).toFixed(2);
const texto = `Backup do site HCLEAN.

Arquivo de restauracao: ${basename(caminho)} (${mb} MB)
Planilha de leads: ${linhas} registro(s) desde o inicio

O .tar.gz serve para restaurar o servidor:
  sh infra/backup/restaurar.sh <arquivo>

O .csv e o historico completo dos pedidos de orcamento, para abrir no Excel.
Nenhuma linha dele e apagada: a fila do servidor esvazia quando o e-mail sai,
esta planilha nao.

Guarde esta mensagem. Se a VPS for perdida, estes anexos sao a copia que sobra.`;

await sendMail({
  to: env.MAIL_TO,
  subject: `[HCLEAN] Backup semanal — ${linhas} leads`,
  text: texto,
  html: `<pre style="font:14px/1.5 monospace">${texto.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])}</pre>`,
  anexos,
});

console.log(`[backup] enviado para ${env.MAIL_TO}: ${basename(caminho)} (${mb} MB), ${linhas} leads`);
