import { z } from 'zod';

/**
 * Validação do formulário de orçamento. Espelha os campos do site; tudo que
 * chega de fora passa por aqui antes de virar e-mail.
 */
export const contactSchema = z
  .object({
    nome: z.string().trim().min(2, 'Informe seu nome.').max(120),
    empresa: z.string().trim().min(2, 'Informe o nome da empresa.').max(160),
    email: z.string().trim().email('Informe um e-mail válido.').max(180),
    telefone: z.string().trim().max(40).optional().or(z.literal('')),
    /* Estado de entrega — define o frete: CIF no Sudeste a partir de
       R$ 1.000, FOB no resto. */
    estado: z.string().trim().max(40).optional().or(z.literal('')),
    produto: z.string().trim().max(160).optional().or(z.literal('')),
    mensagem: z.string().trim().max(4000).optional().or(z.literal('')),
    consentimento: z.union([z.literal('on'), z.boolean(), z.undefined()]).optional(),

    /* Honeypot: o formulário mantém este campo escondido, então só um robô o
       preenche. Aceita qualquer valor de propósito — quem decide o que fazer é
       a rota, que responde 200 e descarta em silêncio. Rejeitar aqui devolveria
       um 400 e ensinaria ao robô exatamente qual campo o denunciou. */
    empresa_site: z.string().max(200).optional(),

    /* Identificadores de campanha, usados só na medição server-side. Limite
       curto de propósito: são identificadores, não texto livre. */
    _ga: z.string().max(120).optional(),
    _gcl_aw: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    pagina_origem: z.string().max(300).optional(),
  })
  /* As quantidades vêm com nomes dinâmicos, montados a partir do produto
     escolhido ("Kit SOPEP 50 L — Quantidade", "Manta absorvente — Quantidade").
     `passthrough` preserva essas chaves, que a rota normaliza em itens. */
  .passthrough();

export type ContactPayload = z.infer<typeof contactSchema>;

/** Um item do pedido, já pronto para a tabela do e-mail. */
export type QuoteItem = { label: string; value: string };

const KNOWN = new Set([
  'nome',
  'empresa',
  'email',
  'telefone',
  'estado',
  'produto',
  'mensagem',
  'consentimento',
  'empresa_site',
  /* Campos de medição. Precisam estar aqui: `extractItems` trata como item
     do pedido tudo que não conhece, e sem isso o identificador do GA4
     apareceria como uma linha de quantidade no e-mail e na proposta. */
  '_ga',
  '_gcl_aw',
  'gclid',
  'pagina_origem',
]);

/**
 * Separa os campos dinâmicos de quantidade do restante do formulário.
 *
 * O formulário envia uma caixa `item:<variante>` por variante marcada e um
 * campo por medida. Aqui as caixas viram apenas marcação de presença e o que
 * segue para o e-mail são os valores preenchidos, na ordem em que chegaram.
 */
export function extractItems(payload: Record<string, unknown>): QuoteItem[] {
  const items: QuoteItem[] = [];

  for (const [key, raw] of Object.entries(payload)) {
    if (KNOWN.has(key)) continue;
    if (key.startsWith('item:')) continue; // só sinaliza a variante marcada
    if (typeof raw !== 'string' && typeof raw !== 'number') continue;

    const value = String(raw).trim();
    if (!value) continue;

    // Nomes e valores vêm do cliente: limita tamanho antes de exibir.
    items.push({ label: key.slice(0, 120), value: value.slice(0, 80) });
  }

  return items;
}
