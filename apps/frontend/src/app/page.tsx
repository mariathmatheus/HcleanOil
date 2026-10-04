import type { Metadata } from 'next';
import Image from 'next/image';
import { Container, Section, SectionHeading, Grid } from '@/components/ui/Layout';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  Split,
  Prose,
  Feature,
  Wave,
  BrandWaveArt,
  BrandLinesArt,
  BrandRingsArt,
  BrandDotsArt,
  CTABanner,
} from '@/components/sections/Shared';
import { VideoHero } from '@/components/sections/VideoHero';
import { ProductCard } from '@/components/sections/ProductCard';
import { categories, caseStudies, faq, pillars, products, site, anosDeCasa } from '@/data/site';
import s from './home.module.css';

export const metadata: Metadata = {
  title: `${site.name} — ${site.titleShort}`,
  description: site.description,
  alternates: { canonical: '/' },
};

/** Números exibidos dentro do hero, como no site anterior. */
const heroStats = [
  { icon: 'medal' as const, value: `${anosDeCasa}+`, label: 'anos de experiência no mercado' },
  { icon: 'ruler' as const, value: '500K+', label: 'metros de barreira fabricados' },
  { icon: 'users' as const, value: '10K+', label: 'emergências atendidas com nossos equipamentos' },
];

/* O FAQ vira dados estruturados: o Google usa isso para o rich result de
   perguntas, que ocupa mais espaço no resultado de busca. */
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <VideoHero
        title="Equipamentos de proteção ambiental"
        titleAccent="com qualidade comprovada"
        lead="Durabilidade, resistência e qualidade que garantem agilidade, segurança e conformidade ambiental no seu dia a dia operacional."
        /* O poster é o LCP da home e continua sendo a única imagem no caminho
           crítico. O vídeo é decoração: entra depois do load, só no desktop e
           só para quem não pediu menos movimento. */
        poster="/institucional/hero.webp"
        posterMobile="/institucional/hero-mobile.webp"
        posterAlt="Barreira de contenção HCLEAN cercando uma área durante operação de resposta"
        video={{ webm: '/video/background.webm', mp4: '/video/background.mp4' }}
        stats={heroStats}
        primary={{ quote: true, label: 'Fale com um especialista' }}
        secondary={{ href: '/produtos', label: 'Conheça nossos produtos' }}
      />

      {/* Experiência */}
      <Section tone="page" className={s.experience}>
        <BrandWaveArt className={s.experienceArt} />
        <Container>
          <Split>
            <Prose>
              <SectionHeading
                eyebrow="O material certo para a operação"
                title="O fabricante brasileiro com experiência em grandes emergências ambientais"
                description="Quando a emergência bate à porta, somos a escolha de quem não pode errar."
              />
              <p>
                A HCLEAN fabrica equipamentos para contenção, absorção e atendimento
                inicial, ajudando empresas e equipes operacionais a estarem preparadas
                para agir com segurança e eficiência.
              </p>
              <ul className={s.highlights}>
                {[
                  'Fabricação própria',
                  'Sob medida',
                  'Estoque para pronta resposta',
                  'Atuação nacional',
                ].map((h) => (
                  <li key={h} className={s.highlight}>
                    <Icon name="check" size={15} strokeWidth={2.4} />
                    {h}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/sobre" variant="outline" iconRight="arrow-right">
                Conheça a HCLEAN
              </ButtonLink>
            </Prose>
            {/* Aqui a foto aérea ajuda: mostra a barreira cercando a área,
                que é exatamente o que o texto ao lado descreve. */}
            <div className={s.sideImage}>
              <Image
                src="/produtos/barreira-em-operacao.webp"
                alt="Barreira de contenção HCLEAN cercando uma área durante operação de resposta"
                width={1024}
                height={680}
                /* Bem abaixo da dobra, mas entrava na rede no instante exato
                   em que o hero precisa pintar, disputando banda com o LCP. */
                loading="lazy"
                /* MEDIDO a dpr 1 em cada degrau. O `40vw` anterior não errava
                   de direção — nunca ampliava — mas pedia pixel a mais em
                   toda a faixa de desktop, porque a coluna do Split (0,9fr)
                   TRAVA a imagem em 547,5px a partir de 1280 enquanto o 40vw
                   continua crescendo com a janela:

                     vw=1024 caixa 426  -> servia 640w  (1,50x)
                     vw=1200 caixa 510  -> servia 640w  (1,26x)
                     vw=1280 caixa 548  -> servia 640w  (1,17x)
                     vw=1920 caixa 548  -> servia 828w  (1,51x)

                   Acima de 900px o Split é 1fr/0,9fr com gap de 56px dentro do
                   container de 1280 e gutter-lg de 32: (1280-64-56)*0,9/1,9 =
                   547,6. Declarar os 548px fixos põe 1280 e 1920 no mesmo
                   degrau de 640w em vez de 828w.

                   Abaixo de 900 o Split vira 1 coluna e a imagem ocupa a
                   largura da página menos o padding (medido: 318 a 360px,
                   834 a 900px) — daí o calc() em vez do 92vw, que a 360px
                   pedia 331 para uma caixa de 318. */
                sizes="(max-width: 900px) calc(100vw - 42px), 548px"
              />
              <span className={s.imageBadge}>
                <Icon name="shield" size={16} />
                <span>
                  <strong>Operação real</strong> · contenção em campo
                </span>
              </span>
            </div>
          </Split>
        </Container>
      </Section>

      {/* Soluções */}
      <Section tone="card" className={s.solutions}>
        <BrandLinesArt className={s.solutionsArt} />
        <Container>
          <SectionHeading
            eyebrow="Nossas soluções"
            title="Equipamentos para cada etapa da resposta ambiental"
            description="Da contenção do contaminante à absorção e ao atendimento inicial, a HCLEAN oferece soluções para diferentes necessidades operacionais."
          />
          <div style={{ marginTop: 48 }}>
            <Grid cols={4}>
              {categories.map((c) => (
                <Feature key={c.slug} icon={c.icon} title={c.name} text={c.short} />
              ))}
            </Grid>
          </div>
          <div style={{ marginTop: 40 }}>
            <ButtonLink href="/produtos" variant="outline" iconRight="arrow-right">
              Ver todos os produtos
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Produtos */}
      <Section tone="page" className={s.products}>
        <BrandRingsArt className={s.productsArt} />
        <Container>
          <div className={s.rowHead}>
            <SectionHeading
              eyebrow="Produtos"
              title="Soluções prontas para a operação"
            />
            <ButtonLink href="/produtos" variant="outline" iconRight="arrow-right">
              Ver produtos
            </ButtonLink>
          </div>
          <Grid cols={3}>
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Operações reais */}
      <Wave from="var(--surface-page)" to="var(--hc-green-800)" />
      <Section tone="inverse" className={s.cases}>
        <BrandDotsArt className={s.casesArt} />
        <Container>
          <SectionHeading
            tone="light"
            eyebrow="Operações reais"
            title="Equipamentos presentes em grandes emergências ambientais"
            description="Quem já testou, recomenda. Algumas das operações atendidas com equipamentos HCLEAN."
          />
          <div style={{ marginTop: 48 }}>
            <Grid cols={4}>
              {caseStudies.map((c) => (
                <article key={c.name} className={s.case}>
                  <h3 className={s.caseName}>{c.name}</h3>
                  <p className={s.caseText}>{c.text}</p>
                </article>
              ))}
            </Grid>
          </div>
        </Container>
      </Section>

      <Wave from="var(--hc-green-800)" to="var(--surface-page)" />

      {/* Por que HCLEAN */}
      <Section tone="page">
        <Container>
          <SectionHeading
            eyebrow="Por que HCLEAN?"
            title="Experiência técnica para situações que não podem esperar."
          />
          <div style={{ marginTop: 48 }}>
            <Grid cols={4}>
              {pillars.map((p) => (
                <Feature key={p.title} icon={p.icon} title={p.title} text={p.text} />
              ))}
            </Grid>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="card" className={s.faqSection}>
        <BrandWaveArt className={s.faqArt} />
        <Container narrow>
          <SectionHeading
            eyebrow="Dúvidas frequentes"
            title="Perguntas frequentes"
          />
          <div className={s.faq}>
            {faq.map((f) => (
              /* <details> nativo: acordeão acessível e sem uma linha de JS. */
              <details key={f.q} className={s.faqItem}>
                <summary className={s.faqQuestion}>
                  {f.q}
                  <Icon name="chevron-right" size={18} className={s.faqChevron} />
                </summary>
                <p className={s.faqAnswer}>{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA final */}
      <Section tone="page">
        <Container>
          <CTABanner
            eyebrow="Atendimento técnico"
            title="Sua operação está preparada para uma emergência ambiental?"
            text="Conte com equipamentos adequados para contenção, absorção e atendimento. Fale com nossa equipe e encontre a solução mais adequada para sua operação."
            primary={{ quote: true, label: 'Falar com um especialista' }}
            secondary={{ href: '/produtos', label: 'Ver produtos' }}
          />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
