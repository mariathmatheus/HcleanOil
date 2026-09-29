import Script from 'next/script';
import { GTM_ID, GTM_HOST } from '@/lib/ads';

/**
 * Container do Google Tag Manager, servido pelo Stape.
 *
 * O site não fala com GA4 nem com o Ads diretamente: empurra eventos no
 * dataLayer e o container distribui. Acrescentar uma ferramenta vira
 * configuração de painel, sem deploy.
 *
 * O container carrega de `api.hcleanoil.com.br`, um subdomínio do próprio
 * site: os cookies passam a ser de primeira parte e o script escapa dos
 * bloqueadores que barram `googletagmanager.com` pelo nome — que é a
 * principal perda de medição em tráfego pago.
 */
export function Gtm() {
  return (
    <>
      {/*
        Consent Mode v2 antes do container.
        A ordem importa: se o GTM subisse primeiro, as tags disparariam uma
        vez em modo irrestrito antes de saber a escolha do visitante, e é o
        consentimento que sustenta a base legal sob a LGPD.
      */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('set', 'url_passthrough', true);
        `}
      </Script>

      {/* `afterInteractive`: o container não pertence ao caminho crítico e
          carregá-lo antes atrasaria o LCP, que é o que sustenta o SEO. */}
      <Script id="gtm-loader" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
          j.src='${GTM_HOST}/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
    </>
  );
}

/**
 * Alternativa sem JavaScript.
 *
 * Vale pouco aqui — os eventos do funil dependem de JS — mas registra a
 * visita de quem navega com script desligado, e é o que o Google documenta.
 */
export function GtmNoScript() {
  return (
    <noscript>
      <iframe
        src={`${GTM_HOST}/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
