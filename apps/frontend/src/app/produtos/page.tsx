import type { Metadata } from 'next';
import { Container, Section, SectionHeading, Grid } from '@/components/ui/Layout';
import { ButtonLink } from '@/components/ui/Button';
import { QuoteButton } from '@/components/quote/QuoteButton';
import {
  Hero,
  HeroCopy,
  HeroTitle,
  HeroLead,
  Actions,
  Breadcrumbs,
  CTABanner,
} from '@/components/sections/Shared';
import { ProductCard, FormatoCard } from '@/components/sections/ProductCard';
import { Ornament, ornamentHost } from '@/components/sections/Ornament';
import { categories, productsByCategory, products, site } from '@/data/site';
import { formatos } from '@/data/formatos';
import s from './produtos.module.css';

export const metadata: Metadata = {
  /* "Produtos | HCLEAN" tinha 17 caracteres e nenhum termo de busca: gastava o
     espaco mais valioso do resultado com uma palavra que ninguem digita. O
     titulo agora carrega os tres termos que o comprador procura. */
  title: { absolute: 'Barreiras de Contenção, Absorventes e Kits SOPEP | HCLEAN' },
  description:
    'Fabricamos barreiras de contenção, absorventes de óleo nas linhas branca, cinza e verde, kits SOPEP e tanques para armazenamento temporário. Atuação nacional.',
  alternates: { canonical: '/produtos' },
};

/* A vitrine tinha trilha visual e nenhum dado estruturado. O BreadcrumbList
   da ao Google o caminho para exibir no lugar da URL crua; o ItemList diz que
   esta pagina e o indice do catalogo e quais sao os itens, o que ajuda a
   descoberta das 9 paginas de produto. */
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: site.url },
    { '@type': 'ListItem', position: 2, name: 'Produtos', item: `${site.url}/produtos` },
  ],
};

const catalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Catálogo HCLEAN',
  numberOfItems: products.length,
  itemListElement: products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    url: `${site.url}/produtos/${p.slug}`,
  })),
};

export default function ProdutosPage() {
  return (
    <>
      <Hero>
        <Breadcrumbs trail={[{ href: '/', label: 'Início' }, { label: 'Produtos' }]} />
        <div style={{ height: 20 }} />
        <HeroCopy>
          <HeroTitle>Equipamentos para resposta a emergências ambientais</HeroTitle>
          <HeroLead>
            Conheça nosso portfólio de barreiras de contenção, materiais absorventes,
            kits de emergência e tanques para atendimento a derramamentos.
          </HeroLead>
          <Actions>
            <QuoteButton size="lg" iconRight="arrow-right">Solicitar orçamento</QuoteButton>
          </Actions>
        </HeroCopy>
      </Hero>

      <Section tone="page" size="sm" className={ornamentHost}>
        <Ornament shape="rings" place="topRight" />
        <Container>
          <SectionHeading
            eyebrow="Introdução"
            title="A solução certa para cada cenário operacional"
            description="Cada emergência apresenta características diferentes. Por isso, a HCLEAN trabalha com um portfólio desenvolvido para diferentes etapas da resposta ambiental."
          />
          <nav className={s.jump} aria-label="Categorias">
            {categories.map((c) => (
              <a key={c.slug} href={`#${c.slug}`} className={s.jumpLink}>
                {c.name}
              </a>
            ))}
          </nav>
        </Container>
      </Section>

      {categories.map((category, i) => {
        const items = productsByCategory(category.slug);
        if (!items.length) return null;
        return (
          <Section
            key={category.slug}
            id={category.slug}
            tone={i % 2 === 0 ? 'card' : 'page'}
            className={ornamentHost}
          >
            {/* Alterna a peça e o lado a cada categoria, para a sequência de
                faixas não repetir o mesmo canto. */}
            <Ornament
              shape={i % 2 === 0 ? 'lines' : 'wave'}
              place={i % 2 === 0 ? 'bottomRight' : 'left'}
            />
            <Container>
              <div className={s.categoryHead}>
                <h2 className={s.categoryTitle}>{category.name}</h2>
                <p className={s.categoryIntro}>{category.intro}</p>
              </div>
              <Grid cols={3}>
                {items.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </Grid>
            </Container>
          </Section>
        );
      })}

      {/* Entrada alternativa ao catálogo: quem procura "cordão absorvente" não
          sabe necessariamente o que é "linha branca". Cada página reúne o mesmo
          formato nas três linhas. */}
      <Section tone="card" className={ornamentHost}>
        <Ornament shape="wave" place="right" />
        <Container>
          <SectionHeading
            eyebrow="Buscar por formato"
            title="Prefere procurar pelo tipo de peça?"
            description="Os absorventes existem em seis formatos, cada um para uma etapa da resposta. Veja o formato lado a lado nas três linhas e escolha pela substância da sua operação."
          />
          <div style={{ marginTop: 44 }}>
            <Grid cols={3}>
              {formatos.map((f) => (
                <FormatoCard key={f.slug} formato={f} />
              ))}
            </Grid>
          </div>
        </Container>
      </Section>

      <Section tone="page" className={ornamentHost}>
        <Ornament shape="dots" place="topLeft" fade="inLeft" />
        <Container>
          <CTABanner
            eyebrow="Atendimento"
            title="Precisa de uma solução para sua operação?"
            text="Nossa equipe está preparada para entender sua necessidade e indicar os equipamentos mais adequados."
            primary={{ quote: true, label: 'Solicitar orçamento' }}
          />
        </Container>
      </Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
      />
    </>
  );
}
