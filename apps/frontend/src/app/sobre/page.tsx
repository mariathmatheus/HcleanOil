import type { Metadata } from 'next';
import Image from 'next/image';
import { Container, Section, SectionHeading, Grid, Badge } from '@/components/ui/Layout';
import {
  Hero,
  HeroCopy,
  HeroTitle,
  HeroLead,
  Split,
  Prose,
  Stat,
  CTABanner,
} from '@/components/sections/Shared';
import { Ornament, ornamentHost } from '@/components/sections/Ornament';
import { caseStudies, proofPoints, site } from '@/data/site';
import s from './sobre.module.css';

export const metadata: Metadata = {
  title: 'Quem somos',
  description:
    'A HCLEAN nasceu em 2004, após o acidente com o navio Vicuña em Paranaguá, e fabrica equipamentos para resposta a emergências ambientais há mais de 18 anos.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
  return (
    <>
      <Hero>
        <HeroCopy>
          <Badge tone="inverse">Desde 2004</Badge>
          <HeroTitle>Mais de 18 anos fabricando proteção ambiental</HeroTitle>
          <HeroLead>
            A HCLEAN fabrica equipamentos para resposta a emergências ambientais,
            apoiando empresas e equipes operacionais em situações que exigem preparo,
            rapidez e confiabilidade.
          </HeroLead>
        </HeroCopy>
      </Hero>

      {/* História */}
      <Section id="historia" tone="page" className={ornamentHost}>
        <Ornament shape="wave" place="left" />
        <Container>
          <Split>
            <Prose>
              <SectionHeading
                eyebrow="Nossa história"
                title="Uma empresa nascida de uma emergência real"
              />
              <p>
                A HCLEAN foi criada após o acidente de 2004 em Paranaguá, onde o navio
                chileno Vicuña explodiu em um terminal privado. Desde então, a empresa
                fabrica materiais absorventes e barreiras de contenção voltados à
                prevenção e à redução dos impactos ao meio ambiente.
              </p>
              <p>
                Ainda naquela época foi firmada uma parceria com uma empresa líder em
                proteção ambiental, fornecendo equipamentos para utilização em seus
                serviços.
              </p>
              <p>
                Dentre nossa linha de produtos e equipamentos, destacam-se os absorventes
                sintéticos e naturais, as barreiras de contenção, os kits de emergência e
                os tanques para armazenamento temporário.
              </p>
            </Prose>
            <div className={s.image}>
              <Image
                src="/produtos/barreira-em-operacao.webp"
                alt="Operação de cerco com barreira de contenção HCLEAN"
                width={560}
                height={420}
                /* MEDIDO a dpr 1: acima de 900px a coluna do Split trava a
                   imagem em 547,5px, e o 40vw continuava crescendo com a
                   janela — a 1920 servia 828w para uma caixa de 548 (1,51x).
                   Abaixo de 900 o Split vira 1 coluna e a imagem ocupa a
                   largura da pagina menos o padding. Mesma geometria do painel
                   lateral da home; ver o comentario em app/page.tsx. */
                sizes="(max-width: 900px) calc(100vw - 42px), 548px"
              />
            </div>
          </Split>
        </Container>
      </Section>

      {/* Números */}
      <Section tone="inverse" className={ornamentHost}>
        <Ornament shape="dots" place="topRight" onDark fade="in" keepOnMobile />
        <Container>
          <SectionHeading
            tone="light"
            eyebrow="Nossos números"
            title="Experiência que pode ser comprovada"
          />
          <div style={{ marginTop: 48 }}>
            <Grid cols={4}>
              {proofPoints.map((p) => (
                <Stat key={p.label} value={p.value} label={p.label} />
              ))}
            </Grid>
          </div>
        </Container>
      </Section>

      {/* Operações reais */}
      <Section id="operacoes" tone="page" className={ornamentHost}>
        <Ornament shape="rings" place="topLeft" />
        <Container>
          <SectionHeading
            eyebrow="Experiência em campo"
            title="Equipamentos presentes em operações reais"
            description="Emergências ambientais exigem mais do que produtos disponíveis em catálogo. Exigem equipamentos adequados, preparo e capacidade de resposta."
          />
          <div style={{ marginTop: 48 }}>
            <Grid cols={2}>
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

      {/* Fabricação */}
      <Section tone="card" className={ornamentHost}>
        <Ornament shape="lines" place="bottomRight" />
        <Container>
          <Split reverse>
            <div className={s.image}>
              <Image
                src="/produtos/absorventes-sinteticos.webp"
                alt="Linhas de material absorvente fabricadas pela HCLEAN"
                width={560}
                height={560}
                /* MEDIDO a dpr 1: acima de 900px a coluna do Split trava a
                   imagem em 547,5px, e o 40vw continuava crescendo com a
                   janela — a 1920 servia 828w para uma caixa de 548 (1,51x).
                   Abaixo de 900 o Split vira 1 coluna e a imagem ocupa a
                   largura da pagina menos o padding. Mesma geometria do painel
                   lateral da home; ver o comentario em app/page.tsx. */
                sizes="(max-width: 900px) calc(100vw - 42px), 548px"
              />
            </div>
            <Prose>
              <SectionHeading
                eyebrow="Fabricação nacional"
                title="Equipamentos fabricados no Brasil"
              />
              <p>
                Fabricamos barreiras de contenção sob medida, três linhas de material
                absorvente para diferentes tipos de líquido, kits de emergência conforme
                normas internacionais e tanques para armazenamento temporário.
              </p>
              <p>
                A produção nacional permite atender medidas específicas de cada operação e
                manter estoque para resposta rápida em todo o território brasileiro.
              </p>
            </Prose>
          </Split>
        </Container>
      </Section>

      <Section tone="page">
        <Container>
          <CTABanner
            eyebrow="Atendimento"
            title="Precisa de uma solução para sua operação?"
            text="Nossa equipe está preparada para entender sua necessidade e indicar os equipamentos mais adequados."
            primary={{ quote: true, label: 'Solicitar orçamento' }}
            secondary={{ href: '/produtos', label: 'Ver produtos' }}
          />
        </Container>
      </Section>
    </>
  );
}
