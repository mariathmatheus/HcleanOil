'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';
import s from './Header.module.css';

/* A gaveta sai do bundle inicial.
   Ela é a maior parte deste menu — `usePathname`, um `Link` por item, o
   `QuoteButton` do rodapé e quatro efeitos (Esc, trava de rolagem, foco,
   `inert` na faixa de cookies) — e nada disso é alcançável antes do primeiro
   toque no hambúrguer. Sob demanda, esse peso deixa o caminho crítico.

   `ssr: false` porque o painel nasce fechado: o HTML do servidor traria véu e
   gaveta com `hidden`, ocupando bytes na página para marcação que ninguém vê
   até tocar. O botão, que é o que precisa estar pintado, continua aqui. */
const MenuMobilePainel = dynamic(
  () => import('./MenuMobilePainel').then((m) => m.MenuMobilePainel),
  { ssr: false },
);

/**
 * Largura a partir da qual o menu deixa de existir. Espelha o
 * `@media (max-width: 900px)` de Header.module.css — media query não lê
 * custom property, então o número precisa viver nos dois lugares; mexer num
 * sem mexer no outro deixa o menu preso aberto numa faixa de largura.
 */
const DESKTOP = '(min-width: 901px)';

/**
 * Menu do mobile: hambúrguer na barra e painel com os links.
 *
 * Até aqui os links ficavam sempre visíveis numa terceira linha, e o
 * cabeçalho comia quase 200px da primeira tela antes do hero. Com o painel a
 * barra volta a ser uma linha só.
 *
 * O componente inteiro some acima de 768px (ver `.disparador` no CSS), então
 * o desktop continua servido por `NavLinks` — nada do que está aqui o alcança.
 *
 * Aqui ficou só o botão e o estado de aberto/fechado. Tudo o que a gaveta
 * precisa está em `MenuMobilePainel`, carregado no primeiro toque.
 */
export function MenuMobile() {
  const [aberto, setAberto] = useState(false);
  /* Uma vez aberto, o módulo do painel já está na memória: continuar a
     montá-lo preserva a animação de saída e evita um `import()` por toque. */
  const [montado, setMontado] = useState(false);
  const painelId = `menu-mobile-${useId().replace(/:/g, '')}`;
  const disparador = useRef<HTMLButtonElement>(null);

  const fechar = useCallback(() => setAberto(false), []);
  const devolverFoco = useCallback(() => disparador.current?.focus(), []);

  /* Passando do breakpoint o CSS esconde painel, véu e hambúrguer, mas o
     estado continuaria aberto e a rolagem travada — uma página de desktop
     normal que não rola e não tem mais nada para clicar. Girar o aparelho ou
     redimensionar a janela bastava para cair nisso. */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const aoMudar = () => {
      if (mq.matches) setAberto(false);
    };
    aoMudar(); // cobre o carregamento já acima do breakpoint
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  return (
    <>
      <button
        ref={disparador}
        type="button"
        className={s.disparador}
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-label={aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        onClick={() => {
          setMontado(true);
          setAberto((v) => !v);
        }}
      >
        {aberto ? (
          <Icon name="close" size={22} strokeWidth={2} />
        ) : (
          /* Três traços desenhados aqui: o conjunto de ícones do site não tem
             um hambúrguer, e um ícone usado num lugar só não justifica entrar
             no catálogo compartilhado. */
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {montado ? (
        <MenuMobilePainel
          aberto={aberto}
          painelId={painelId}
          onFechar={fechar}
          devolverFoco={devolverFoco}
        />
      ) : null}
    </>
  );
}
