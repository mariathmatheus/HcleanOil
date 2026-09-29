import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Container } from '@/components/ui/Layout';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/data/site';
import s from './HeroBanner.module.css';

type Stat = { icon: IconName; value: string; label: string };

type Props = {
  title: string;
  /** Segunda linha do título, destacada em verde. */
  titleAccent?: string;
  lead: string;
  /** A ação principal pode navegar (`href`) ou abrir o pop-up (`quote`). */
  primary: { label: string } & ({ href: string } | { quote: true });
  secondary?: { href: string; label: string };
  stats?: Stat[];
  /** Imagem de fundo, atrás do overlay. */
  image: string;
  imageAlt: string;
};

export function Hero({
  title,
  titleAccent,
  lead,
  primary,
  secondary,
  stats,
  image,
  imageAlt,
}: Props) {
  return (
    <section className={s.hero}>
      <div className={s.media}>
        {/* Esta imagem é o LCP da home: `priority` a tira da fila de lazy
            loading e a coloca no preload do documento. */}
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          /* Esta imagem e o elemento LCP da home. `priority` ja gera o
             preload; `fetchPriority` diz ao navegador para nao disputar banda
             com o CSS e o JS no mesmo instante. */
          fetchPriority="high"
          /* Acima de 1600px a imagem ja cobre a tela: pedir 1920 so aumenta o
             encode sem diferenca visivel. */
          sizes="(max-width: 900px) 100vw, 1600px"
          quality={72}
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div className={s.scrim} />

      <Container>
        <div className={s.inner}>
          <h1 className={s.title}>
            {title}
            {titleAccent ? (
              <>
                {' '}
                <span className={s.titleAccent}>{titleAccent}</span>
              </>
            ) : null}
          </h1>

          <p className={s.lead}>{lead}</p>

          {stats?.length ? (
            <dl className={s.stats}>
              {stats.map((st) => (
                <div key={st.label} className={s.stat}>
                  {/* O rótulo é o termo e o número é a definição, mas
                      visualmente o número vem primeiro — daí a ordem invertida
                      no CSS em vez de trocar a semântica.

                      O ícone vive dentro do <dd>, não solto entre <dt> e <dd>:
                      um <dl> (e os <div> de agrupamento dentro dele) só aceita
                      dt, dd, script e template. Um <span> irmão quebra a regra
                      e era o que segurava a home em 93 de acessibilidade. */}
                  <dt className={s.statLabel}>{st.label}</dt>
                  <dd className={s.statValue}>
                    <span className={s.statIcon} aria-hidden="true">
                      <Icon name={st.icon} size={30} strokeWidth={1.6} />
                    </span>
                    {st.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className={s.actions}>
            {'href' in primary ? (
              <ButtonLink href={primary.href} size="lg" iconRight="arrow-right">
                {primary.label}
              </ButtonLink>
            ) : (
              <QuoteButton size="lg" iconRight="arrow-right">
                {primary.label}
              </QuoteButton>
            )}
            {secondary ? (
              <ButtonLink href={secondary.href} size="lg" variant="inverse-outline">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Container>

      {/* A curva fecha na cor da seção seguinte e toca a base do quadro, para
          não sobrar uma tira escura abaixo da onda. */}
      <div className={s.wave} aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,52 C240,110 480,120 720,96 C960,72 1200,18 1440,44 L1440,120 L0,120 Z"
            fill="var(--surface-page)"
          />
        </svg>
      </div>
    </section>
  );
}
