/**
 * Páginas por formato de absorvente.
 *
 * O catálogo é organizado por linha (branca, cinza, verde), que é como a
 * fábrica pensa: o que muda entre elas é o líquido que absorvem. Mas quem
 * procura no Google digita "cordão absorvente", não "linha branca" — e o site
 * anterior tratava cordão e rolo como produtos próprios, com card na vitrine.
 *
 * Este índice é derivado de `products`: para cada formato, reúne as três
 * variantes lado a lado. Não duplica conteúdo — cada página compara as linhas
 * em vez de repetir o texto de uma delas.
 *
 * Como vem de `products`, editar um formato lá atualiza a página daqui.
 */
import { products, type Product } from './site';

/** Uma linha de absorvente oferecendo determinado formato. */
export type FormatoVariante = {
  /** Slug da linha, para linkar de volta. */
  lineSlug: string;
  /** "Linha Branca", já sem o complemento do nome do produto. */
  lineName: string;
  /** Para que serve a linha: hidrocarbonetos, líquidos em geral, agressivos. */
  lineFor: string;
  image: string;
  description: string;
  sizes?: string;
  absorption?: string;
  features: string[];
};

export type Formato = {
  slug: string;
  /** Nome curto, como aparece no card e no <h1>. */
  name: string;
  /** Frase de apoio abaixo do título. */
  lead: string;
  /** Texto de abertura da página. */
  intro: string;
  variants: FormatoVariante[];
};

/** As três linhas e para que cada uma serve. */
const PARA_QUE: Record<string, string> = {
  'whiteline': 'Petróleo e derivados (hidrocarbonetos)',
  'grayline': 'Líquidos em geral — água, detergentes, solventes e óleos',
  'greenline': 'Líquidos agressivos — ácidos, bases e produtos desconhecidos',
};

/** Ordem de exibição; espelha a ordem do catálogo. */
const ORDEM_LINHAS = ['whiteline', 'grayline', 'greenline'];

/**
 * Metadados de cada formato. O texto técnico vem das variantes; aqui fica só
 * o que descreve o formato em si, independente da linha.
 */
const META: Record<string, { slug: string; lead: string; intro: string }> = {
  'Cordão absorvente': {
    slug: 'cordao-absorvente',
    lead: 'Contenção do perímetro: isola a área atingida e impede que o líquido se espalhe.',
    intro:
      'O cordão absorvente circunda o produto derramado e impede que ele avance. É o primeiro item a entrar em ação numa resposta: define o limite da área afetada para que manta e travesseiro façam a absorção dentro dele. Disponível nas três linhas, em três comprimentos.',
  },
  'Manta absorvente': {
    slug: 'manta-absorvente',
    lead: 'Absorção em superfície: aplicada sobre a área afetada, remove o produto de imediato.',
    intro:
      'A manta é o formato de maior uso no dia a dia operacional. Leve e de aplicação simples, impregna-se com o produto derramado ao ser posta sobre a região afetada. Fornecida em pacote fechado, nas três linhas.',
  },
  'Rolo absorvente': {
    slug: 'rolo-absorvente',
    lead: 'Proteção contínua: passadeira para áreas de trânsito e manutenção de equipamentos.',
    intro:
      'O rolo é ajustável ao tamanho e ao formato necessários, sem desperdício — corta-se o que a operação exige. Serve como passadeira em locais de trânsito, evitando a contaminação do piso, e na limpeza de maquinário. Disponível nas três linhas.',
  },
  'Travesseiro absorvente': {
    slug: 'travesseiro-absorvente',
    lead: 'Absorção pontual: para vazamentos e goteiras provocados por equipamentos.',
    intro:
      'O travesseiro absorve desde pequenas até grandes quantidades de líquido e é indicado para pontos específicos: vazamentos sob equipamentos, goteiras e regiões que sofrem respingos. Disponível em dois tamanhos, nas três linhas.',
  },
  'Barreira absorvente em tiras': {
    slug: 'barreira-absorvente-em-tiras',
    lead: 'Águas correntes: formato espaguete, para maior penetração em óleos viscosos.',
    intro:
      'A barreira em tiras tem formato tipo espaguete, que permite maior penetração do óleo. É o formato indicado para águas correntes e para óleos de maior viscosidade, com engate rápido nas extremidades para emendar o comprimento necessário.',
  },
  'Barreira absorvente flocada': {
    slug: 'barreira-absorvente-flocada',
    lead: 'Dupla camada de contenção, para óleos e derivados de baixa viscosidade.',
    intro:
      'A barreira flocada tem dupla camada de contenção e é adequada a óleos e derivados de baixa viscosidade — o cenário oposto ao da barreira em tiras.',
  },
};

/** Remove o complemento do nome: "Linha Branca — Absorventes…" vira "Linha Branca". */
const nomeCurtoDaLinha = (nome: string) => nome.split('—')[0].trim();

function construir(): Formato[] {
  const porFormato = new Map<string, FormatoVariante[]>();

  const linhas = ORDEM_LINHAS.map((slug) =>
    products.find((p) => p.slug === slug),
  ).filter((p): p is Product => Boolean(p));

  for (const linha of linhas) {
    for (const f of linha.formats ?? []) {
      const lista = porFormato.get(f.name) ?? [];
      lista.push({
        lineSlug: linha.slug,
        lineName: nomeCurtoDaLinha(linha.name),
        lineFor: PARA_QUE[linha.slug] ?? '',
        image: f.image,
        description: f.description,
        sizes: f.sizes,
        absorption: f.absorption,
        features: f.features,
      });
      porFormato.set(f.name, lista);
    }
  }

  const out: Formato[] = [];
  for (const [name, variants] of porFormato) {
    const meta = META[name];
    // Formato sem metadados não vira página: melhor faltar do que publicar
    // uma página sem texto de abertura.
    if (!meta) continue;
    out.push({ slug: meta.slug, name, lead: meta.lead, intro: meta.intro, variants });
  }

  // Ordem fixa, do mais usado para o mais específico.
  const ordem = Object.values(META).map((m) => m.slug);
  return out.sort((a, b) => ordem.indexOf(a.slug) - ordem.indexOf(b.slug));
}

export const formatos = construir();

export const findFormato = (slug: string) => formatos.find((f) => f.slug === slug);
