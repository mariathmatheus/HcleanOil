'use client';

import { useEffect, useState } from 'react';
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

/* Sem container configurado nada é coletado, e pedir consentimento para nada
   só atrapalha quem está desenvolvendo ou revisando o site. */
const MEDICAO_ATIVA = Boolean(process.env.NEXT_PUBLIC_GTM_ID);

type Escolha = 'todos' | 'essenciais';

/** Atualiza o Consent Mode e registra a escolha para o GTM reagir. */
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
    <div className={s.faixa} role="dialog" aria-label="Preferências de cookies" aria-live="polite">
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
