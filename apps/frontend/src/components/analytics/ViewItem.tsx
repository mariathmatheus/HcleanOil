'use client';

import { useEffect, useRef } from 'react';
import { verProduto, verLista, type AnalyticsItem } from '@/lib/analytics';
import { conversao, remarketing, labelDoProduto, LABEL_ABSORVENTES } from '@/lib/ads';

/**
 * Dispara a visualização de produto ou de lista.
 *
 * As páginas são Server Components estáticos, e o evento precisa do navegador.
 * Este componente não renderiza nada: existe só para o efeito, e é o único
 * JavaScript que a instrumentação acrescenta à página.
 */

/** Visualização de um produto. */
export function ViewItem({ item }: { item: AnalyticsItem }) {
  /* Em desenvolvimento o StrictMode monta duas vezes, e sem a trava o evento
     sairia duplicado. A chave é o id do item: navegar entre produtos precisa
     disparar de novo. */
  const jaEnviado = useRef<string | null>(null);

  useEffect(() => {
    if (jaEnviado.current === item.item_id) return;
    jaEnviado.current = item.item_id;
    verProduto(item);

    /* Alimenta a audiência de remarketing de quem olhou o produto sem
       pedir orçamento. */
    const label = labelDoProduto(item.item_id);
    if (label) conversao(label);

    /* Identifica o produto para o remarketing dinâmico. */
    remarketing([{ id: item.item_id }]);
  }, [item.item_id]);

  return null;
}

/** Visualização de uma lista: vitrine, categoria, página por formato. */
export function ViewItemList({ lista, itens }: { lista: string; itens: AnalyticsItem[] }) {
  const jaEnviado = useRef<string | null>(null);

  useEffect(() => {
    if (jaEnviado.current === lista) return;
    jaEnviado.current = lista;
    verLista(lista, itens);

    /* Página de formato compara as três linhas: entra no rótulo geral de
       absorventes, que é como a campanha foi montada. */
    conversao(LABEL_ABSORVENTES);
    remarketing(itens.map((i) => ({ id: i.item_id })));
  }, [lista]);

  return null;
}
