/**
 * Gera o feed de Business Data do Google Ads.
 *
 * O remarketing dinâmico precisa de um catálogo do lado do Ads com os mesmos
 * ids que o site envia em `items` (ver src/lib/ads.ts). Sem o feed, o
 * parâmetro viaja mas não casa com nada, e a audiência continua genérica.
 *
 * O id é o slug do produto, que é o que `remarketing()` manda. Mudar o slug
 * de um produto exige regerar e subir o feed de novo, senão a linha órfã
 * deixa de casar.
 *
 *   node scripts/gerar-feed-ads.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '..', '..', 'feed-google-ads.csv');

const { products, site } = await import('../src/data/site.ts');

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const linhas = products.map((p) => [
  p.slug,
  p.name,
  (p.lead ?? p.name).replace(/\s+/g, ' '),
  `${site.url}/produtos/${p.slug}`,
  p.image ? `${site.url}${p.image}` : '',
]);

const csv = ['ID,Item title,Item description,Final URL,Image URL']
  .concat(linhas.map((l) => l.map(esc).join(',')));

writeFileSync(SAIDA, csv.join('\n') + '\n', 'utf8');
console.log(`feed com ${linhas.length} produtos -> ${SAIDA}`);
