'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { nav } from '@/data/site';
import s from './Header.module.css';

/**
 * A gaveta do menu do mobile: véu, painel, links e o CTA largo.
 *
 * Vive separada do `MenuMobile` porque é tudo o que só existe DEPOIS do
 * toque no hambúrguer. Carregada por `next/dynamic`, este arquivo sai do
 * bundle inicial: `usePathname`, o `Link` de cada item, o `QuoteButton` do
 * rodapé da gaveta e os quatro efeitos abaixo (Esc, trava de rolagem, foco,
 * `inert` na faixa de cookies) só chegam quando o menu é aberto pela
 * primeira vez.
 *
 * Quem fica no bundle inicial é só o botão — que é o que precisa estar
 * pintado e clicável na primeira tela.
 */
export function MenuMobilePainel({
  aberto,
  painelId,
  onFechar,
  devolverFoco,
}: {
  aberto: boolean;
  painelId: string;
  onFechar: () => void;
  /** Devolve o foco ao hambúrguer, que mora no componente de cima. */
  devolverFoco: () => void;
}) {
  const pathname = usePathname();
  const painel = useRef<HTMLDivElement>(null);

  /* Navegação no App Router não remonta o layout: sem isto o painel ficaria
     aberto por cima da página nova depois de clicar num link. */
  useEffect(() => {
    onFechar();
  }, [pathname, onFechar]);

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
        onFechar();
        devolverFoco();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar, devolverFoco]);

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
      {/* O véu fecha ao toque fora do painel — gesto que todo mundo já espera
          de uma gaveta. */}
      <div
        className={`${s.veu} ${aberto ? s.veuAberto : ''}`}
        hidden={!aberto}
        onClick={onFechar}
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
                onClick={onFechar}
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
