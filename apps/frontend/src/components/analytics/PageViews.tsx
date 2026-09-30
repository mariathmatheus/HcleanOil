'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { enviarEvento, guardarUtms, identificadoresDeCampanha } from '@/lib/analytics';

/**
 * Registra a troca de página na navegação sem recarga.
 *
 * O container do GTM carrega uma vez e dispara `gtm.js` só na primeira
 * página. Como o App Router navega sem recarregar, toda página seguinte
 * ficava invisível: o visitante que chega do anúncio na home e converte na
 * página de produto aparecia como uma visita só, e a landing page de cada
 * conversão saía errada.
 *
 * O nome é `page_view_spa` e não `page_view` de propósito: a tag do GA4 no
 * container já conta a página de entrada pelo gatilho padrão, e repetir o
 * nome faria a primeira contar duas vezes. No painel, a tag escuta este
 * evento além do gatilho de carga.
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

    /* As UTMs vão junto em cada troca de página.

       `window.location.href` já não as tem: elas chegam na URL do primeiro
       acesso e somem na primeira navegação interna, porque o App Router
       troca a rota sem recarregar. Sem reanexá-las aqui, o container via a
       segunda página em diante como tráfego direto, e a conversão que
       acontece lá — que é a maioria — perdia a campanha de origem.

       Vêm de `identificadoresDeCampanha`, que lê o que foi guardado na
       chegada e dá prioridade ao que estiver na URL atual. */
    const campanha = identificadoresDeCampanha();

    enviarEvento({
      event: 'page_view_spa',
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      ...campanha,
    });
  }, [pathname]);

  return null;
}
