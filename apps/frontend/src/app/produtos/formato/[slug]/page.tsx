import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container, Section, SectionHeading, Badge } from '@/components/ui/Layout';
import { ButtonLink } from '@/components/ui/Button';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Icon } from '@/components/ui/Icon';
import {
  Hero,
  HeroCopy,
  HeroTitle,
  HeroLead,
  Actions,
  Breadcrumbs,
  CTABanner,
} from '@/components/sections/Shared';
import { Ornament, ornamentHost } from '@/components/sections/Ornament';
import { ViewItemList } from '@/components/analytics/ViewItem';
import { formatos, findFormato } from '@/data/formatos';
import { site } from '@/data/site';
import s from './formato.module.css';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return formatos.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const formato = findFormato(slug);
  if (!formato) return {};

  return {
    title: formato.name,
    /* `lead` tem 71 a 84 caracteres e o Google reserva 140 a 160: a descricao
       do resultado vinha metade escrita por nos e metade pincada da pagina. */
    description: formato.seoDescription,
    alternates: { canonical: `/produtos/formato/${formato.slug}` },
    openGraph: {
      type: 'website',
      title: `${formato.name} | ${site.name}`,
      description: formato.seoDescription,
      url: `/produtos/formato/${formato.slug}`,
    },
  };
}

export default async function FormatoPage({ params }: Params) {
  const { slug } = await params;
  const formato = findFormato(slug);
  if (!formato) notFound();

  const outros = formatos.filter((f) => f.slug !== formato.slug);
  const umaVariante = formato.variants.length === 1;

  /* Características que valem para todas as linhas deste formato. As que só
     aparecem em uma são específicas da linha e já constam no card dela. */
  const comuns = formato.variants[0].features.filter((f) =>
    formato.variants.every((v) => v.features.includes(f)),
  );

  const url = `${site.url}/produtos/formato/${formato.slug}`;

  /* Faltavam `image` e `offers`: sem os dois o bloco nao e elegivel a rich
     result de produto. A imagem vem da primeira variante (a foto real da
     peca) e o Offer declara moeda, disponibilidade e onde cotar, sem preco —
     o produto e orcado por especificacao e quantidade. */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: formato.name,
    description: `${formato.lead} ${formato.intro}`,
    category: 'Materiais Absorventes',
    url,
    image: formato.variants.map((v) => `${site.url}${v.image}`),
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.legalName },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'BRL',
        valueAddedTaxIncluded: false,
      },
      areaServed: { '@type': 'Country', name: 'Brasil' },
      seller: { '@type': 'Organization', name: site.legalName, url: site.url },
    },
    /* As linhas em que este formato existe: relaciona a pagina de formato as
       paginas de linha, que e a relacao que a pagina de fato descreve. */
    isRelatedTo: formato.variants.map((v) => ({
      '@type': 'Product',
      name: `${formato.name} — ${v.lineName}`,
      url: `${site.url}/produtos/${v.lineSlug}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Produtos', item: `${site.url}/produtos` },
      { '@type': 'ListItem', position: 3, name: formato.name, item: url },
    ],
  };

  return (
    <>
      {/* Lista: o mesmo formato nas três linhas. Mostra no GA4 qual linha
          costuma ganhar a comparação. */}
      <ViewItemList
        lista={`Formato: ${formato.name}`}
        itens={formato.variants.map((v) => ({
          item_id: `${formato.slug}--${v.lineSlug}`,
          item_name: `${formato.name} — ${v.lineName}`,
          item_category: 'Materiais Absorventes',
          item_variant: v.lineName,
        }))}
      />
      <Hero>
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Início' },
            { href: '/produtos', label: 'Produtos' },
            { label: formato.name },
          ]}
        />
        <div style={{ height: 24 }} />
        <HeroCopy>
          <Badge tone="inverse">
            {umaVariante
              ? 'Linha Branca'
              : `Disponível nas ${formato.variants.length} linhas`}
          </Badge>
          <HeroTitle>{formato.name}</HeroTitle>
          <HeroLead>{formato.lead}</HeroLead>
          <Actions>
            <QuoteButton size="lg" iconRight="arrow-right">
              Solicitar cotação
            </QuoteButton>
          </Actions>
        </HeroCopy>
      </Hero>

      {/* Abertura */}
      <Section tone="page" size="sm" className={ornamentHost}>
        <Ornament shape="wave" place="right" />
        <Container narrow>
          <p
            style={{
              margin: 0,
              font: 'var(--type-body-lg)',
              color: 'var(--text-body)',
            }}
          >
            {formato.intro}
          </p>
        </Container>
      </Section>

      {/* Uma coluna por linha */}
      <Section tone="card" className={ornamentHost}>
        <Ornament shape="rings" place="topLeft" />
        <Container>
          <SectionHeading
            eyebrow={umaVariante ? 'Especificação' : 'Escolha pela linha'}
            title={
              umaVariante
                ? 'Dados técnicos'
                : 'A mesma peça, para três tipos de líquido'
            }
            description={
              umaVariante
                ? undefined
                : 'O formato é o mesmo; o que muda é o líquido que cada linha absorve. Escolha pela substância da sua operação.'
            }
          />

          <div
            className={`${s.variants} ${umaVariante ? s.variantsSingle : ''}`}
          >
            {formato.variants.map((v) => (
              <article key={v.lineSlug} className={s.variant}>
                <div className={s.variantImage}>
                  <Image
                    src={v.image}
                    alt={`${formato.name} — ${v.lineName}`}
                    width={600}
                    height={600}
                    /* MEDIDO a dpr 1. O `(max-width:720px) 100vw, 33vw` tinha
                       o degrau no lugar errado: a grade de `.variants` quebra
                       em 767 e 640 (ver formato.module.css), não em 720.

                         vw= 641 caixa 286 -> servia 750w (2,62x)
                         vw= 720 caixa 326 -> servia 750w (2,30x)
                         vw= 721 caixa 326 -> servia 256w (0,78x AMPLIA)
                         vw=1280 caixa 387 -> servia 640w (1,65x)

                       Os 721px eram o pior caso: logo depois do degrau de 720
                       o `sizes` passava a 33vw = 238 para uma caixa de 326 e o
                       navegador esticava a variante de 256 — borrão numa foto
                       de produto. Alinhado aos degraus reais do CSS: três
                       colunas acima de 767 (travadas pelo container de 1280 em
                       389,3, e o candidato útil é o de 384), duas entre 641 e
                       767, uma até 640. */
                    sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 767px) calc((100vw - 72px) / 2), 384px"
                  />
                </div>
                <div className={s.variantBody}>
                  <h3 className={s.variantLine}>{v.lineName}</h3>
                  <p className={s.variantFor}>{v.lineFor}</p>
                  <p className={s.variantText}>{v.description}</p>

                  {v.sizes || v.absorption ? (
                    <dl className={s.variantSpecs}>
                      {v.absorption ? (
                        <div className={s.variantSpec}>
                          <dt>Absorção</dt>
                          <dd>{v.absorption}</dd>
                        </div>
                      ) : null}
                      {v.sizes ? (
                        <div className={s.variantSpec}>
                          <dt>Tamanhos</dt>
                          <dd>{v.sizes}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  <div className={s.variantCta}>
                    <ButtonLink
                      href={`/produtos/${v.lineSlug}`}
                      variant="outline"
                      size="sm"
                      iconRight="arrow-right"
                    >
                      Ver a linha completa
                    </ButtonLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* O que vale para todas as linhas */}
      {comuns.length ? (
        <Section tone="page" className={ornamentHost}>
          <Ornament shape="lines" place="bottomRight" />
          <Container>
            <SectionHeading
              eyebrow="Características"
              title={
                umaVariante
                  ? 'O que este formato entrega'
                  : 'Comum a todas as linhas'
              }
            />
            <ul className={s.features}>
              {comuns.map((f) => (
                <li key={f} className={s.feature}>
                  <Icon
                    name="check"
                    size={17}
                    strokeWidth={2.25}
                    color="var(--hc-green-600)"
                  />
                  {f}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Outros formatos */}
      <Section tone="card">
        <Container>
          <SectionHeading
            eyebrow="Outros formatos"
            title="Cada etapa da resposta pede um formato"
            description="Contenção do perímetro, absorção em superfície, proteção de piso e absorção pontual — normalmente usados juntos."
          />
          <div className={s.others}>
            {outros.map((f) => (
              <Link
                key={f.slug}
                href={`/produtos/formato/${f.slug}`}
                className={s.other}
              >
                <span className={s.otherName}>{f.name}</span>
                <span className={s.otherLead}>{f.lead}</span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="page">
        <Container>
          <CTABanner
            eyebrow="Atendimento"
            title={`Precisa de ${formato.name.toLowerCase()} para sua operação?`}
            text="Informe a linha e a quantidade e nossa equipe retorna com a proposta."
            primary={{ quote: true, label: 'Solicitar orçamento' }}
            secondary={{ href: '/produtos', label: 'Ver todos os produtos' }}
          />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
