'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Icon } from '@/components/ui/Icon';
import { nav } from '@/data/site';
import s from './Header.module.css';

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
 */
export function MenuMobile() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const painelId = `menu-mobile-${useId().replace(/:/g, '')}`;
  const disparador = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  /* Navegação no App Router não remonta o layout: sem isto o painel ficaria
     aberto por cima da página nova depois de clicar num link. */
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

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

  /* Trava a rolagem de trás enquanto o painel cobre a tela — mesmo tratamento
     que o pop-up de orçamento faz.

     A limpeza devolve o valor vazio em vez do que havia antes: se por algum
     caminho este efeito rodasse com a trava já aplicada, guardar e recolocar
     o "hidden" deixaria a página presa para sempre. Nada mais no site escreve
     nesse estilo em cima do cabeçalho, então limpar é sempre o certo. */
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  /* Esc fecha. O foco volta para o hambúrguer: quem abriu pelo teclado
     precisa reencontrar o ponto de onde saiu. */
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        disparador.current?.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  /* Ao abrir, o foco entra no painel para que o próximo Tab caia nos links, e
     não no resto da página que ficou atrás do véu. */
  useEffect(() => {
    if (aberto) painel.current?.focus();
  }, [aberto]);

  /* A faixa de cookies fica embaixo do véu, mas continuaria no leitor de tela
     — e ela também se anuncia como diálogo, então seriam dois diálogos
     abertos ao mesmo tempo. `inert` a tira da árvore de acessibilidade e do
     Tab enquanto o menu estiver aberto.

     Alcançada pelo papel e pelo rótulo, não pela classe: o seletor semântico
     não depende do hash do CSS Module de outro componente. */
  useEffect(() => {
    if (!aberto) return;
    const faixa = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-label="Preferências de cookies"]',
    );
    if (!faixa) return;
    faixa.inert = true;
    return () => {
      faixa.inert = false;
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={disparador}
        type="button"
        className={s.disparador}
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-label={aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        onClick={() => setAberto((v) => !v)}
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

      {/* O véu fecha ao toque fora do painel — gesto que todo mundo já espera
          de uma gaveta. */}
      <div
        className={`${s.veu} ${aberto ? s.veuAberto : ''}`}
        hidden={!aberto}
        onClick={() => setAberto(false)}
      />

      <div
        ref={painel}
        id={painelId}
        className={`${s.painel} ${aberto ? s.painelAberto : ''}`}
        hidden={!aberto}
        tabIndex={-1}
        aria-label="Navegação principal"
      >
        <nav className={s.painelNav}>
          {nav.map((item) => {
            const ativo =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${s.painelLink} ${ativo ? s.painelLinkAtivo : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => setAberto(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* O CTA se repete aqui com o rótulo inteiro: na barra ele aparece
            abreviado por falta de largura, e quem abriu o menu tem espaço
            para ler o convite completo. */}
        <QuoteButton size="lg" fullWidth>
          Solicitar orçamento
        </QuoteButton>
      </div>
    </>
  );
}
