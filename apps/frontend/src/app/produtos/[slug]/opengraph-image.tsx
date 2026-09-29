import { ImageResponse } from 'next/og';
import { products, findProduct, findCategory, site } from '@/data/site';

/**
 * Imagem de compartilhamento por produto.
 *
 * As fotos do catálogo são quadradas (1920x1920) e o WhatsApp corta para
 * 1.91:1 — a da Linha Branca virava um retângulo branco sem produto, sem
 * marca e sem texto. Aqui a imagem já nasce na proporção final, com o nome
 * do produto legível em miniatura.
 *
 * Estas são as páginas de conversão do site: o link que o vendedor cola na
 * conversa precisa dizer o que é.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = findProduct(slug);
  const nome = product?.name ?? site.name;
  const lead = product?.lead ?? site.titleShort;
  const categoria = product ? findCategory(product.category)?.name : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: '#092B1B',
          backgroundImage:
            'radial-gradient(circle at 88% 12%, rgba(0,191,99,.28), transparent 55%),' +
            'radial-gradient(circle at 6% 96%, rgba(43,131,191,.26), transparent 55%)',
          color: '#F7F7F7',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="52" height="52" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="87" fill="none" stroke="#F7F7F7" strokeWidth="9" />
            <clipPath id="c">
              <circle cx="100" cy="100" r="82" />
            </clipPath>
            <g clipPath="url(#c)">
              <path
                d="M10 126 C46 92, 86 92, 122 116 C148 133, 170 136, 192 122 L192 200 L10 200 Z"
                fill="#3E93C4"
              />
              <path
                d="M10 152 C46 120, 86 120, 122 144 C148 161, 170 164, 192 150 L192 200 L10 200 Z"
                fill="#3FB980"
              />
            </g>
          </svg>
          <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: 4 }}>HCLEAN</span>
        </div>

        {/* Os nomes de linha são longos ("Linha Branca — Absorventes para
            hidrocarbonetos"); 60px mantém três palavras por linha sem
            estourar a caixa. */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            marginTop: 40,
            maxWidth: 1000,
          }}
        >
          {nome}
        </div>

        <div
          style={{
            fontSize: 27,
            lineHeight: 1.4,
            marginTop: 22,
            maxWidth: 880,
            color: 'rgba(247,247,247,.82)',
          }}
        >
          {lead}
        </div>

        {/* `align-items: flex-start` impede que a pílula estique na largura
            toda — num container flex em coluna, o filho estica por padrão. */}
        {categoria ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 40 }}>
            <div
              style={{
                display: 'flex',
                padding: '12px 26px',
                borderRadius: 999,
                background: 'rgba(0,191,99,.16)',
                border: '1px solid rgba(79,214,143,.5)',
                color: '#4FD68F',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {categoria}
            </div>
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
