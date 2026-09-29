import Script from 'next/script';
import { ADS_ID, GA4_ID } from '@/lib/ads';

/**
 * Google tag: GA4 e Google Ads.
 *
 * Um único script serve as duas contas — é assim que o gtag funciona quando
 * não há container GTM no meio.
 *
 * O Consent Mode v2 vem antes, com tudo negado: a LGPD exige base legal antes
 * de coletar dado pessoal para publicidade, e o Google passou a exigir os
 * sinais de consentimento para remarketing. Se a tag subisse primeiro, ela
 * dispararia uma vez em modo irrestrito antes de saber a escolha do visitante.
 */
export function Gtag() {
  return (
    <>
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

      {/* `afterInteractive`: a medição não pertence ao caminho crítico, e
          carregá-la antes atrasaria o LCP, que é o que sustenta o SEO. */}
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />

      <Script id="gtag-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA4_ID}');
          gtag('config', '${ADS_ID}');
        `}
      </Script>
    </>
  );
}
