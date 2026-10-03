/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /* Empacota o servidor com só as dependências que ele usa de fato. É o que
     permite a imagem Docker rodar sem node_modules e sem o código-fonte. */
  output: 'standalone',

  /* NAO ligar `experimental.inlineCss` aqui — medido e rejeitado.

     A ideia era tirar da corrente as tres folhas que o PageSpeed aponta
     (fontes+app, tokens, modulo da rota, ~150ms de bloqueio). Ligando a
     opcao os tres <link> realmente somem: 3 folhas bloqueantes viram 0.

     So que o HTML da home sai de 22 kB para 53 kB DEPOIS do gzip — mais
     31 kB, ou ~157ms a 1,6 Mbps. Refazendo a conta com esses numeros:

       antes:  111ms (html) + 51ms (css) + 1 ida e volta
       depois: 268ms (html)

     Isso empata por volta de 150ms de RTT e fica NEGATIVO abaixo disso.
     Pior: o custo cai em TODA navegacao, enquanto o CSS externo e cacheado
     e so a primeira visita paga.

     REMEDIDO (2026-09-30), agora com proxy que aplica latencia real ao
     documento tambem — a 1,6 Mbps e 4x de CPU, mediana de 5 execucoes:

       RTT     3 folhas (FCP/LCP)   inline (FCP/LCP)
        40ms      892 / 892           880 / 1068
       150ms     1072 / 1072          940 / 1080
       300ms     1428 / 1428         1100 / 1116

     Confirma o empate em ~150ms. Abaixo disso o inline piora o LCP: o HTML
     maior atrasa a descoberta da imagem do hero, e o "element render delay"
     sobe de 53ms para 82ms porque o parser tem 32 kB de CSS a mais para
     processar antes de pintar.

     E o RTT real desta producao nao chega perto de 150ms: o `connect` para
     a borda da Cloudflare mede 16–27ms. O TTFB de 195–453ms que o PSI
     mostra e tempo de PENSAR do servidor, nao ida e volta — o inline nao
     recupera nada dele, so faz o HTML chegar 32 kB mais gordo depois da
     mesma espera.

     O ponto que faltava na conta antiga: NAO existem "tres idas e voltas
     em serie". Medido contra a producao com Chrome de verdade, a borda
     serve h2 (e anuncia h3), e as tres folhas partem em 76–77ms e terminam
     em 123–124ms — uma conexao multiplexada, as tres em paralelo, 47ms no
     total. Os "1060ms" do PSI sao a SOMA das duracoes por arquivo sob
     simulacao, nao tempo de relogio.

     Pela mesma razao, juntar as tres em uma folha nao paga: economiza 902
     bytes de gzip, e medindo 13 execucoes a 150ms a versao unificada saiu
     68ms MAIS LENTA que as tres separadas (1160 vs 1092) — ou seja, dentro
     do ruido. O Lighthouse concorda: `render-blocking-insight` estima
     economia de 300ms de FCP e ZERO de LCP, e o LCP daqui e a imagem do
     hero, que ja vai com `fetchpriority=high` e descoberta no HTML.

     Se um dia o HTML encolher, as folhas crescerem, ou a borda ficar
     distante do publico (RTT > 150ms), vale remedir. */
  // O site é institucional e quase todo estático: gerar HTML no build deixa o
  // LCP no tempo de resposta do CDN, que é o que o Core Web Vitals mede.
  compress: true,
  images: {
    /* AVIF primeiro, WebP como fallback.

       A versao anterior deixava so WebP, com a justificativa de que o encode
       AVIF seria "uma ordem de grandeza mais lento" e que o LCP mediria o
       encode em vez do download. REMEDIDO neste build (Next 16.3.1), com o
       cache de imagem apagado antes de CADA requisicao, 7 amostras por caso,
       mediana:

         hero-mobile w=750 q=55 (LCP do telefone)
           webp  14552 B  84ms        avif   9635 B  94ms   -33,8% / +11ms
         hero      w=1440 q=68 (LCP do desktop)
           webp  18872 B  89ms        avif  16756 B 103ms   -11,2% / +14ms
         cinza-manta w=750 q=75 (a foto de produto mais pesada)
           webp  21938 B  60ms        avif  12909 B  63ms   -41,2% /  +3ms
         cinza-manta w=384 q=75
           webp   5942 B  30ms        avif   3898 B  36ms   -34,4% /  +6ms

       A premissa estava errada: a penalidade de encode e de +3 a +14ms, nao
       uma ordem de grandeza. E ela e paga UMA VEZ por variante — as paginas
       sao todas prerenderizadas no build, o otimizador roda sob demanda mas
       grava em .next/cache/images com o `minimumCacheTTL` de um ano abaixo, e
       a Cloudflare ainda fica na frente. Servido quente: 2 a 20ms nos dois
       formatos.

       O ganho de bytes, medido no carregamento real a 412px (slow 4G, CPU 4x):
         home           32,8 kB -> 26,5 kB  (-19%)
         pagina de produto 67,0 kB -> 48,6 kB  (-27%)

       Todo navegador do browserslist do projeto (chrome>=111, safari>=16.4,
       firefox>=111, edge>=111) le AVIF, e quem nao le recebe o WebP pelo
       `Accept` — a lista tem os dois justamente por isso.

       A ordem importa: o Next serve o PRIMEIRO formato da lista que o
       `Accept` do cliente aceita. */
    formats: ['image/avif', 'image/webp'],

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

    /* Qualidades aceitas pelo otimizador. Sem declarar, o Next só permite 75
       e ignora em silêncio qualquer `quality` diferente no componente — foi o
       que acontecia com o hero, que pedia 68 e recebia 75.

       O 55 é do recorte retrato do hero no telefone: ele fica sob um scrim de
       85 a 90% de opacidade, e medindo o composto final contra uma referência
       quase sem perda a diferença máxima ficou em 1,9 de 255 — abaixo do
       limiar visível, e menor que a do próprio 68 no arquivo paisagem. */
    qualities: [55, 68, 75],
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

      /* O site anterior, em WordPress, vivia sob `/home/`. É o que o Google
         ainda tem indexado — uma busca por `site:hcleanoil.com.br` devolve só
         esses endereços, nenhum dos atuais. Sem estas regras eles morrem em
         404, inclusive para o robô que revisa anúncio, e o Google reprova o
         destino. Cada um vai para o equivalente mais próximo, e não para a
         home, porque mandar tudo para a raiz desperdiça a intenção de quem
         clicou procurando um produto específico. */
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/comercial', destination: '/', permanent: true },
      { source: '/home/about', destination: '/sobre', permanent: true },
      { source: '/home/products', destination: '/produtos', permanent: true },
      { source: '/home/products/kits', destination: '/produtos/kit-sopep', permanent: true },
      {
        source: '/home/products/containmentbarrier',
        destination: '/produtos/barreira-de-contencao-seafence',
        permanent: true,
      },
      { source: '/home/products/absorbents', destination: '/produtos', permanent: true },
      {
        source: '/home/products/tanks',
        destination: '/produtos/tanque-terrestre-armazenamento',
        permanent: true,
      },
      {
        source: '/home/products/whiteline',
        destination: '/produtos/absorvente-oleo-linha-branca',
        permanent: true,
      },
      {
        source: '/home/products/grayline',
        destination: '/produtos/absorvente-universal-linha-cinza',
        permanent: true,
      },
      {
        source: '/home/products/greenline',
        destination: '/produtos/absorvente-quimico-linha-verde',
        permanent: true,
      },
      /* Rede de segurança: qualquer outro endereço do site antigo que ainda
         circule em anúncio, link ou e-mail cai na home em vez de 404. Vem por
         último, de propósito — as regras acima são mais específicas e vencem. */
      { source: '/home/:path*', destination: '/', permanent: true },

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
