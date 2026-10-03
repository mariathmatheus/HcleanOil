import type { MetadataRoute } from 'next';
import { contentUpdatedAt, products, site } from '@/data/site';
import { formatos } from '@/data/formatos';

export default function sitemap(): MetadataRoute.Sitemap {
  /* Data da ultima mudanca de CONTEUDO, nao a hora do build — ver
     `contentUpdatedAt` em data/site.ts para o porque. */
  const now = new Date(contentUpdatedAt);

  const staticRoutes = [
    { path: '', priority: 1 },
    { path: '/produtos', priority: 0.9 },
    { path: '/sobre', priority: 0.8 },
    /* A politica de privacidade entra no sitemap porque o Google Ads a procura
       — a revisao de anuncio verifica se o anunciante que coleta dado pessoal
       publica uma —, nao porque se espere trafego de busca nela. Prioridade
       baixa de proposito: e pagina obrigatoria, nao pagina de venda. */
    { path: '/politica-de-privacidade', priority: 0.3 },
  ].map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: r.priority,
  }));

  const productRoutes = products.map((p) => ({
    url: `${site.url}/produtos/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  /* Páginas por formato: reúnem o mesmo item nas três linhas, para quem
     procura "cordão absorvente" e não sabe o que é "linha branca". */
  const formatRoutes = formatos.map((f) => ({
    url: `${site.url}/produtos/formato/${f.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...formatRoutes];
}
