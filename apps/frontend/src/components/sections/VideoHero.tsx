import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Container } from '@/components/ui/Layout';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/data/site';
import { VideoHeroPlayer } from './VideoHeroPlayer';
import s from './VideoHero.module.css';

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
  /** Vídeo de fundo. Sem ele, o hero usa só o poster. */
  video?: { webm?: string; mp4?: string };
  /** Imagem exibida antes do vídeo carregar e no mobile. */
  poster: string;
  posterAlt: string;
};

export function VideoHero({
  title,
  titleAccent,
  lead,
  primary,
  secondary,
  stats,
  video,
  poster,
  posterAlt,
}: Props) {
  const hasVideo = Boolean(video?.mp4 || video?.webm);

  return (
    <section className={s.hero}>
      <div className={s.media}>
        {/*
          O poster é uma <Image> de verdade, com priority: é ele que conta como
          LCP, então precisa vir otimizado e cedo. O vídeo entra por cima
          quando puder — em conexão lenta, no telefone ou com "reduzir
          movimento" o poster simplesmente permanece.
        */}
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority
          /* `priority` já gera o preload; `fetchPriority` diz ao navegador para
             não disputar banda com o CSS e o JS no mesmo instante. */
          fetchPriority="high"
          /*
            Com `object-fit: cover` num quadro mais alto que largo, a escala é
            ditada pela ALTURA, não pela largura do hero — e `sizes` fala em
            largura. No telefone o hero mede ~390x776: para cobrir essa altura,
            uma fonte 16:9 precisa de 776 x 16/9 ≈ 1380px de largura. Pedir
            `100vw` (390px) trazia a variante de 640px e o navegador a ampliava
            2,4x, virando um borrão — era o que fazia o hero parecer um bloco
            verde chapado no celular.

            Daí `178vh` abaixo de 900px: 16/9 da altura da janela é exatamente
            a largura de origem que o cover consome. No desktop a altura é
            limitada a 760px e a largura volta a ser o lado que manda, então
            vale a largura da janela, com teto de 1600 (acima disso a imagem já
            cobre a tela e só cresceria o encode).
          */
          sizes="(max-width: 900px) 178vh, (max-width: 1600px) 100vw, 1600px"
          quality={68}
          style={{ objectFit: 'cover' }}
        />
        {/*
          O vídeo vive num componente de cliente à parte para que este hero
          continue no servidor. Ele é quem decide se o vídeo existe: nada de
          vídeo no telefone nem com "reduzir movimento", e o elemento só entra
          no DOM depois do `load`, para nunca disputar rede com o LCP acima.
        */}
        {hasVideo ? <VideoHeroPlayer webm={video?.webm} mp4={video?.mp4} /> : null}
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
                      e já custou pontos de acessibilidade nesta home. */}
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
