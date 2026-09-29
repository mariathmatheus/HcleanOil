/**
 * Gera os dois e-mails em HTML para inspeção no navegador, sem precisar de
 * SMTP configurado nem disparar mensagem real.
 *
 *   npm run email:preview   ->  apps/backend/preview/*.html
 *
 * O cid: da marca não resolve fora de um cliente de e-mail, então aqui ele é
 * trocado por um data URI só para a pré-visualização.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leadNotification, leadConfirmation } from './templates.js';
import { logoAttachment } from './logo.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', '..', 'preview');
mkdirSync(outDir, { recursive: true });

const dataUri = `data:image/png;base64,${logoAttachment.content.toString('base64')}`;
const inlineLogo = (html: string) => html.replaceAll('cid:hclean-mark', dataUri);

const sample = {
  nome: 'Ana Souza',
  empresa: 'Terminal Portuário Exemplo',
  email: 'contato@exemplo.com.br',
  telefone: '(11) 90000-0000',
  estado: 'RJ',
  produto: 'Barreira de Contenção SeaFence',
  mensagem:
    'Precisamos avaliar barreiras de contenção para o píer de transferência de combustível. ' +
    'A operação fica em área abrigada, com corrente baixa.\n\n' +
    'Gostaríamos de entender as opções disponíveis e as condições de fornecimento.',
};

const notification = leadNotification({ ...sample, receivedAt: '19/08/2026 14:32' });
const confirmation = leadConfirmation(sample);

writeFileSync(join(outDir, 'notificacao.html'), inlineLogo(notification.html), 'utf8');
writeFileSync(join(outDir, 'confirmacao.html'), inlineLogo(confirmation.html), 'utf8');

console.log('Pré-visualização gerada em apps/backend/preview/');
console.log(`  notificacao.html  — assunto: ${notification.subject}`);
console.log(`  confirmacao.html  — assunto: ${confirmation.subject}`);
