/**
 * Conteúdo institucional e catálogo da HCLEAN.
 *
 * Os dados técnicos vêm do site anterior (hcleanoil.com.br) — gramaturas,
 * dimensões, taxas de absorção e composições são os números reais de fábrica.
 *
 * Posicionamento: fornecedora técnica B2B. A copy sustenta apenas o que é
 * verificável ("referência nacional", "mais de 18 anos", "operações reais");
 * os superlativos do site antigo ("OS MELHORES DO MERCADO", "FORNECEDOR N° 1")
 * ficaram de fora de propósito.
 *
 * Sobre reuso: as fichas antigas diziam "pode ser reutilizado" enquanto o FAQ
 * dizia o contrário. Confirmado com o cliente que são descartáveis — o texto
 * de reuso foi removido das características.
 */

export const site = {
  name: 'HCLEAN',
  legalName: 'HCLEAN Equipamentos Ambientais Ltda',
  tagline: 'Equipamentos de proteção ambiental com qualidade comprovada',
  /**
   * Título curto para a aba do navegador e o resultado de busca. O Google
   * corta perto de 60 caracteres, e "HCLEAN — {tagline}" dava 68.
   */
  titleShort: 'Equipamentos de proteção ambiental',
  /* Até 160 caracteres: o que passa disso o Google trunca com reticências. */
  description:
    'Há mais de 18 anos fabricando barreiras de contenção, absorventes, kits de emergência e tanques para resposta a emergências ambientais no Brasil.',
  /* Canônico sem www. É esta URL que alimenta canonical, sitemap, Open Graph
     e JSON-LD: as duas formas servindo o mesmo conteúdo sem um canônico
     definido seriam conteúdo duplicado aos olhos do Google. O www redireciona
     para cá. */
  url: 'https://hcleanoil.com.br',
  contact: {
    email: 'contato@hcleanoil.com.br',
    phone: '(21) 99494-5460',
    phoneHref: 'tel:+5521994945460',
    /* api.whatsapp.com, não wa.me: o rastreamento de mídia dispara a
       conversão quando a URL do clique contém "api.whatsapp", e o encurtador
       não casa com essa condição. Os dois abrem a mesma conversa. */
    whatsapp: 'https://api.whatsapp.com/send?phone=5521994945460',
    site: 'hcleanoil.com.br',
    hours: 'Seg–Sex: 08:00–18:00 · Sáb–Dom: fechado',
  },
} as const;

export const nav = [
  { href: '/', label: 'Início' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/sobre', label: 'Quem somos' },
] as const;

export type IconName =
  | 'shield'
  | 'droplets'
  | 'kit'
  | 'tank'
  | 'clock'
  | 'field'
  | 'support'
  | 'handshake'
  | 'close'
  | 'alert'
  | 'medal'
  | 'users'
  | 'ruler'
  | 'factory'
  | 'anchor'
  | 'flask'
  | 'arrow-right'
  | 'check'
  | 'mail'
  | 'phone'
  | 'globe'
  | 'pin'
  | 'chevron-right';

/* ------------------------------------------------------------- categorias */

export type Category = {
  slug: string;
  name: string;
  short: string;
  intro: string;
  icon: IconName;
  image: string;
};

export const categories: Category[] = [
  {
    slug: 'barreiras-de-contencao',
    name: 'Barreiras de Contenção',
    short:
      'Barreiras flutuantes para contenção e direcionamento de contaminantes em ambientes aquáticos.',
    intro:
      'Fabricadas em lona reforçada com fios de poliéster revestidos de PVC, para contenção, direcionamento e controle de contaminantes.',
    icon: 'shield',
    image: '/produtos/barreira-seafence.webp',
  },
  {
    slug: 'absorventes',
    name: 'Materiais Absorventes',
    short:
      'Três linhas específicas — hidrocarbonetos, líquidos em geral e produtos agressivos — em seis formatos.',
    intro:
      'Absorventes sintéticos e orgânicos para absorção e remoção de líquidos durante operações de resposta.',
    icon: 'droplets',
    image: '/produtos/absorventes-sinteticos.webp',
  },
  {
    slug: 'kits-de-emergencia',
    name: 'Kits de Emergência',
    short:
      'Conjuntos dimensionados para atendimento inicial em embarcações, indústrias e áreas sensíveis.',
    intro:
      'Kits SOPEP e de primeiro atendimento, preparados para resposta rápida a vazamentos e derramamentos.',
    icon: 'kit',
    image: '/produtos/kit-sopep.webp',
  },
  {
    slug: 'armazenamento',
    name: 'Tanque Terrestre',
    short:
      'Armazenamento temporário de hidrocarbonetos em lona de PVC vulcanizada, para apoio à operação.',
    intro:
      'Tanques para armazenamento temporário e suporte às operações de resposta em terra e em terminais.',
    icon: 'tank',
    image: '/produtos/tanque-terrestre.webp',
  },
];

/* ---------------------------------------------------------------- produtos */

export type Spec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  category: Category['slug'];
  lead: string;
  about: string[];
  applications: string[];
  features: string[];
  specs: Spec[];
  image: string;
  /** Formatos disponíveis, para as linhas de absorvente. */
  formats?: {
    name: string;
    image: string;
    description: string;
    sizes?: string;
    absorption?: string;
    features: string[];
  }[];
};

/* Características comuns aos absorventes sintéticos. O reuso saiu daqui —
   ver nota no topo do arquivo. */
const SINTETICO_COMUM = [
  'Absorve de 10 a 15 vezes o seu peso',
  'Recupera as substâncias recolhidas',
  'Elevada resistência química e mecânica',
  'Limpeza eficiente e instantânea',
  'Não nocivo para a fauna, a flora nem para os seres humanos',
  'Não se deteriora nem mofa',
  'Reduz a exposição de trabalhadores a substâncias nocivas',
  'Não inflamável, resistente a baixas e elevadas temperaturas e à umidade',
];

export const products: Product[] = [
  /* ---------------------------------------------- barreiras de contenção */
  {
    slug: 'barreira-de-contencao-seafence',
    name: 'Barreira de Contenção SeaFence',
    category: 'barreiras-de-contencao',
    lead: 'Barreira flutuante em lona reforçada para contenção de derramamentos em operações de resposta.',
    about: [
      'Barreira de contenção em lona confeccionada e reforçada, composta por fios de poliéster revestidos por PVC em ambas as faces, que garantem maior resistência mecânica. O material, denominado FORTFLEX BP 1235 na cor laranja, tem gramatura de 1.190 g/m² e espessura média de 0,95 mm.',
      'A formulação contém anti-UV, antioxidante, antifungo, plastificante polimérico e borracha nitrílica (NBR) em sua composição.',
      'Conta com bolsa superior para cabo de aço e bolsa inferior para corrente de lastro galvanizada a fogo, com flutuadores em poliestireno expandido bloco tipo 2P em formato cilíndrico. As conexões são em alumínio naval ASTM. Fabricamos qualquer tamanho conforme a necessidade da operação.',
    ],
    applications: [
      'Contenção de derramamentos em ambientes aquáticos',
      'Terminais portuários e píeres',
      'Operações preventivas em transferência de produto',
      'Atendimento a emergências ambientais',
    ],
    features: [
      'Lona com fios de poliéster revestidos de PVC em ambas as faces',
      'Formulação anti-UV, antioxidante e antifungo',
      'Bolsa superior para cabo de aço',
      'Bolsa inferior para corrente de lastro galvanizada a fogo',
      'Conexões em alumínio naval ASTM',
      'Fabricação sob medida',
    ],
    specs: [
      { label: 'Material', value: 'FORTFLEX BP 1235 — poliéster revestido de PVC' },
      { label: 'Gramatura', value: '1.190 g/m²' },
      { label: 'Espessura média', value: '0,95 mm' },
      { label: 'Cor', value: 'Laranja' },
      { label: 'Composição', value: 'Anti-UV, antioxidante, antifungo, plastificante polimérico, NBR' },
      { label: 'Flutuador', value: 'Poliestireno expandido bloco tipo 2P, cilíndrico' },
      { label: 'Lastro', value: 'Corrente galvanizada a fogo' },
      { label: 'Conexões', value: 'Alumínio naval ASTM' },
      { label: 'Seção padrão', value: '25 m' },
    ],
    image: '/produtos/barreira-seafence.webp',
  },
  {
    slug: 'barreira-de-contencao-abfence',
    name: 'Barreira de Contenção ABFence',
    category: 'barreiras-de-contencao',
    lead: 'Barreira flutuante rígida para longos períodos ou lançamento rápido.',
    about: [
      'A AB-FENCE é uma barreira de contenção flutuante para longos períodos ou rápido lançamento, fabricada a partir de materiais reforçados e projetada para suportar os efeitos danosos da abrasão, da radiação UV, do óleo e da degradação marinha.',
      'Os flutuadores coloridos e brilhantes são fabricados com material de elevada resistência à abrasão. Os flutuadores de polietileno de alta densidade são conectados ao tecido de base com acessórios em aço inoxidável, e são utilizados em ambos os tamanhos de barreira. Fabricamos todas as medidas.',
    ],
    applications: [
      'Contenção por longos períodos',
      'Operações que exigem lançamento rápido',
      'Ambientes marinhos com abrasão e exposição UV',
      'Terminais, píeres e áreas portuárias',
    ],
    features: [
      'Barreira flutuante rígida',
      'Resistente à abrasão, UV, óleo e degradação marinha',
      'Flutuadores em polietileno de alta densidade',
      'Acessórios de conexão em aço inoxidável',
      'Disponível em todas as medidas',
    ],
    specs: [
      { label: 'Tipo', value: 'Flutuante rígida' },
      { label: 'Flutuador', value: 'Polietileno de alta densidade (HD)' },
      { label: 'Fixação', value: 'Acessórios em aço inoxidável' },
      { label: 'Resistência', value: 'Abrasão, UV, óleo e degradação marinha' },
      { label: 'Aplicação', value: 'Longos períodos ou lançamento rápido' },
      { label: 'Dimensões', value: 'Fabricação sob medida' },
    ],
    image: '/produtos/barreira-abfence.webp',
  },

  /* ------------------------------------------------- linhas de absorvente */
  {
    slug: 'absorvente-oleo-linha-branca',
    name: 'Linha Branca — Absorventes para hidrocarbonetos',
    category: 'absorventes',
    lead: 'Absorventes sintéticos para petróleo e derivados, que recolhem o produto sem absorver água.',
    about: [
      'A Linha Branca reúne os absorventes sintéticos indicados para petróleo e derivados (hidrocarbonetos). Recupera as substâncias recolhidas sem absorver água, o que a torna adequada para operações sobre lâmina d’água.',
      'Disponível em seis formatos, para cobrir desde a contenção do perímetro até a absorção pontual de gotejamentos.',
    ],
    applications: [
      'Derramamentos de petróleo e derivados',
      'Operações sobre lâmina d’água',
      'Terminais, portos e embarcações',
      'Indústrias, oficinas e postos de combustível',
    ],
    features: [
      'Absorve petróleo e seus derivados',
      'Recupera as substâncias recolhidas sem absorver água',
      ...SINTETICO_COMUM.filter((f) => !f.startsWith('Recupera')),
    ],
    specs: [
      { label: 'Aplicação', value: 'Petróleo e derivados (hidrocarbonetos)' },
      { label: 'Taxa de absorção', value: '10 a 15 vezes o próprio peso' },
      { label: 'Comportamento na água', value: 'Não absorve água; flutua mesmo saturado' },
      { label: 'Inflamabilidade', value: 'Não inflamável' },
      { label: 'Formatos', value: 'Cordão, manta, barreira em tiras, barreira flocada, rolo e travesseiro' },
    ],
    image: '/produtos/branca-manta.webp',
    formats: [
      {
        name: 'Cordão absorvente',
        image: '/produtos/branca-cordao.webp',
        description:
          'Indicado para conter a propagação de líquidos, impedindo que se espalhem rapidamente. Basta isolar a área atingida circundando o produto derramado e usar a manta ou o travesseiro para absorver.',
        sizes: '0,76 m × 1,20 m · 0,76 m × 2,40 m · 0,76 m × 3,60 m',
        absorption: '10 vezes o próprio peso',
        features: ['Não absorve água', 'Flutua indefinidamente, mesmo saturado', 'Não inflamável e resistente a frio, calor e umidade'],
      },
      {
        name: 'Manta absorvente',
        image: '/produtos/branca-manta.webp',
        description:
          'Leve, de fácil manuseio e simples aplicação. Impregna-se com o produto derramado com precisão e rapidez: basta aplicá-la sobre a região afetada para a remoção imediata.',
        absorption: '10 vezes o próprio peso',
        features: ['Não absorve água', 'Flutua indefinidamente, mesmo saturada', 'Não inflamável e resistente a frio, calor e umidade'],
      },
      {
        name: 'Barreira absorvente em tiras',
        image: '/produtos/branca-barreira-tiras.webp',
        description:
          'Formato em tira, do tipo espaguete, para permitir maior penetração de óleo. Utilizada em águas correntes, é indicada para óleos de maior viscosidade e possui engate rápido nas extremidades. Posicionada corretamente, impede a passagem do produto e evita a contaminação de outras áreas.',
        sizes: '5" × 3 m · 8" × 3 m',
        absorption: '12 vezes o próprio peso',
        features: ['Engate rápido nas extremidades', 'Indicada para águas correntes', 'Não absorve água', 'Não inflamável e resistente a frio, calor e umidade'],
      },
      {
        name: 'Barreira absorvente flocada',
        image: '/produtos/branca-barreira-flocada.webp',
        description:
          'Barreira absorvente flocada para hidrocarbonetos, com dupla camada de contenção. Adequada para óleos e derivados de baixa viscosidade.',
        sizes: '5" × 3 m · 8" × 3 m',
        absorption: '6 vezes o próprio peso',
        features: ['Dupla camada de contenção', 'Indicada para baixa viscosidade', 'Não absorve água', 'Não inflamável e resistente a frio, calor e umidade'],
      },
      {
        name: 'Rolo absorvente',
        image: '/produtos/branca-rolo.webp',
        description:
          'Indicado como passadeira em locais de trânsito, evitando a contaminação. Pode ser utilizado na limpeza de maquinários e na manutenção de equipamentos.',
        sizes: '48 m × 0,96 m · 96 m × 0,96 m',
        absorption: '10 vezes o próprio peso',
        features: ['Uso como passadeira', 'Limpeza de maquinário e manutenção', 'Não absorve água', 'Não inflamável e resistente a frio, calor e umidade'],
      },
      {
        name: 'Travesseiro absorvente',
        image: '/produtos/branca-travesseiro.webp',
        description:
          'Absorve desde pequenas até grandes quantidades de líquidos. Indicado para casos de vazamento e de goteiras provocadas por equipamentos.',
        sizes: '0,23 × 0,23 × 0,05 m · 0,45 × 0,45 × 0,05 m',
        absorption: '10 vezes o próprio peso',
        features: ['Para vazamentos e goteiras', 'Não absorve água', 'Não inflamável e resistente a frio, calor e umidade'],
      },
    ],
  },
  {
    slug: 'absorvente-universal-linha-cinza',
    name: 'Linha Cinza — Absorventes para líquidos em geral',
    category: 'absorventes',
    lead: 'Absorventes sintéticos de uso geral, para líquidos à base de água, detergentes, solventes e óleos.',
    about: [
      'A Linha Cinza reúne os absorventes sintéticos de uso geral, capazes de absorver líquidos à base de água, detergentes, solventes, óleos e muitos outros produtos.',
      'É a linha indicada para rotinas de manutenção, proteção de piso e contenção preventiva em torno de maquinário.',
    ],
    applications: [
      'Líquidos à base de água, detergentes e solventes',
      'Rotinas de manutenção industrial',
      'Proteção de piso e áreas de trânsito',
      'Contenção preventiva em torno de maquinário',
    ],
    features: [
      'Absorve líquidos à base de água, detergentes, solventes, óleos e muitos outros',
      ...SINTETICO_COMUM,
    ],
    specs: [
      { label: 'Aplicação', value: 'Líquidos em geral' },
      { label: 'Taxa de absorção', value: '10 a 15 vezes o próprio peso' },
      { label: 'Retenção', value: 'Retém líquidos permanentemente' },
      { label: 'Inflamabilidade', value: 'Não inflamável' },
      { label: 'Formatos', value: 'Cordão, manta, rolo e travesseiro' },
    ],
    image: '/produtos/cinza-manta.webp',
    formats: [
      {
        name: 'Cordão absorvente',
        image: '/produtos/cinza-cordao.webp',
        description:
          'Indicado para envolver preventivamente o maquinário e para conter a propagação de líquidos. Impede que o líquido se espalhe rapidamente: basta isolar a área atingida circundando o produto derramado.',
        sizes: '0,76 m × 1,20 m · 0,76 m × 2,40 m · 0,76 m × 3,60 m',
        absorption: '10 vezes o próprio peso',
        features: ['Fácil aplicação e manuseio', 'Retém líquidos permanentemente'],
      },
      {
        name: 'Manta absorvente',
        image: '/produtos/cinza-manta.webp',
        description:
          'Indicada para limpeza e absorção de diversos tipos de produtos, tais como óleo, água, solventes e muitos outros.',
        absorption: '10 vezes o próprio peso',
        features: ['Uso geral', 'Retém líquidos permanentemente', 'Fácil aplicação e manuseio'],
      },
      {
        name: 'Rolo absorvente',
        image: '/produtos/cinza-rolo.webp',
        description:
          'Indicado para proteger o piso. É ajustável ao tamanho e ao formato necessário e utilizado sem desperdício.',
        absorption: '10 vezes o próprio peso',
        features: ['Proteção de piso', 'Ajustável ao tamanho necessário', 'Retém líquidos permanentemente'],
      },
      {
        name: 'Travesseiro absorvente',
        image: '/produtos/cinza-travesseiro.webp',
        description:
          'Absorve desde pequenas até grandes quantidades de líquidos. Indicado para casos de vazamentos e goteiras, e para regiões que sofrem respingos.',
        sizes: '0,23 × 0,23 × 0,05 m · 0,45 × 0,45 × 0,05 m',
        absorption: '10 vezes o próprio peso',
        features: ['Para vazamentos, goteiras e respingos', 'Retém líquidos permanentemente'],
      },
    ],
  },
  {
    slug: 'absorvente-quimico-linha-verde',
    name: 'Linha Verde — Absorventes para líquidos agressivos',
    category: 'absorventes',
    lead: 'Absorventes sintéticos para ácidos, bases, produtos tóxicos e substâncias desconhecidas.',
    about: [
      'A Linha Verde reúne os absorventes sintéticos indicados para líquidos agressivos: ácidos, bases, produtos tóxicos e substâncias desconhecidas.',
      'O material não se desfaz ao entrar em contato com líquidos mais agressivos, o que a torna adequada também para limpeza de bancadas em laboratórios.',
    ],
    applications: [
      'Derramamentos de ácidos e bases',
      'Produtos tóxicos e substâncias desconhecidas',
      'Laboratórios e bancadas',
      'Áreas com risco de derrames corrosivos',
    ],
    features: [
      'Absorve ácidos, bases, tóxicos e produtos desconhecidos',
      'Não se desfaz em contato com líquidos agressivos',
      ...SINTETICO_COMUM.filter(
        (f) => !f.startsWith('Não inflamável') && !f.startsWith('Absorve de'),
      ),
      'Absorve de 10 a 15 vezes o seu peso',
    ],
    specs: [
      { label: 'Aplicação', value: 'Ácidos, bases, tóxicos e produtos desconhecidos' },
      { label: 'Taxa de absorção', value: '10 a 15 vezes o próprio peso' },
      { label: 'Resistência', value: 'Não se desfaz em contato com líquidos agressivos' },
      { label: 'Retenção', value: 'Retém líquidos permanentemente' },
      { label: 'Formatos', value: 'Cordão, manta, rolo e travesseiro' },
    ],
    image: '/produtos/verde-manta.webp',
    formats: [
      {
        name: 'Cordão absorvente',
        image: '/produtos/verde-cordao.webp',
        description:
          'Indicado para derramamentos e contenções de ácidos, bases, tóxicos e produtos desconhecidos. Ideal para conter a propagação de líquidos: basta isolar a área atingida circundando o produto derramado.',
        sizes: '0,76 m × 1,20 m · 0,76 m × 2,40 m · 0,76 m × 3,60 m',
        absorption: '10 vezes o próprio peso',
        features: ['Fácil aplicação e manuseio', 'Retém líquidos permanentemente'],
      },
      {
        name: 'Manta absorvente',
        image: '/produtos/verde-manta.webp',
        description:
          'Indicada para derramamentos e contenções de ácidos, bases e produtos desconhecidos. Não se desfaz ao entrar em contato com líquidos mais agressivos e pode ser utilizada para limpeza de bancadas em laboratórios.',
        absorption: '10 vezes o próprio peso',
        features: ['Resistente a líquidos agressivos', 'Uso em laboratórios', 'Fácil aplicação e manuseio'],
      },
      {
        name: 'Rolo absorvente',
        image: '/produtos/verde-rolo.webp',
        description:
          'Indicado para proteger o piso e prevenir acidentes com derrames ácidos. É ajustável ao tamanho e ao formato necessário e utilizado sem desperdício.',
        absorption: '10 vezes o próprio peso',
        features: ['Proteção de piso contra derrames ácidos', 'Ajustável ao tamanho necessário'],
      },
      {
        name: 'Travesseiro absorvente',
        image: '/produtos/verde-travesseiro.webp',
        description:
          'Absorve desde pequenas até grandes quantidades de líquidos. Indicado para casos de vazamentos e goteiras de produtos agressivos.',
        sizes: '0,23 × 0,23 × 0,05 m · 0,45 × 0,45 × 0,05 m',
        absorption: '10 vezes o próprio peso',
        features: ['Para vazamentos e goteiras de produtos agressivos', 'Retém líquidos permanentemente'],
      },
    ],
  },
  {
    slug: 'turfa-organica-absorvente',
    name: 'Turfa Orgânica',
    category: 'absorventes',
    lead: 'Absorvente orgânico 100% natural e renovável, com alta taxa de absorção de hidrocarbonetos.',
    about: [
      'A turfa absorvente é um produto não tóxico e não abrasivo. Seu desempenho se deve à alta taxa de absorção e à capacidade não lixiviante, que permite às equipes de limpeza controlar contaminantes indesejáveis.',
      'Sua composição consiste em um composto orgânico de origem vegetal pura, com 98% de matéria orgânica.',
      'Quando o composto é seco corretamente até um conteúdo de água de 5%, muda suas características e torna-se hidrofóbico — repelindo a água, porém com afinidade por vários tipos de hidrocarbonetos. Absorve em proporção de massa: 1 quilo do produto absorve até 12 litros de óleo, capacidade relacionada ao tempo de contato.',
    ],
    applications: [
      'Absorção de hidrocarbonetos',
      'Operações que exigem material não lixiviante',
      'Áreas com restrição a produtos sintéticos',
      'Limpeza de áreas afetadas por derramamento',
    ],
    features: [
      'Produto 100% natural e renovável',
      'Não tóxico e não abrasivo',
      'Composto orgânico de origem vegetal pura, com 98% de matéria orgânica',
      'Hidrofóbico: repele a água e tem afinidade por hidrocarbonetos',
      'Capacidade não lixiviante',
      'Não agride o meio ambiente',
    ],
    specs: [
      { label: 'Origem', value: 'Composto orgânico vegetal puro' },
      { label: 'Matéria orgânica', value: '98%' },
      { label: 'Conteúdo de água', value: '5% (após secagem)' },
      { label: 'Capacidade de absorção', value: 'Até 12 litros de óleo por quilo' },
      { label: 'Comportamento', value: 'Hidrofóbico, com afinidade por hidrocarbonetos' },
      { label: 'Lixiviação', value: 'Não lixiviante' },
    ],
    image: '/produtos/turfa-organica.webp',
  },

  /* ------------------------------------------------------------------ kits */
  {
    slug: 'kit-sopep',
    name: 'Kit SOPEP',
    category: 'kits-de-emergencia',
    lead: 'Kits dimensionados para contenção e absorção de vazamentos, conforme normas internacionais.',
    about: [
      'Os Kits SOPEP (Shipboard Oil Pollution Emergency Plan) são dimensionados especialmente para a contenção e absorção de vazamentos ou derramamentos de petróleo, seus derivados, produtos químicos e líquidos diversos.',
      'São indicados para uso em ambientes industriais, portuários, embarcações e áreas sensíveis, onde é necessário agir rapidamente para controlar e minimizar os impactos ambientais de incidentes com substâncias perigosas.',
      'Disponíveis em diferentes capacidades de absorção — 50 L, 100 L, 200 L e 1.000 L —, os kits são compostos por materiais específicos que facilitam o manejo seguro e eficiente dessas substâncias. A escolha do tamanho adequado depende do volume de risco presente na operação e das exigências normativas do local.',
    ],
    applications: [
      'Embarcações e operações portuárias',
      'Ambientes industriais',
      'Áreas ambientalmente sensíveis',
      'Atendimento a exigências normativas de bordo',
    ],
    features: [
      'Conforme o Shipboard Oil Pollution Emergency Plan (SOPEP)',
      'Quatro capacidades: 50 L, 100 L, 200 L e 1.000 L',
      'Para petróleo, derivados, produtos químicos e líquidos diversos',
      'Composição que facilita o manejo seguro',
      'Dimensionamento conforme o volume de risco da operação',
    ],
    specs: [
      { label: 'Capacidades', value: '50 L · 100 L · 200 L · 1.000 L' },
      { label: 'Norma de referência', value: 'SOPEP — Shipboard Oil Pollution Emergency Plan' },
      { label: 'Produtos atendidos', value: 'Petróleo, derivados, produtos químicos e líquidos diversos' },
      { label: 'Indicação', value: 'Embarcações, portos, indústrias e áreas sensíveis' },
    ],
    image: '/produtos/kit-sopep.webp',
  },
  {
    slug: 'kit-primeiro-atendimento',
    name: 'Kit Primeiro Atendimento',
    category: 'kits-de-emergencia',
    lead: 'Kit compacto para resposta imediata, até que a equipe especializada assuma a operação.',
    about: [
      'O Kit de Primeiro Atendimento é desenvolvido para oferecer uma resposta rápida e eficaz em situações de emergência envolvendo vazamentos ou derramamentos de líquidos perigosos, como petróleo e seus derivados, produtos químicos ou substâncias contaminantes.',
      'É especialmente indicado para as fases iniciais de um acidente ambiental ou industrial, permitindo a contenção imediata e a mitigação dos impactos até que uma equipe especializada assuma o controle da situação.',
      'Compacto e de fácil manuseio, pode conter barreiras, mantas absorventes, EPIs, sacos de descarte e outros itens essenciais para a ação emergencial. É indicado para áreas de risco como fábricas, oficinas, postos de combustível, portos e embarcações. Sua composição pode ser personalizada de acordo com o tipo de produto a ser contido e as exigências normativas do local.',
    ],
    applications: [
      'Fases iniciais de acidente ambiental ou industrial',
      'Fábricas, oficinas e postos de combustível',
      'Portos e embarcações',
      'Áreas de risco que exigem resposta imediata',
    ],
    features: [
      'Compacto e de fácil manuseio',
      'Pode conter barreiras, mantas absorventes, EPIs e sacos de descarte',
      'Composição personalizável conforme o produto a conter',
      'Atende exigências normativas do local',
    ],
    specs: [
      { label: 'Composição', value: 'Personalizável — barreiras, mantas, EPIs, sacos de descarte' },
      { label: 'Indicação', value: 'Fábricas, oficinas, postos, portos e embarcações' },
      { label: 'Momento de uso', value: 'Fase inicial do acidente, até a chegada da equipe especializada' },
    ],
    image: '/produtos/kit-primeiro-atendimento.webp',
  },

  /* -------------------------------------------------------------- tanque */
  {
    slug: 'tanque-terrestre-armazenamento',
    name: 'Tanque Terrestre',
    category: 'armazenamento',
    lead: 'Tanque em lona de PVC vulcanizada para armazenamento temporário de hidrocarbonetos.',
    about: [
      'Tanque para armazenamento temporário de hidrocarbonetos, confeccionado em lona de PVC vulcanizada. Sua borda, com flutuadores, vai se modelando conforme a quantidade de produto colocado.',
      'É equipamento comumente utilizado na composição de PEIs (Planos de Emergência Individual).',
      'Após a operação com óleo, o tanque deve ser retirado e colocado em big bags, para transporte com segurança.',
    ],
    applications: [
      'Operações emergenciais em terra (onshore)',
      'Píeres, terminais e embarcações de apoio',
      'Composição de Planos de Emergência Individual (PEI)',
      'Armazenamento temporário durante a resposta',
    ],
    features: [
      'Casulos em PVC',
      'Cobertura em lona PVC',
      'Válvula de drenagem, se aplicável',
      'Disponível nas cores azul e laranja',
      'Borda com flutuadores que se modela conforme o volume',
    ],
    specs: [
      { label: 'Modelo', value: 'Tanque YZY Terrestre 15.000 L' },
      { label: 'Dimensões', value: 'C 2,10 × L 1,60 × A 0,45 m' },
      { label: 'Peso', value: '45 kg' },
      { label: 'Material', value: 'Lona de PVC vulcanizada' },
      { label: 'Cobertura', value: 'Lona PVC' },
      { label: 'Cores', value: 'Azul e laranja' },
      { label: 'Drenagem', value: 'Válvula de drenagem, se aplicável' },
    ],
    image: '/produtos/tanque-terrestre.webp',
  },
];

/* ------------------------------------------------------------- utilitários */

export const productsByCategory = (slug: Category['slug']) =>
  products.filter((p) => p.category === slug);

export const findProduct = (slug: string) => products.find((p) => p.slug === slug);

export const findCategory = (slug: string) => categories.find((c) => c.slug === slug);

/** Até `limit` itens: primeiro os da mesma categoria, depois os demais. */
export const relatedProducts = (product: Product, limit = 3) => {
  const sameLine = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const others = products.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameLine, ...others].slice(0, limit);
};

/* ------------------------------------------------------------ institucional */

export const pillars = [
  {
    icon: 'clock' as IconName,
    title: '+18 anos de experiência',
    text: 'Fabricação de equipamentos e soluções para emergências ambientais desde 2004.',
  },
  {
    icon: 'field' as IconName,
    title: 'Operações reais',
    text: 'Equipamentos utilizados em grandes emergências ambientais no Brasil.',
  },
  {
    icon: 'support' as IconName,
    title: 'Atendimento técnico',
    text: 'Suporte para identificar a solução adequada a cada operação e exigência normativa.',
  },
  {
    icon: 'handshake' as IconName,
    title: 'Fabricação nacional',
    text: 'Produção no Brasil, com atendimento e logística para todo o território nacional.',
  },
];

/** Números do site anterior, confirmados para uso. */
export const proofPoints = [
  { value: '+18', label: 'anos no mercado de proteção ambiental' },
  { value: '500 mil', label: 'metros de barreira fabricados' },
  { value: '10 mil', label: 'de estoque mínimo de material absorvente' },
  { value: 'Nacional', label: 'atendimento em todo o Brasil' },
];

/** Operações reais atendidas com equipamentos HCLEAN. */
export const caseStudies = [
  {
    name: 'Terminal de Paranaguá',
    text: 'Fornecimento e instalação de sistema completo de contenção para emergências em terminal portuário.',
  },
  {
    name: 'Navio Haidar',
    text: 'Resposta emergencial com barreiras flutuantes e material absorvente especializado.',
  },
  {
    name: 'REDUC',
    text: 'Implementação de sistema de prevenção e resposta para refinaria de petróleo.',
  },
  {
    name: 'Golden Miller',
    text: 'Operação de contenção e limpeza em terminal de granéis líquidos.',
  },
];

export const faq = [
  {
    q: 'Os absorventes funcionam para qualquer tipo de líquido?',
    a: 'Não. Temos linhas específicas para cada necessidade: derivados de petróleo, líquidos em geral e produtos agressivos. Isso garante máxima eficiência em cada aplicação.',
  },
  {
    q: 'Esses materiais podem ser reutilizados?',
    a: 'Não. Eles são descartáveis para garantir segurança e evitar contaminação cruzada. Mas oferecemos linhas econômicas e sustentáveis para reduzir custos e impactos ambientais.',
  },
  {
    q: 'Como descartar os absorventes após o uso?',
    a: 'O descarte deve ser feito conforme a legislação vigente para resíduos contaminados. Nossa equipe orienta sobre o processo correto para cada caso.',
  },
  {
    q: 'Posso usar em ambientes industriais e marítimos?',
    a: 'Sim. Nossos absorventes são aplicáveis em diversos contextos: indústrias, portos, oficinas, postos de combustível, transporte e muito mais.',
  },
  {
    q: 'Qual o prazo de entrega?',
    a: 'Atendemos todo o Brasil com prazos rápidos. O prazo varia conforme o produto e a região, mas garantimos agilidade logística.',
  },
];
