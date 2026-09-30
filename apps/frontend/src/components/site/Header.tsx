import Link from 'next/link';
import { Container } from '@/components/ui/Layout';
import { QuoteButton } from '@/components/quote/QuoteButton';
import { Logo } from '@/components/ui/Logo';
import { NavLinks } from './NavLinks';
import { MenuMobile } from './MenuMobile';
import s from './Header.module.css';

export function Header() {
  return (
    <header className={s.header}>
      <Container>
        <div className={s.bar}>
          <Link href="/" className={s.brand} aria-label="HCLEAN — página inicial">
            <Logo height={38} tone="dark" />
          </Link>

          <NavLinks />

          <div className={s.actions}>
            <QuoteButton size="md">Solicitar orçamento</QuoteButton>
          </div>

          {/* O CTA do mobile é outro elemento, não o mesmo escondido por CSS:
              em 360px o rótulo inteiro ao lado da marca e do hambúrguer não
              cabe na linha, e o texto curto só faz sentido nessa largura. */}
          <div className={s.acoesMobile}>
            <QuoteButton size="sm" className={s.ctaCompacto}>
              Orçamento
            </QuoteButton>
            <MenuMobile />
          </div>
        </div>
      </Container>
    </header>
  );
}
