'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { guardarUtms } from '@/lib/analytics';
import { ADS_ID, GA4_ID } from '@/lib/ads';

/**
 * Registra a troca de página na navegação sem recarga.
 *
 * O container do GTM carrega uma vez e dispara `gtm.js` só na primeira
 * página. Como o App Router navega sem recarregar, toda página seguinte
 * ficava invisível: o visitante que chega do anúncio na home e converte na
 * página de produto aparecia como uma visita só, e a landing page de cada
 * conversão saía errada.
 *
 * O `gtag('config')` conta só a página de entrada. Sem este envio, um
 * visitante que chega pela home e converte na página de produto aparece como
 * uma visita só, e a landing page da conversão sai errada no relatório.
 *
 * Vai para o GA4 e para o Ads: o segundo é o que mantém a audiência de
 * remarketing recebendo as páginas navegadas, não só a de entrada.
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

    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      send_to: [GA4_ID, ADS_ID],
    });
  }, [pathname]);

  return null;
}
