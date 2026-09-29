'use client';

import { useEffect, useRef } from 'react';
import { verProduto, verLista, type AnalyticsItem } from '@/lib/analytics';

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
    /* O evento leva item_id, item_name e item_category. É por eles que o
       container dispara a conversão de visualização e monta a audiência de
       remarketing — as tags vivem no painel, não aqui. */
    verProduto(item);
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
  }, [lista]);

  return null;
}
