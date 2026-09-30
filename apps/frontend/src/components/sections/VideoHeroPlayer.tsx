'use client';

import { useEffect, useRef, useState } from 'react';
import s from './VideoHero.module.css';

type Props = {
  webm?: string;
  mp4?: string;
};

/**
 * Largura mínima para o vídeo existir. Espelha o `@media (max-width: 900px)`
 * de VideoHero.module.css — media query não lê custom property, então o número
 * vive nos dois lugares.
 *
 * Abaixo disso o telefone fica só com o poster: o vídeo é decorativo, e no
 * mobile ele custaria ~450 KB, decode e composição contínua justamente onde a
 * nota de performance é mais frágil. O hero não perde nada visualmente porque
 * o poster é o primeiro quadro do mesmo plano.
 */
const TELA_GRANDE = '(min-width: 901px)';

/** Quem pediu menos movimento não recebe vídeo nenhum — fica o poster. */
const SEM_MOVIMENTO = '(prefers-reduced-motion: reduce)';

/**
 * Único componente de cliente do hero — existe só para decidir *se* e *quando*
 * o vídeo entra. O VideoHero em volta continua renderizado no servidor.
 *
 * Por que não deixar o `autoPlay` do HTML resolver: o navegador começa a
 * buscar o vídeo assim que o elemento aparece no DOM, ou seja, durante o
 * carregamento, disputando banda com o poster que é o LCP. Aqui o <video> só é
 * montado depois do evento `load`, quando o LCP já pintou e a rede está livre.
 */
export function VideoHeroPlayer({ webm, mp4 }: Props) {
  /* Começa falso mesmo no desktop: o servidor não sabe a largura da tela nem a
     preferência de movimento, e um <video> no HTML inicial já seria buscado. */
  const [liberado, setLiberado] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const grande = window.matchMedia(TELA_GRANDE);
    const quieto = window.matchMedia(SEM_MOVIMENTO);

    const decidir = () => setLiberado(grande.matches && !quieto.matches);

    /* Só depois do `load` — antes disso o poster ainda pode estar na rede, e é
       ele que conta como LCP. Se a página já carregou (navegação de cliente
       entre rotas), decide na hora. */
    const aoCarregar = () => {
      decidir();
      grande.addEventListener('change', decidir);
      quieto.addEventListener('change', decidir);
    };

    if (document.readyState === 'complete') {
      /* Um quadro de folga para não competir com o trabalho de hidratação que
         acontece no mesmo instante. */
      const id = requestAnimationFrame(aoCarregar);
      return () => cancelAnimationFrame(id);
    }

    window.addEventListener('load', aoCarregar, { once: true });
    return () => {
      window.removeEventListener('load', aoCarregar);
      grande.removeEventListener('change', decidir);
      quieto.removeEventListener('change', decidir);
    };
  }, []);

  /* Fora da tela o vídeo é puro custo: decodificar quadros que ninguém vê
     gasta CPU e bateria. Pausa ao sair, retoma ao voltar. */
  useEffect(() => {
    if (!liberado) return;
    const el = video.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting),
      { threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [liberado]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (visivel) {
      /* `play()` devolve uma promise que rejeita se a política de autoplay
         barrar. Sem o catch isso vira "unhandled rejection" no console. */
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [visivel]);

  if (!liberado) return null;

  return (
    <video
      ref={video}
      className={s.video}
      /* Sem `autoPlay`: o play é disparado pelo observer acima, já depois do
         load. Sem `preload` explícito porque o elemento nem existe antes
         disso — quando ele monta, buscar é exatamente a intenção. */
      muted
      loop
      playsInline
      /* Sem atributo `poster`: mesmo com preload="none" o navegador busca a
         imagem de poster com prioridade alta, e ela entraria na disputa pelo
         LCP com o <Image priority> que já está pintado atrás deste vídeo. */
      aria-hidden="true"
      tabIndex={-1}
      /* Aparece por transição para o corte entre poster e primeiro quadro não
         piscar. */
      onCanPlay={(e) => e.currentTarget.classList.add(s.videoPronto)}
    >
      {/* webm primeiro: Chrome e Firefox pegam o arquivo menor e o Safari cai
          no mp4. */}
      {webm ? <source src={webm} type="video/webm" /> : null}
      {mp4 ? <source src={mp4} type="video/mp4" /> : null}
    </video>
  );
}
