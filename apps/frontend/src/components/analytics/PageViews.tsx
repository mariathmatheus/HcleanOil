'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  enderecoComCampanha,
  enviarEvento,
  guardarUtms,
  identificadoresDeCampanha,
} from '@/lib/analytics';

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

    /* A UTM volta para a BARRA DE ENDEREÇO, e não só para dentro do evento.
       Esta ordem importa: reescrever a URL antes de empurrar o evento.

       A tentativa anterior mandava os parâmetros como campos do
       `page_view_spa` e um `page_location` corrigido. Não bastou, e foi
       medido: a tag do GA4 monta o endereço que reporta a partir de
       `window.location.href` e ignora o que mandamos. Com a barra limpa, a
       segunda página em diante contava como tráfego direto.

       Reescrevendo a URL de verdade, o endereço passa a estar certo para
       todo mundo que o lê — o container, uma tag futura, o visitante que
       copia o link e o relatório de página de entrada por conversão. Deixa
       de depender de alguém configurar a leitura do campo certo.

       `replaceState` e não `pushState`: trocar a URL não é um passo novo de
       navegação, e empilhar entradas faria o botão "voltar" percorrer a mesma
       página várias vezes. */
    const comCampanha = enderecoComCampanha();
    if (comCampanha && comCampanha !== window.location.href) {
      window.history.replaceState(window.history.state, '', comCampanha);
    }

    /* Os campos soltos continuam: uma tag do container pode ler de lá, e é o
       que viaja junto do lead para a atribuição server-side. */
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
