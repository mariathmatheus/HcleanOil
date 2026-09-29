/**
 * Camada de eventos do site.
 *
 * Tudo sai pelo `dataLayer`, nunca direto para GA4, Meta ou Brevo. Quem decide
 * o destino de cada evento é o container do GTM: acrescentar uma ferramenta
 * vira configuração de painel, não deploy de código.
 *
 * Os nomes seguem o vocabulário de e-commerce do GA4 (`view_item`,
 * `add_to_cart`, `begin_checkout`, `generate_lead`). Não é uma loja, mas o
 * funil é o mesmo, e usar o vocabulário padrão libera os relatórios prontos
 * do GA4 e o catálogo de remarketing do Meta sem mapeamento manual.
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
 * Empurra um evento para o dataLayer.
 *
 * Silencioso quando o GTM não está configurado: o site precisa funcionar igual
 * sem nenhum identificador preenchido, tanto em desenvolvimento quanto se a
 * tag cair em produção.
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

  /* O gclid chega na URL no primeiro clique do anúncio e some na navegação
     seguinte; o cookie _gcl_aw é quem o preserva. Ler os dois cobre tanto a
     conversão na primeira página quanto a que acontece depois. */
  const daUrl = new URLSearchParams(window.location.search).get('gclid');
  if (daUrl) dados.gclid = daUrl;

  dados.pagina_origem = window.location.href.slice(0, 300);
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
