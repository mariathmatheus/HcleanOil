/**
 * Identificadores de medição.
 *
 * O site não dispara conversão em código: empurra eventos no dataLayer (ver
 * lib/analytics.ts) e o container do GTM decide o que vira conversão, para
 * onde vai e com que rótulo. Disparar nos dois lugares contaria cada
 * conversão duas vezes.
 *
 * Os rótulos abaixo ficam como referência de quem configura o painel — o
 * código não os usa. São públicos de qualquer forma: aparecem no HTML de
 * qualquer site que use estas conversões.
 */

/**
 * Container do Google Tag Manager, e o domínio que o serve.
 *
 * `api.hcleanoil.com.br` é o endpoint Stape da própria zona: cookies de
 * primeira parte e um nome que os bloqueadores não conhecem.
 */
export const GTM_ID = 'GTM-KJFXS8JX';
export const GTM_HOST = 'https://api.hcleanoil.com.br';

/** Conta de conversões e remarketing. */
export const ADS_ID = 'AW-17481303192';

/** Propriedade do GA4. */
export const GA4_ID = 'G-XPZPW4K6KS';

/** Conversões que não dependem de produto. */
export const CONVERSOES = {
  lead: 'SEAICJ2nu6AbEJiJ3o9B',
  whatsapp: '1TGrCKCnu6AbEJiJ3o9B',
} as const;

/**
 * Visualização de produto, por slug.
 *
 * As três linhas de absorvente têm rótulo próprio porque são campanhas
 * separadas; os seis formatos (cordão, manta, rolo...) caem no rótulo geral
 * de absorventes, que é como as campanhas foram montadas.
 */
const POR_PRODUTO: Record<string, string> = {
  'barreira-de-contencao-seafence': 'hfzgCKOnu6AbEJiJ3o9B',
  'barreira-de-contencao-abfence': 'hfzgCKOnu6AbEJiJ3o9B',
  'kit-sopep': 'bwbPCKanu6AbEJiJ3o9B',
  'kit-primeiro-atendimento': 'bwbPCKanu6AbEJiJ3o9B',
  'tanque-terrestre-armazenamento': 'TCPfCKmnu6AbEJiJ3o9B',
  'absorvente-oleo-linha-branca': 'rR2UCK-nu6AbEJiJ3o9B',
  'absorvente-quimico-linha-verde': 'PwHKCLKnu6AbEJiJ3o9B',
  'absorvente-universal-linha-cinza': 'HUyNCLWnu6AbEJiJ3o9B',
  'turfa-organica-absorvente': 'zVMUCKynu6AbEJiJ3o9B',
};

/**
 * Absorventes em geral: usado pelas páginas de formato, que comparam linhas.
 *
 * É o mesmo rótulo da turfa. A conta só tem um rótulo para "Material
 * Absorventes todos", então os dois caminhos caem nele; se um dia a turfa
 * precisar de relatório separado, é criar um rótulo próprio no Ads.
 */
export const LABEL_ABSORVENTES = 'zVMUCKynu6AbEJiJ3o9B';

export function labelDoProduto(slug: string): string | undefined {
  return POR_PRODUTO[slug];
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara uma conversão.
 *
 * Silenciosa quando o gtag ainda não carregou — o script é `afterInteractive`
 * e um clique muito rápido pode chegar antes dele. Perder uma conversão é
 * melhor do que quebrar a página com um erro de script.
 */
export function conversao(
  label: string,
  extras?: { value?: number; currency?: string; transaction_id?: string },
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'conversion', {
    send_to: `${ADS_ID}/${label}`,
    ...extras,
  });
}

/**
 * Sinaliza ao Ads qual produto foi visto, para o remarketing ser dinâmico.
 *
 * Sem isto a audiência é genérica ("visitou o site") e não dá para anunciar
 * o SeaFence a quem olhou o SeaFence. `custom` é a vertical de quem não
 * vende no varejo; o `id` precisa casar com a coluna ID de um feed de
 * Business Data do tipo Custom carregado no Ads — sem o feed do outro lado,
 * o parâmetro não serve para nada.
 */
export function remarketing(itens: { id: string }[]): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  if (!itens.length) return;

  window.gtag('event', 'page_view', {
    send_to: ADS_ID,
    items: itens.map((i) => ({ id: i.id, google_business_vertical: 'custom' })),
  });
}
