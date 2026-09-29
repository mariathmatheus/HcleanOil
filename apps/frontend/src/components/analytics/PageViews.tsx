'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { enviarEvento, guardarUtms } from '@/lib/analytics';

/**
 * Registra a troca de página na navegação sem recarga.
 *
 * O container do GTM carrega uma vez e dispara `gtm.js` só na primeira
 * página. Como o App Router navega sem recarregar, toda página seguinte
 * ficava invisível: o visitante que chega do anúncio na home e converte na
 * página de produto aparecia como uma visita só, e a landing page de cada
 * conversão saía errada.
 *
 * O evento é `page_view_spa` e não `page_view` de propósito: o GA4 já dispara
 * o seu próprio `page_view` na carga inicial, e usar o mesmo nome faria a
 * primeira página contar duas vezes. No container, a tag do GA4 escuta este
 * evento além do gatilho padrão.
 */
export function PageViews() {
  const pathname = usePathname();
  /* A primeira renderização coincide com o `gtm.js`, que já conta a página
     de entrada. Sem esta trava, ela entraria duas vezes no relatório. */
  const primeira = useRef(true);

  useEffect(() => {
    /* Antes de qualquer coisa: a UTM da campanha chega na URL do primeiro
       acesso e some na navegação seguinte. Guardar aqui garante que ela
       ainda exista quando a pessoa preencher o formulário. */
    guardarUtms();

    if (primeira.current) {
      primeira.current = false;
      return;
    }

    enviarEvento({
      event: 'page_view_spa',
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
