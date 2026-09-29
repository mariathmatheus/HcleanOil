import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container, Section, SectionHeading, Grid, Badge } from '@/components/ui/Layout';
import { ButtonLink } from '@/components/ui/Button';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Icon } from '@/components/ui/Icon';
import {
  Hero,
  HeroSplit,
  HeroCopy,
  HeroTitle,
  HeroLead,
  Actions,
  Split,
  Prose,
  Breadcrumbs,
  CTABanner,
} from '@/components/sections/Shared';
import { ProductCard } from '@/components/sections/ProductCard';
import { ViewItem } from '@/components/analytics/ViewItem';
import { Ornament, ornamentHost } from '@/components/sections/Ornament';
import {
  findCategory,
  findProduct,
  products,
  relatedProducts,
  site,
} from '@/data/site';
import s from './produto.module.css';

type Params = { params: Promise<{ slug: string }> };

/** Todas as páginas de produto saem prontas do build — HTML estático. */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.lead,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} | ${site.name}`,
      description: product.lead,
      url: `/produtos/${product.slug}`,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const category = findCategory(product.category);
  const related = relatedProducts(product);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.lead,
    category: category?.name,
    image: `${site.url}${product.image}`,
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.legalName },
    additionalProperty: product.specs.map((sp) => ({
      '@type': 'PropertyValue',
      name: sp.label,
      value: sp.value,
    })),
  };

  return (
    <>
      {/* Visualização de produto: alimenta os relatórios do GA4 e a audiência
          de remarketing de quem olhou cada linha sem pedir orçamento. */}
      <ViewItem
        item={{
          item_id: product.slug,
          item_name: product.name,
          item_category: category?.name,
        }}
      />
      <Hero>
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Início' },
            { href: '/produtos', label: 'Produtos' },
            { label: category?.name ?? 'Produto' },
          ]}
        />
        <div style={{ height: 24 }} />
        <HeroSplit>
          <HeroCopy>
            {category ? <Badge tone="inverse">{category.name}</Badge> : null}
            <HeroTitle>{product.name}</HeroTitle>
            <HeroLead>{product.lead}</HeroLead>
            <Actions>
              <QuoteButton size="lg" iconRight="arrow-right" productSlug={product.slug}>Solicitar cotação</QuoteButton>
              <QuoteButton size="lg" variant="inverse-outline" productSlug={product.slug}>Falar com um especialista</QuoteButton>
            </Actions>
          </HeroCopy>
          <div className={s.heroImage}>
            <Image
              src={product.image}
              alt={product.name}
              width={620}
              height={465}
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </HeroSplit>
      </Hero>

      {/* Sobre o produto */}
      <Section tone="page" className={ornamentHost}>
        <Ornament shape="wave" place="right" />
        <Container>
          <Split>
            <Prose>
              <SectionHeading eyebrow="Sobre o produto" title="Descrição técnica" />
              {product.about.map((par) => (
                <p key={par.slice(0, 40)}>{par}</p>
              ))}
            </Prose>
            <div className={s.sideCard}>
              <span className={s.sideTitle}>Características</span>
              <ul className={s.featureList}>
                {product.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={17} strokeWidth={2.25} color="var(--hc-green-600)" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Split>
        </Container>
      </Section>

      {/* Formatos disponíveis — só as linhas de absorvente têm. */}
      {product.formats?.length ? (
        <Section tone="card">
          <Container>
            <SectionHeading
              eyebrow="Formatos disponíveis"
              title="Escolha o formato adequado à operação"
              description="A mesma linha em diferentes formatos, para contenção do perímetro, absorção de superfície ou atendimento pontual."
            />
            <div className={s.formats}>
              {product.formats.map((f) => (
                <article key={f.name} className={s.format}>
                  <div className={s.formatImage}>
                    <Image
                      src={f.image}
                      alt={`${f.name} — ${product.name}`}
                      width={420}
                      height={315}
                      sizes="(max-width: 900px) 100vw, 33vw"
                    />
                  </div>
                  <div className={s.formatBody}>
                    <h3 className={s.formatName}>{f.name}</h3>
                    <p className={s.formatText}>{f.description}</p>
                    <dl className={s.formatMeta}>
                      {f.sizes ? (
                        <>
                          <dt>Tamanhos</dt>
                          <dd>{f.sizes}</dd>
                        </>
                      ) : null}
                      {f.absorption ? (
                        <>
                          <dt>Absorção</dt>
                          <dd>{f.absorption}</dd>
                        </>
                      ) : null}
                    </dl>
                    <ul className={s.formatFeatures}>
                      {f.features.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Aplicações */}
      <Section tone={product.formats?.length ? 'page' : 'card'}>
        <Container>
          <SectionHeading eyebrow="Aplicações" title="Onde utilizar" />
          <ul className={s.applications}>
            {product.applications.map((a) => (
              <li key={a} className={s.application}>
                <Icon name="check" size={18} strokeWidth={2.25} color="var(--hc-green-300)" />
                {a}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Especificações */}
      <Section tone={product.formats?.length ? 'card' : 'page'}>
        <Container>
          <SectionHeading eyebrow="Especificações" title="Dados técnicos" />
          <table className={s.specs}>
            <tbody>
              {product.specs.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      <Section tone="page">
        <Container>
          <CTABanner
            eyebrow="Atendimento técnico"
            title="Precisa definir qual solução atende sua operação?"
            text="Nossa equipe pode ajudar você a identificar o equipamento mais adequado para sua necessidade."
            primary={{ quote: true, productSlug: product.slug, label: 'Solicitar orçamento' }}
          />
        </Container>
      </Section>

      {/* Produtos relacionados */}
      <Section tone="card" className={ornamentHost}>
        <Ornament shape="lines" place="bottomLeft" />
        <Container>
          <SectionHeading
            eyebrow="Produtos relacionados"
            title="Outras soluções que podem complementar sua operação"
          />
          <div style={{ marginTop: 40 }}>
            <Grid cols={3}>
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </Grid>
          </div>
          <div style={{ marginTop: 40 }}>
            <ButtonLink href="/produtos" variant="outline" iconRight="arrow-right">
              Conhecer todos os produtos
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  );
}
