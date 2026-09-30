import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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
import { formatoSlugPorNome } from '@/data/formatos';
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

  /* `seoTitle` ja vem com o sufixo da marca; o `title` cru passa pelo
     template do layout. Sem ele o titulo seria o nome de catalogo, que nao e
     o termo buscado. */
  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.lead;

  return {
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/produtos/${product.slug}`,
      /* `images` sai daqui de proposito.
         A foto de catalogo e quadrada (1920x1920) e o WhatsApp/Facebook cortam
         para 1.91:1 — a da Linha Branca virava um retangulo branco sem produto
         e sem marca. Existe `opengraph-image.tsx` nesta mesma rota, que gera o
         cartao 1200x630 com nome e lead legiveis, mas declarar `images` aqui
         sobrescrevia esse arquivo: o HTML servido apontava para o .webp cru.
         Omitindo o campo, o Next volta a usar a rota gerada. */
    },
  };
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const category = findCategory(product.category);
  const related = relatedProducts(product);

  const url = `${site.url}/produtos/${product.slug}`;

  /* Sem `offers` o Google considera o Product incompleto e nao concorre a
     rich result nenhum — era o caso aqui. Nao ha preco de tabela: tudo e
     fabricado sob medida e cotado caso a caso. A forma honesta de declarar
     isso e um Offer com a moeda e a disponibilidade, SEM `price`, mais
     `availability: InStock` (fabricamos e atendemos) e a URL onde se pede a
     cotacao. Inventar um preco aqui seria dado falso no resultado de busca. */
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.lead,
    category: category?.name,
    image: `${site.url}${product.image}`,
    url,
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.legalName },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      /* Cotacao sob consulta: preco definido por especificacao e quantidade. */
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'BRL',
        valueAddedTaxIncluded: false,
      },
      areaServed: { '@type': 'Country', name: 'Brasil' },
      seller: { '@type': 'Organization', name: site.legalName, url: site.url },
    },
    additionalProperty: product.specs.map((sp) => ({
      '@type': 'PropertyValue',
      name: sp.label,
      value: sp.value,
    })),
  };

  /* A trilha visual existia desde sempre; faltava o equivalente estruturado,
     que e o que faz o Google trocar a URL crua pelo caminho
     "Inicio > Produtos > Categoria" no resultado de busca. */
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Produtos', item: `${site.url}/produtos` },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ],
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
              /* MEDIDO a dpr 1. O `45vw` crescia com a janela, mas a coluna do
                 HeroSplit TRAVA a imagem em 549px a partir de 1280:

                   vw= 900 caixa 834 -> servia 1080w (1,29x)
                   vw=1280 caixa 549 -> servia  640w (1,17x)
                   vw=1440 caixa 549 -> servia  750w (1,37x)
                   vw=1920 caixa 549 -> servia 1080w (1,97x)

                 A 1920 isso é o DOBRO dos pixels necessários numa imagem com
                 `priority`, ou seja no caminho crítico do LCP desta página.
                 Fixar 549px acima de 900 põe 1280, 1440 e 1920 todos no degrau
                 de 640w. Abaixo de 900 o Split é 1 coluna. */
              sizes="(max-width: 900px) calc(100vw - 42px), 549px"
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
                      /* MEDIDO a dpr 1. O `(max-width:900px) 100vw, 33vw`
                         errava nas DUAS direções, porque o grid de formatos
                         quebra em 1024 e 640, não em 900:

                           vw= 720 caixa 326 -> servia  750w (2,30x)
                           vw= 768 caixa 350 -> servia  828w (2,37x)
                           vw= 900 caixa 404 -> servia 1080w (2,67x)
                           vw= 901 caixa 404 -> servia  384w (0,95x AMPLIA)
                           vw=1024 caixa 466 -> servia  384w (0,82x AMPLIA)

                         Entre 641 e 900 o grid já é de 2 colunas mas o `sizes`
                         ainda declarava 100vw — 2,5x de pixels. E em 901-1024
                         o 33vw caía ABAIXO da caixa e o navegador esticava a
                         variante, que é o mesmo defeito que o hero já teve.

                         Acima de 1024 são três colunas travadas pelo container
                         de 1280: (1280-64-48)/3 = 389,3, e o degrau útil é o
                         de 384 — pedir 390 passava do candidato e subia para
                         640w, quase o dobro dos bytes por 6px. */
                      sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc((100vw - 88px) / 2), 384px"
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
                    {/* Liga o card a pagina daquele formato, que compara as
                        tres linhas lado a lado. Sem este link as 6 paginas de
                        formato so recebiam autoridade de /produtos. */}
                    {formatoSlugPorNome(f.name) ? (
                      <Link
                        href={`/produtos/formato/${formatoSlugPorNome(f.name)}`}
                        className={s.formatLink}
                      >
                        Comparar {f.name.toLowerCase()} nas três linhas
                        <Icon name="arrow-right" size={15} strokeWidth={2.25} />
                      </Link>
                    ) : null}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
