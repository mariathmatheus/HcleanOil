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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
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
    ];
  },
};

export default nextConfig;
