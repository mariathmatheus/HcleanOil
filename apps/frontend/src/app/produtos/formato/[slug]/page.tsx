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
    description: formato.lead,
    alternates: { canonical: `/produtos/formato/${formato.slug}` },
    openGraph: {
      type: 'website',
      title: `${formato.name} | ${site.name}`,
      description: formato.lead,
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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: formato.name,
    description: formato.lead,
    category: 'Materiais Absorventes',
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.legalName },
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
                    sizes="(max-width: 720px) 100vw, 33vw"
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
    </>
  );
}
