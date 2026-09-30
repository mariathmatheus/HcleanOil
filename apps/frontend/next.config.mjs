/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /* Empacota o servidor com só as dependências que ele usa de fato. É o que
     permite a imagem Docker rodar sem node_modules e sem o código-fonte. */
  output: 'standalone',
  // O site é institucional e quase todo estático: gerar HTML no build deixa o
  // LCP no tempo de resposta do CDN, que é o que o Core Web Vitals mede.
  compress: true,
  images: {
    /* Só WebP no caminho crítico.
       AVIF comprime melhor, mas o encode e uma ordem de grandeza mais lento, e
       o hero da home (a unica imagem `fill` a 100vw, origem 1920px) era a mais
       cara de todas: o LCP media o tempo de encode, nao o de download. */
    formats: ['image/webp'],

    /* Um ano. O default sao 4 horas, e a cada expiracao a primeira visita
       pagava o reencode de novo. A URL ja carrega o hash do arquivo, entao
       trocar a imagem invalida o cache sozinho. */
    minimumCacheTTL: 31536000,

    /* Nenhuma imagem do projeto passa de 1920px. Sem esse corte o Next gera
       variantes 2048 e 3840 por upscale — trabalho de CPU para um resultado
       pior que o original. */
    /* O degrau de 1440 existe por causa do poster do hero: sem ele, uma tela
       de 1440px não encontra candidato e sobe para 1920, servindo 48 kB onde
       30 kB bastam — e essa é justamente a imagem do LCP. */
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [256, 384],

    /* Qualidades aceitas pelo otimizador. Sem declarar, o Next so permite 75
       e ignora em silencio qualquer `quality` diferente no componente — foi o
       que acontecia com o hero, que pedia 68 e recebia 75. */
    qualities: [68, 75],
  },
  async redirects() {
    return [
      /* O formulário virou pop-up e a página deixou de existir, mas a URL
         estava indexada e circula em assinaturas de e-mail. Redirect
         permanente para a home preserva esse tráfego. */
      { source: '/contato', destination: '/', permanent: true },

      /* As URLs de produto mudaram para carregar o termo que o comprador
         busca: "absorvente para óleo" tem procura, "Linha Branca" não. O 301
         transfere ao endereço novo a autoridade que as anteriores
         acumularam — elas já estavam no ar e no sitemap. */
      { source: '/produtos/linha-branca', destination: '/produtos/absorvente-oleo-linha-branca', permanent: true },
      { source: '/produtos/linha-cinza', destination: '/produtos/absorvente-universal-linha-cinza', permanent: true },
      { source: '/produtos/linha-verde', destination: '/produtos/absorvente-quimico-linha-verde', permanent: true },
      { source: '/produtos/turfa-organica', destination: '/produtos/turfa-organica-absorvente', permanent: true },
      { source: '/produtos/tanque-terrestre', destination: '/produtos/tanque-terrestre-armazenamento', permanent: true },

      /* www para o domínio canônico. As duas formas servindo o mesmo conteúdo
         dividiriam a autoridade entre dois endereços e o Google trataria como
         duplicado. O 308 preserva o método e passa o sinal de permanente. */
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.hcleanoil.com.br' }],
        destination: 'https://hcleanoil.com.br/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },

      /* Vídeo de fundo do hero: um ano, imutável.
         O que está sob `public/` não passa pelo pipeline do `/_next/static`,
         que põe hash no nome e por isso ganha `immutable` de graça. Aqui o
         nome é fixo, e o default do Next para arquivo estático é um
         `ETag` fraco com revalidação — a cada visita o navegador manda um
         condicional e espera o 304 antes de começar a tocar. Num arquivo de
         alguns MB no caminho do LCP isso é um round-trip a mais por visita.

         ATENÇÃO — cache-busting é manual: `immutable` autoriza o navegador
         (e a Cloudflare) a NUNCA mais perguntar por este endereço. Trocar o
         conteúdo do vídeo exige trocar o NOME do arquivo (background-2.webm,
         ou um sufixo de versão); sobrescrever background.webm no lugar deixa
         quem já visitou com o arquivo velho por até um ano, sem recurso. */
      {
        source: '/video/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },

          /* Sem header de compressão aqui, de propósito.
             Medido neste build (Next 16.3.1, `compress: true`, pedindo
             `gzip, deflate, br, zstd`): a resposta de video/mp4 e video/webm
             volta SEM `Content-Encoding`. O compressor do Next olha o
             content-type e já pula mídia — vídeo é contêiner comprimido,
             gzip/brotli não tirariam nada e só gastariam CPU dos dois lados.
             Não há o que desligar.

             Também não se declara `Content-Encoding: identity`: a RFC 9110
             desaconselha mandar `identity` numa resposta, e num 206 há
             proxy que trata o header como corpo codificado e passa a servir
             faixa de bytes errada — justo o que o Safari precisa intacto
             para começar a tocar. O certo é a ausência do header. */
        ],
      },

      /* Mesmo raciocínio para as imagens de `public/`, mas casando pela
         EXTENSÃO, não pela pasta.
         `headers()` casa o caminho da URL e não sabe se existe arquivo por
         trás: `/produtos/:path*` pegaria também `/produtos/absorvente-oleo-
         linha-branca`, que é PÁGINA (`app/produtos/[slug]`), e um HTML com
         `immutable` congelaria o conteúdo do site por um ano no navegador de
         quem visitou e na borda da Cloudflare. Amarrar na extensão resolve:
         nenhuma rota do app termina em .webp/.png/.svg/.ico.

         Vale a mesma ressalva do vídeo: trocar uma imagem pede nome novo. As
         que passam pelo `next/image` já saem com hash na URL do otimizador e
         não dependem desta regra — ela cobre o acesso direto ao original. */
      {
        source: '/:path*.(webp|png|jpg|jpeg|svg|avif|woff2)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
