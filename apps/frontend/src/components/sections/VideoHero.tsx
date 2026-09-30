import Image, { getImageProps } from 'next/image';
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
  /**
   * Recorte retrato do mesmo quadro, para telas estreitas. Ver o comentário
   * longo junto das duas <Image> abaixo: não é capricho de enquadramento, é o
   * que decide qual variante o telefone baixa.
   */
  posterMobile?: string;
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
  posterMobile,
  posterAlt,
}: Props) {
  const hasVideo = Boolean(video?.mp4 || video?.webm);

  /*
    As props do <picture> saem daqui. `fill` dá o posicionamento absoluto que
    o hero já esperava; o `style` do componente é descartado porque o
    enquadramento vem do CSS (.poster), junto do `object-fit: cover`.

    Os dois só são calculados quando existe recorte de telefone — sem ele o
    caminho é a <Image> normal, mais abaixo.
  */
  const mobileImg = posterMobile
    ? getImageProps({
        src: posterMobile,
        alt: posterAlt,
        fill: true,
        /*
          Fonte retrato, mas o cover ainda é ditado pela ALTURA — e por pouco.
          O recorte tem 1080x1980 (proporção 0,545) e no telefone o hero mede
          390x776 (0,503): a caixa é MAIS ESTREITA que a fonte, então é a
          altura que sobra e a largura que falta.

          Medido: com `100vw` o otimizador entregava 390px de largura para uma
          caixa que precisa de 776 x 1080/1980 = 424px, ou seja 1,08x de
          ampliação a 390px e 1,32x a 320px — o pôster voltava a borrar, que é
          exatamente o defeito que o recorte veio corrigir.

          `100vw`, e não um valor derivado da altura: o recorte 1080x1980 é
          MAIS alto em proporção que o quadro do hero em qualquer telefone
          testado (390x776 dá 0,503 contra 0,545 da fonte), então quem dita a
          escala é a LARGURA e o `sizes` volta a ser simplesmente a largura da
          janela. Medido: 320, 360, 390, 412 e 1440 px baixam uma variante
          cada, sem ampliação.

          Um valor em `vh` foi tentado aqui e reintroduziu o borrão — pedia
          uma variante pequena demais e o navegador a esticava até 4,6x. Se
          mexer neste valor, medir `naturalWidth` contra a largura renderizada
          vezes o DPR antes de dar por certo.
        */
        sizes: '100vw',
        quality: 55,
      }).props
    : null;

  const desktopImg = posterMobile
    ? getImageProps({
        src: poster,
        alt: posterAlt,
        fill: true,
        /* Acima de 900px o hero tem no máximo 760px de altura e a LARGURA
           volta a ser o lado que manda, com teto de 1600: acima disso a
           imagem já cobre a tela e só cresceria o encode. */
        sizes: '(max-width: 1600px) 100vw, 1600px',
        quality: 68,
      }).props
    : null;

  return (
    <section className={s.hero}>
      <div className={s.media}>
        {/*
          O poster é o LCP da home: precisa vir otimizado e cedo. O vídeo entra
          por cima quando puder — em conexão lenta, no telefone ou com "reduzir
          movimento" o poster simplesmente permanece.

          POR QUE UM <picture>, E NÃO UM `sizes` MAIS ESPERTO.

          Com `object-fit: cover` a escala é ditada pela dimensão mais folgada.
          No telefone o hero é RETRATO (412x755) e a fonte é PAISAGEM 16:9,
          então quem manda é a ALTURA: para cobrir 755px, a 1920x1080 é
          desenhada com 1342px de LARGURA, dos quais só 412 aparecem. Os
          outros 930 são cortados fora da tela.

          É o pior dos dois mundos. O `sizes` PRECISA declarar os 1342px —
          senão o navegador escolhe uma variante pequena e a amplia, que era o
          bug do borrão (2,4x). Mas declará-los honestamente significa pedir
          1342 x DPR 1,75 = 2347px reais, e o Next arredonda para `w=1920`: o
          telefone baixava 33 kB para mostrar uma faixa de 412px.

          Nenhum `sizes` conserta isso, porque o `sizes` estava CERTO — errada
          era a GEOMETRIA. Mexer nele só reintroduz a ampliação.

          A saída é dar ao telefone um recorte que já nasce retrato (1080x1980,
          o mesmo centro que era o único pedaço visível). Aí o cover passa a
          ser ditado pela LARGURA e a conta vira 412 x 1,75 = 721px →
          variante `w=750`, 14 kB.

          O corte é 540px, e não os 900px do resto do hero: entre 540 e 900 a
          caixa já é larga o bastante para que o recorte retrato saia ESTICADO
          (medido: 1,86x num tablet de 768 a 2 DPR). Nessa faixa a paisagem é
          a fonte mais nítida, então o <source> só vale até 540.

          O recorte tem 1080 de largura embora o telefone comum baixe o degrau
          de 750: o tamanho intrínseco não muda o degrau escolhido (412 x 1,75
          continua 721), ele só dá teto para os aparelhos de 3 DPR, que sem
          isso pediriam mais do que o arquivo tem.

          E POR QUE <picture> E NÃO DUAS <Image> COM `display: none`:
          o scanner de preload lê `src`/`srcset` durante o parsing, ANTES de
          aplicar CSS. Duas <img> no HTML servido são duas imagens baixadas,
          escondidas ou não — medido: o telefone pagava +7 kB e o desktop
          +17 kB por arquivos que nunca pintava. Só o `media` do <source>
          resolve em MARKUP, e por isso é o único que o scanner respeita.

          `getImageProps` é a API pública do Next para este caso: dá o srcset
          já apontando para o otimizador, sem montar URL na mão.
        */}
        {posterMobile && mobileImg && desktopImg ? (
          <>
            {/*
              `getImageProps` não emite preload — quem fazia isso era o
              `priority` da <Image>. Como o LCP é justamente este pôster, o
              preload é recriado à mão, e aqui ele PODE levar `media`: é um
              <link> de verdade, não o que o Next gera. Assim cada formato
              pré-carrega só o seu arquivo, e o scanner continua achando a
              imagem antes do CSS.
            */}
            <link
              rel="preload"
              as="image"
              media="(max-width: 540px)"
              imageSrcSet={mobileImg.srcSet}
              imageSizes={mobileImg.sizes}
              fetchPriority="high"
            />
            <link
              rel="preload"
              as="image"
              media="(min-width: 540.02px)"
              imageSrcSet={desktopImg.srcSet}
              imageSizes={desktopImg.sizes}
              fetchPriority="high"
            />
            <picture>
              <source media="(max-width: 540px)" srcSet={mobileImg.srcSet} sizes={mobileImg.sizes} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                {...desktopImg}
                alt={posterAlt}
                className={s.poster}
                fetchPriority="high"
                decoding="async"
                /* `getImageProps` devolve `loading="lazy"` por padrão, e aqui
                   o `priority` da <Image> não existe para corrigi-lo. Hoje os
                   <link rel="preload"> acima buscam o arquivo de qualquer
                   forma, então o atributo errado não custa nada — mas deixá-lo
                   assim faz a página depender do preload para anular um
                   `lazy` no elemento que é o próprio LCP. Se o preload sair
                   numa refatoração, a regressão é silenciosa. */
                loading="eager"
              />
            </picture>
          </>
        ) : (
          <Image
            src={poster}
            alt={posterAlt}
            fill
            priority
            /* `priority` já gera o preload; `fetchPriority` diz ao navegador
               para não disputar banda com o CSS e o JS no mesmo instante. */
            fetchPriority="high"
            sizes="(max-width: 1600px) 100vw, 1600px"
            quality={68}
            style={{ objectFit: 'cover' }}
          />
        )}
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
