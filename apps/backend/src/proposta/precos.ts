/**
 * Tabela de preços da HCLEAN.
 *
 * Este arquivo é a fonte da verdade dos valores usados pelo gerador de
 * propostas. As anotações comerciais que sustentam cada decisão ficam fora do
 * versionamento.
 *
 * As chaves espelham os nomes que o formulário do site envia, para que o
 * pedido vire orçamento sem tradução manual.
 */

/** Como a quantidade pedida vira valor. */
export type Unidade =
  | 'metro' // metro linear
  | 'unidade'
  | 'rolo'
  | 'kg';

/**
 * Concorda a unidade com a quantidade: "1 metro", "20 metros".
 *
 * Todas as unidades do catálogo fazem plural com -s, mas "kg" é símbolo e
 * fica invariável ("20 kg", nunca "20 kgs").
 */
export function unidadePlural(unidade: Unidade, quantidade: number): string {
  if (unidade === 'kg') return unidade;
  return quantidade === 1 ? unidade : `${unidade}s`;
}

export type ItemPreco = {
  /** Chave usada no pedido e no mapa de itens. */
  id: string;
  nome: string;
  unidade: Unidade;
  /** Preço da linha branca/cinza. Ausente = exige cotação manual. */
  preco?: number;
  /** Texto exibido no lugar do preço quando não há valor de tabela. */
  observacao?: string;
};

/** Acréscimo da linha verde sobre a branca/cinza. */
export const ACRESCIMO_LINHA_VERDE = 0.2;

/**
 * Catálogo. Um item por produto vendável; a linha (branca, cinza, verde) é
 * atributo do pedido, não item separado — só muda o preço, pela regra acima.
 */
export const PRECOS: ItemPreco[] = [
  /* ---------------------------------------------- barreiras de contenção */
  {
    id: 'barreira-de-contencao-seafence',
    nome: 'Barreira de Contenção SeaFence (Fortflex 550 mm)',
    unidade: 'metro',
    preco: 190.0,
  },
  {
    id: 'barreira-de-contencao-abfence',
    nome: 'Barreira de Contenção AB-Fence',
    unidade: 'metro',
    preco: 230.0,
  },

  /* ------------------------------------------------ formatos absorventes */
  { id: 'cordao', nome: 'Cordão absorvente', unidade: 'unidade', preco: 9.0 },
  { id: 'manta', nome: 'Manta absorvente', unidade: 'unidade', preco: 2.4 },
  /* A 4 mm é mais espessa e absorve mais por unidade; sai por R$ 3,20 contra
     R$ 2,40 da padrão. Item próprio e não um modificador de preço da manta
     comum: assim ele aparece como linha separada na proposta, que é como o
     cliente pediu as duas. O acréscimo da Linha Verde incide por cima, pela
     regra geral de `precoDaLinha`. */
  { id: 'manta-4mm', nome: 'Manta absorvente 4 mm', unidade: 'unidade', preco: 3.2 },
  { id: 'rolo', nome: 'Rolo absorvente', unidade: 'rolo', preco: 540.0 },
  {
    id: 'travesseiro',
    nome: 'Travesseiro absorvente',
    unidade: 'unidade',
    preco: 6.0,
  },
  {
    id: 'barreira-tiras',
    nome: 'Barreira absorvente em tiras',
    unidade: 'unidade',
    preco: 63.0,
  },
  {
    id: 'barreira-flocada',
    nome: 'Barreira absorvente flocada',
    unidade: 'unidade',
    preco: 63.0,
  },

  /* ------------------------------------------------------------- turfa */
  {
    id: 'turfa-organica',
    nome: 'Turfa orgânica',
    unidade: 'kg',
    preco: 10.0,
  },

  /* -------------------------------------------------------------- kits */
  { id: 'sopep-50', nome: 'Kit SOPEP 50 L', unidade: 'unidade', preco: 300.0 },
  { id: 'sopep-100', nome: 'Kit SOPEP 100 L', unidade: 'unidade', preco: 750.0 },
  { id: 'sopep-200', nome: 'Kit SOPEP 200 L', unidade: 'unidade', preco: 950.0 },
  {
    id: 'kit-primeiro-atendimento',
    nome: 'Kit Primeiro Atendimento',
    unidade: 'unidade',
    preco: 950.0,
  },

  /* ------------------------------------------------------------ tanque */
  {
    id: 'tanque-terrestre',
    nome: 'Tanque Terrestre',
    unidade: 'unidade',
    // Sem preço de propósito: a tabela diz "fazer cotação".
    observacao: 'Sob cotação',
  },
];

export const acharPreco = (id: string) => PRECOS.find((p) => p.id === id);

/** Preço do item na linha escolhida. Verde custa 20% mais. */
export function precoDaLinha(item: ItemPreco, linha?: string): number | undefined {
  if (item.preco === undefined) return undefined;
  const verde = linha?.toLowerCase().includes('verde');
  return verde ? Number((item.preco * (1 + ACRESCIMO_LINHA_VERDE)).toFixed(2)) : item.preco;
}

/* ---------------------------------------------------------------- frete */

/** UFs do Sudeste, por extenso e por sigla, como o formulário pode enviar. */
const SUDESTE = new Set([
  'SP', 'SÃO PAULO', 'SAO PAULO',
  'RJ', 'RIO DE JANEIRO',
  'MG', 'MINAS GERAIS',
  'ES', 'ESPÍRITO SANTO', 'ESPIRITO SANTO',
]);

export const MINIMO_CIF = 1000;

/**
 * CIF (frete incluso) quando a entrega é no Sudeste e o total alcança o
 * mínimo; caso contrário FOB, por conta do cliente.
 */
export function definirFrete(estado: string, total: number) {
  const sudeste = SUDESTE.has(estado.trim().toUpperCase());
  const cif = sudeste && total >= MINIMO_CIF;
  return {
    cif,
    sudeste,
    rotulo: cif ? 'CIF (incluso)' : 'FOB (por conta do cliente)',
  };
}

export const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
