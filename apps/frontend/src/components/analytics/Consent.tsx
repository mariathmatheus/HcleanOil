'use client';

import { useEffect, useRef, useState } from 'react';
import s from './Consent.module.css';

/**
 * Consentimento de cookies, no Consent Mode v2 do Google.
 *
 * A LGPD exige base legal antes de coletar dado pessoal para publicidade, e o
 * Consent Mode v2 é o que o Google passou a exigir para remarketing. O padrão
 * aqui é `denied`: sem escolha do visitante, as tags carregam em modo restrito,
 * sem cookie e sem identificador.
 *
 * `analytics_storage` também começa negado. É mais conservador do que muitos
 * sites fazem, mas medição de audiência sem cookie continua funcionando por
 * modelagem, e é a leitura defensável da lei.
 */

const CHAVE = 'hclean-consent';

/* A medição é declarada em código (lib/ads.ts), então o banner sempre vale:
   sem consentimento as tags ficam em modo restrito, sem cookie. */
const MEDICAO_ATIVA = true;

type Escolha = 'todos' | 'essenciais';

/** Atualiza o Consent Mode. */
function aplicar(escolha: Escolha) {
  const concedido = escolha === 'todos' ? 'granted' : 'denied';

  window.dataLayer = window.dataLayer ?? [];
  // `arguments` é o formato que o gtag espera; um array simples não funciona.
  // eslint-disable-next-line prefer-rest-params
  function gtag(..._args: unknown[]) {
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  }

  gtag('consent', 'update', {
    ad_storage: concedido,
    ad_user_data: concedido,
    ad_personalization: concedido,
    analytics_storage: concedido,
  });

  window.dataLayer.push({ event: 'consent_update', consent_choice: escolha });
}

export function Consent() {
  const [visivel, setVisivel] = useState(false);
  const faixaRef = useRef<HTMLDivElement>(null);

  /* Publica a altura da faixa numa variável global para o botão do WhatsApp
     subir acima dela. Os dois são `fixed` no mesmo canto inferior, e no
     telefone a faixa empilha em coluna e cobre o botão por inteiro — um toque
     mirando o WhatsApp acabava caindo em "Só os essenciais". Medir em vez de
     fixar um valor porque a altura muda com a largura da tela e com o corpo
     do texto (medido: 101px quando o texto quebra em três linhas, 79px em
     duas), então nenhum número fixo serve.

     A ALTURA VEM DO ResizeObserver, NÃO DE `offsetHeight`. Antes este efeito
     fazia `faixa.offsetHeight` e em seguida escrevia a variável no `<html>`:
     ler geometria depois de invalidar estilo obriga o navegador a refazer
     estilo e layout na hora, sincronamente, no meio do JS. Era o único
     reflow forçado do carregamento inteiro, e o PageSpeed o reportava sem
     atribuição por estar dentro do chunk minificado.

     `ResizeObserver` resolve porque a entrada JÁ TRAZ a medida: o navegador
     a calcula durante o seu próprio layout e a entrega pronta em
     `borderBoxSize`. Ler dali não custa layout nenhum — a caixa não precisa
     ser consultada, ela chega no argumento. E o observer dispara uma vez na
     observação inicial, de modo que a primeira medida vem do mesmo caminho,
     sem precisar de uma chamada manual antes.

     A escrita ainda vai para o próximo quadro. O callback do observer roda
     depois do layout mas antes da pintura; escrever a variável ali dentro
     invalida o estilo que o navegador acabou de resolver e o obriga a
     resolver de novo antes de pintar. No quadro seguinte a escrita entra no
     ciclo normal, e o atraso é invisível: a faixa sobe por animação de 220ms
     e o botão acompanha por transição em `bottom`.

     `--consent-h` saiu daqui: nenhuma folha de estilo do site a consumia
     (conferido por busca em todo o `src`) — só `--consent-lift` é lida, por
     WhatsAppButton.module.css. Publicar as duas era escrever duas
     propriedades no `<html>` para usar uma. */
  useEffect(() => {
    const faixa = faixaRef.current;
    const raiz = document.documentElement;
    if (!visivel || !faixa) {
      raiz.style.removeProperty('--consent-lift');
      return;
    }

    let quadro = 0;

    const observador = new ResizeObserver((entradas) => {
      const entrada = entradas[entradas.length - 1];
      if (!entrada) return;

      /* `borderBoxSize` é o equivalente do que `offsetHeight` devolvia (borda
         inclusa). Navegador antigo que não a preencha cai em `contentRect`,
         que ignora padding e borda — daí a soma explícita dos 16+16 de
         padding e 1+1 da borda que o CSS da faixa declara. */
      const caixa = entrada.borderBoxSize?.[0];
      const bruta = caixa ? caixa.blockSize : entrada.contentRect.height + 34;
      /* `borderBoxSize` vem fracionário (213.17px onde `offsetHeight` dava
         213), e o valor entra num `calc()` de `bottom`. Arredondar para cima
         mantém a variável legível e garante que a folga nunca fique menor do
         que a faixa realmente ocupa. */
      const altura = Math.ceil(bruta);

      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        /* Já com a folga somada: quem consome usa `var(--consent-lift, 0px)`
           direto no calc, e sem a faixa o valor some por inteiro em vez de
           deixar uma folga órfã empurrando o botão sem motivo. */
        raiz.style.setProperty('--consent-lift', `${altura + 12}px`);
      });
    });

    observador.observe(faixa);
    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      raiz.style.removeProperty('--consent-lift');
    };
  }, [visivel]);

  useEffect(() => {
    if (!MEDICAO_ATIVA) return;

    /* A leitura fica no efeito, não na renderização: localStorage não existe
       no servidor, e ler durante o render quebraria a hidratação. */
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem(CHAVE);
    } catch {
      /* Navegador com armazenamento bloqueado: mostra o banner e não insiste. */
    }

    if (salvo === 'todos' || salvo === 'essenciais') {
      aplicar(salvo);
      return;
    }
    setVisivel(true);
  }, []);

  function escolher(escolha: Escolha) {
    try {
      localStorage.setItem(CHAVE, escolha);
    } catch {
      /* Sem armazenamento a escolha vale só para esta visita. */
    }
    aplicar(escolha);
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div id="consent-faixa" ref={faixaRef} className={s.faixa} role="dialog" aria-label="Preferências de cookies" aria-live="polite">
      <p className={s.texto}>
        Usamos cookies para entender como o site é usado e para mostrar nossos
        produtos a quem já demonstrou interesse. Você escolhe.
      </p>
      <div className={s.acoes}>
        <button type="button" className={s.secundario} onClick={() => escolher('essenciais')}>
          Só os essenciais
        </button>
        <button type="button" className={s.primario} onClick={() => escolher('todos')}>
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
