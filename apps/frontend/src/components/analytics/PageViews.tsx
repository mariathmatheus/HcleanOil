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

    /* As UTMs vão junto em cada troca de página, e precisam ir nos DOIS
       lugares.

       No ENDEREÇO porque é de lá que o GA4 tira a atribuição: ele lê origem,
       mídia e campanha do parâmetro `dl`, não de campos soltos no evento.
       Como as UTMs chegam só na URL do primeiro acesso e somem na primeira
       navegação interna — o App Router troca a rota sem recarregar —, da
       segunda página em diante o endereço ia limpo e a visita era contada
       como tráfego direto. Foi o que aconteceu: medido em produção, o `dl`
       da segunda página vinha sem nenhum parâmetro.

       Nos CAMPOS porque uma tag do container pode ler de lá, e porque é o
       que viaja junto do lead para a atribuição server-side.

       Os dois vêm do que foi guardado na chegada, com prioridade para o que
       estiver na URL atual. */
    const campanha = identificadoresDeCampanha();

    enviarEvento({
      event: 'page_view_spa',
      page_path: pathname,
      page_location: enderecoComCampanha(),
      page_title: document.title,
      ...campanha,
    });
  }, [pathname]);

  return null;
}
