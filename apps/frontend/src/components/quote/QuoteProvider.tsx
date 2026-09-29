'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';

/* O pop-up sai do bundle inicial.
   Ele vive no layout, entao era renderizado no HTML de toda pagina — com os
   580 registros de CSS e o JS do formulario — mesmo para quem nunca clica em
   "Solicitar orcamento". Carregado sob demanda, esse peso deixa o caminho
   critico e so chega quando o visitante abre o formulario.

   `ssr: false` porque o conteudo do modal nao aparece na primeira pintura:
   gera-lo no servidor so aumentaria o HTML sem nada visivel em troca. */
const QuoteModal = dynamic(
  () => import('./QuoteModal').then((m) => m.QuoteModal),
  { ssr: false },
);

type QuoteContextValue = {
  /** Abre o formulário, opcionalmente já com um produto selecionado. */
  open: (productSlug?: string) => void;
  close: () => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

/**
 * Disponibiliza o formulário de orçamento para toda a árvore.
 *
 * Fica no layout, de modo que qualquer CTA — cabeçalho, cartão de produto,
 * banner — abra o mesmo pop-up, já com o produto certo pré-selecionado.
 */
export function QuoteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [slug, setSlug] = useState<string | undefined>();

  const open = useCallback((productSlug?: string) => {
    setSlug(productSlug);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <QuoteContext.Provider value={value}>
      {children}
      <QuoteModal open={isOpen} onClose={close} productSlug={slug} />
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote precisa estar dentro de <QuoteProvider>');
  return ctx;
}
