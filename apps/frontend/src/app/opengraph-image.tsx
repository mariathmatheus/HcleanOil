import { ImageResponse } from 'next/og';
import { site, anosDeCasa } from '@/data/site';

/**
 * Imagem de compartilhamento padrão do site.
 *
 * O Next gera em build a partir deste componente, então não há arquivo para
 * manter em sincronia com a marca. Vale para toda rota que não defina a sua —
 * e sem ela o link colado no WhatsApp aparece sem miniatura, num negócio em
 * que o WhatsApp é canal de venda.
 */
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
        {/* Marca: anel com as duas ondas, como no site. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="76" height="76" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="87" fill="none" stroke="#F7F7F7" strokeWidth="8" />
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
          <span style={{ fontSize: 58, fontWeight: 700, letterSpacing: 6 }}>HCLEAN</span>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            marginTop: 44,
            maxWidth: 940,
          }}
        >
          Equipamentos de proteção ambiental
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            color: '#4FD68F',
            maxWidth: 940,
          }}
        >
          com qualidade comprovada
        </div>

        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 48,
            fontSize: 25,
            color: 'rgba(247,247,247,.82)',
          }}
        >
          <span>+{anosDeCasa} anos de fabricação</span>
          <span style={{ color: '#4FD68F' }}>·</span>
          <span>Barreiras · Absorventes · Kits · Tanques</span>
        </div>
      </div>
    ),
    size,
  );
}
