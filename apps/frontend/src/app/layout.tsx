import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { QuoteProvider } from '@/components/quote/QuoteProvider';
import { Gtm, GtmNoScript } from '@/components/analytics/Gtm';
import { Consent } from '@/components/analytics/Consent';
import { PageViews } from '@/components/analytics/PageViews';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { site } from '@/data/site';
import '@/styles/globals.css';

/**
 * Exo 2 auto-hospedada a partir do arquivo variável em src/fonts.
 *
 * Um único arquivo cobre os pesos 100–900, e servir do próprio domínio evita a
 * conexão extra ao Google Fonts no caminho crítico.
 *
 * Em WOFF2, não TTF: a compressão específica para fontes corta 65% do peso
 * (296 kB → 103 kB). Gerar com `node scripts/fonts-to-woff2.mjs`.
 *
 * E subsetada para latin + latin-ext: 103 kB → 32 kB. O arquivo completo
 * trazia cirílico e grego, que o site não usa, e uma tabela GPOS de 109 kB de
 * pares de kerning — maior que os próprios contornos das letras. Ela ocupava
 * a conexão justamente na janela em que a imagem do hero precisa pintar, que
 * é o LCP da home. O eixo variável de peso (100–900) continua inteiro.
 *
 * A itálica não entra: o site não usa itálico em lugar nenhum, e carregá-la
 * custava outros 107 kB no caminho crítico. Se algum texto precisar, é só
 * acrescentar a entrada com `style: 'italic'`.
 */
const exo2 = localFont({
  src: [
    {
      path: '../fonts/Exo2-subset.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-exo2',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.titleShort}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'barreira de contenção',
    'absorvente de óleo',
    'kit SOPEP',
    'emergência ambiental',
    'contenção de derramamento',
    'resposta a derramamento de óleo',
    'equipamentos ambientais',
  ],
  authors: [{ name: site.legalName }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.titleShort}`,
    description: site.description,
  },
  /* Só o formato do card. Título e descrição ficam de fora de propósito:
     no Next, `openGraph` e `twitter` não se cascateiam entre si, então um
     título declarado aqui venceria em toda subpágina e os cards sairiam com
     o texto da home. Sem eles, quem lê twitter:* (Slack e LinkedIn, entre
     outros) cai no og:title da própria página, que já está correto. */
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
};

/** Dados estruturados da organização — ajuda o Google a montar o knowledge panel. */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  description: site.description,
  email: site.contact.email,
  telephone: '+55-21-99494-5460',
  areaServed: { '@type': 'Country', name: 'Brasil' },
  knowsAbout: [
    'Contenção de derramamentos',
    'Absorção de óleo',
    'Resposta a emergências ambientais',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={exo2.variable}>
      <head>
        <Gtm />
      </head>
      <body>
        <GtmNoScript />
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {/* O pop-up de orçamento vive aqui, de modo que qualquer CTA da página
            abra o mesmo formulário, já com o produto pré-selecionado. */}
        <QuoteProvider>
          <Header />
          <main id="conteudo">{children}</main>
          <Footer />
        </QuoteProvider>
        <WhatsAppButton />
        <PageViews />
        <Consent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
