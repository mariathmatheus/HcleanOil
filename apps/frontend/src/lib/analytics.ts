/**
 * Camada de eventos do site.
 *
 * Tudo sai pelo `dataLayer`, nunca direto para GA4 ou Ads. Quem decide o
 * destino de cada evento é o container do GTM: acrescentar uma ferramenta
 * vira configuração de painel, não deploy de código.
 *
 * Os nomes seguem o vocabulário de e-commerce do GA4 (`view_item`,
 * `add_to_cart`, `begin_checkout`, `generate_lead`). Não é uma loja, mas o
 * funil é o mesmo, e o vocabulário padrão libera os relatórios prontos do
 * GA4 sem mapeamento manual.
 */

/** Item no formato que o GA4 espera em `items`. */
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  /** Variante escolhida: formato do absorvente, capacidade do kit. */
  item_variant?: string;
  quantity?: number;
  price?: number;
};

type EventoPadrao = {
  event: string;
  /* `ecommerce` é o envelope que o GA4 lê. Ele precisa ser limpo antes de
     cada push, senão o evento seguinte herda os itens do anterior — é o erro
     clássico de dataLayer em SPA, e o Next navega sem recarregar a página. */
  ecommerce?: Record<string, unknown>;
  [chave: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Empurra um evento para o dataLayer, de onde o container do GTM o lê.
 *
 * Funciona mesmo antes de o container carregar: o array existe desde o
 * `beforeInteractive`, e o GTM processa o que já estiver nele ao subir.
 */
export function enviarEvento(evento: EventoPadrao): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer ?? [];

  /* Zera o envelope anterior antes de empurrar o novo. Sem isso um
     `generate_lead` carrega os itens do `view_item` da página anterior e o
     relatório mistura produtos que o visitante nunca pediu. */
  if (evento.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  window.dataLayer.push(evento);
}

/** Visualização de uma página de produto. */
export function verProduto(item: AnalyticsItem): void {
  enviarEvento({
    event: 'view_item',
    ecommerce: { currency: 'BRL', items: [item] },
  });
}

/** Visualização de uma lista: vitrine, categoria, página por formato. */
export function verLista(lista: string, itens: AnalyticsItem[]): void {
  enviarEvento({
    event: 'view_item_list',
    ecommerce: { item_list_name: lista, items: itens },
  });
}

/** Abertura do pop-up de orçamento. */
export function abrirOrcamento(origem: string, item?: AnalyticsItem): void {
  enviarEvento({
    event: 'begin_checkout',
    origem_cta: origem,
    ecommerce: { currency: 'BRL', items: item ? [item] : [] },
  });
}

/** Produto acrescentado ao pedido dentro do pop-up. */
export function adicionarAoPedido(item: AnalyticsItem): void {
  enviarEvento({
    event: 'add_to_cart',
    ecommerce: { currency: 'BRL', items: [item] },
  });
}

/** Produto retirado do pedido. */
export function removerDoPedido(item: AnalyticsItem): void {
  enviarEvento({
    event: 'remove_from_cart',
    ecommerce: { currency: 'BRL', items: [item] },
  });
}

/**
 * Lead enviado com sucesso.
 *
 * `lead_id` é gerado pelo backend e repetido aqui para o evento do navegador e
 * o do servidor poderem ser deduplicados no GTM server-side. Sem ele, um lead
 * que chega pelos dois caminhos é contado duas vezes.
 */
export function enviarLead(dados: {
  leadId?: string;
  /** Valor estimado do pedido, vindo do servidor. */
  valor?: number;
  itens: AnalyticsItem[];
  estado?: string;
  produtos?: string;
}): void {
  enviarEvento({
    event: 'generate_lead',
    lead_id: dados.leadId,
    estado_entrega: dados.estado,
    produtos_pedidos: dados.produtos,
    ecommerce: {
      currency: 'BRL',
      /* Sem `value` o Google Ads trata todo lead como igual e o lance por
         valor fica cego. O número vem do servidor, que é quem tem a tabela
         de preços. */
      value: dados.valor,
      items: dados.itens,
    },
  });
}

/**
 * Identificadores de campanha guardados no navegador.
 *
 * Vão junto com o formulário para a API poder atribuir a conversão
 * server-side à campanha certa. O evento do navegador pode não chegar
 * (bloqueador), e é no tráfego pago que isso mais acontece — sem estes
 * campos, o lead que chega pelo servidor parece tráfego direto.
 */
/** Parâmetros de campanha que o Google Ads e o Meta usam. */
const UTMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;

/* Identificadores do clique no anúncio. O gclid é o que o Google Ads usa
   para casar a conversão com o anúncio exato; sem ele a conversão existe mas
   não se liga a nenhuma campanha. Some da URL na primeira navegação, igual
   às UTMs. */
const CLIQUES = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'] as const;

const CHAVE_UTM = 'hclean-utms';

/**
 * Guarda as UTMs da primeira visita.
 *
 * Elas chegam na URL do clique no anúncio e somem na primeira navegação
 * interna — mas a conversão quase sempre acontece algumas páginas depois.
 * Sem persistir, o lead que veio de campanha paga é contado como tráfego
 * direto, e o relatório do anúncio fica vazio.
 *
 * Só grava quando há alguma UTM na URL: uma visita direta não pode apagar a
 * atribuição de uma campanha que trouxe a pessoa antes.
 */
export function guardarUtms(): void {
  if (typeof window === 'undefined') return;

  const busca = new URLSearchParams(window.location.search);
  const daUrl: Record<string, string> = {};
  for (const chave of [...UTMS, ...CLIQUES]) {
    const valor = busca.get(chave);
    if (valor) daUrl[chave] = valor.slice(0, 200);
  }
  /* Vale como origem quando não há utm_source: é assim que o tráfego
     orgânico e o de indicação se distinguem do direto. */
  if (!Object.keys(daUrl).length) return;

  try {
    sessionStorage.setItem(
      CHAVE_UTM,
      JSON.stringify({ ...daUrl, utm_captured_at: new Date().toISOString() }),
    );
  } catch {
    /* Navegador com armazenamento bloqueado: a UTM ainda viaja se a
       conversão acontecer na mesma página. */
  }
}

/** Lê as UTMs guardadas, com o que estiver na URL tendo prioridade. */
function lerUtms(): Record<string, string> {
  const resultado: Record<string, string> = {};
  try {
    const salvo = sessionStorage.getItem(CHAVE_UTM);
    if (salvo) Object.assign(resultado, JSON.parse(salvo));
  } catch {
    /* sem armazenamento: segue com o que a URL tiver */
  }

  const busca = new URLSearchParams(window.location.search);
  for (const chave of [...UTMS, ...CLIQUES]) {
    const valor = busca.get(chave);
    if (valor) resultado[chave] = valor.slice(0, 200);
  }
  return resultado;
}

/**
 * A URL da página com os parâmetros de campanha reanexados.
 *
 * O GA4 lê a atribuição do endereço da página (`dl`), e não de campos soltos
 * no evento: é de lá que ele tira origem, mídia e campanha. Como as UTMs
 * chegam só na URL do primeiro acesso e somem na primeira navegação interna,
 * da segunda página em diante o endereço ia limpo e a visita era contada como
 * tráfego direto — mesmo com os campos presentes no dataLayer.
 *
 * Só reanexa o que falta: se a pessoa chegou numa URL que já traz os
 * parâmetros, eles são preservados como vieram.
 */
export function enderecoComCampanha(): string {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);
  for (const [chave, valor] of Object.entries(lerUtms())) {
    /* `utm_captured_at` é registro nosso, não parâmetro de campanha: não tem
       significado para o GA4 e só sujaria o endereço nos relatórios. */
    if (chave === 'utm_captured_at') continue;
    if (!url.searchParams.has(chave)) url.searchParams.set(chave, valor);
  }
  return url.toString();
}

export function identificadoresDeCampanha(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookie = (nome: string) =>
    document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${nome}=`))
      ?.slice(nome.length + 1);

  const dados: Record<string, string> = {};
  const ga = cookie('_ga');
  if (ga) dados._ga = ga;
  const gclAw = cookie('_gcl_aw');
  if (gclAw) dados._gcl_aw = gclAw;

  dados.pagina_origem = window.location.href.slice(0, 300);

  /* As UTMs da campanha que trouxe a pessoa, mesmo que ela tenha navegado
     por várias páginas antes de preencher. */
  Object.assign(dados, lerUtms());

  return dados;
}

/** Erro no envio do formulário, para separar abandono de falha técnica. */
export function falhaNoEnvio(motivo: string): void {
  enviarEvento({ event: 'form_error', motivo });
}

/** Clique em WhatsApp, telefone ou e-mail. */
export function contatoDireto(canal: 'whatsapp' | 'telefone' | 'email', origem: string): void {
  enviarEvento({ event: 'contact_click', canal, origem });
}
