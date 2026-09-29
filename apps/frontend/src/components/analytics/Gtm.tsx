import Script from 'next/script';

/**
 * Container do Google Tag Manager.
 *
 * O site não fala com GA4, Meta ou Brevo diretamente: empurra eventos no
 * dataLayer e o GTM distribui. Acrescentar uma ferramenta vira configuração de
 * painel.
 *
 * `NEXT_PUBLIC_GTM_HOST` aponta o carregamento para um domínio próprio
 * (Stape ou outro server-side GTM). Serve o mesmo script de um subdomínio do
 * site, o que faz os cookies passarem a ser de primeira parte e escapa dos
 * bloqueadores que barram `googletagmanager.com` pelo nome. Vazio usa o
 * domínio do Google.
 *
 * Sem `NEXT_PUBLIC_GTM_ID` nada é carregado e o site funciona igual.
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GTM_HOST = process.env.NEXT_PUBLIC_GTM_HOST || 'https://www.googletagmanager.com';

export function Gtm() {
  if (!GTM_ID) return null;

  return (
    <>
      {/*
        Consent Mode v2 antes do container.
        A ordem importa: se o GTM subir primeiro, as tags disparam uma vez em
        modo irrestrito antes de saber a escolha do visitante. O padrão negado
        aqui é o que sustenta a base legal.
      */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
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

      {/*
        `afterInteractive`: o container não pertence ao caminho crítico e
        carregá-lo antes atrasaria o LCP, que é o que sustenta o SEO do site.
      */}
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
 * Vale pouco hoje — os eventos do funil todos dependem de JS — mas registra a
 * visita de quem navega com script desligado, e é o que o Google documenta.
 */
export function GtmNoScript() {
  if (!GTM_ID) return null;

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
