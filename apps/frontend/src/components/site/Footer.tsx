import Link from 'next/link';
import { Container } from '@/components/ui/Layout';
import { ContactLink } from '@/components/analytics/ContactLink';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { QuoteLink } from '@/components/quote/QuoteLink';
import { categories, site } from '@/data/site';
import s from './Footer.module.css';

import NerdResolveBadge from './NerdResolveBadge';
/** Um item de coluna navega (`href`) ou abre o pop-up de orçamento (`quote`). */
type FooterLink = { label: string } & ({ href: string } | { quote: true });

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Soluções',
    links: categories.map((c) => ({ href: `/produtos#${c.slug}`, label: c.name })),
  },
  {
    title: 'Empresa',
    links: [
      { href: '/sobre', label: 'Quem somos' },
      { href: '/sobre#historia', label: 'Nossa história' },
      { href: '/sobre#operacoes', label: 'Operações reais' },
    ],
  },
  {
    title: 'Atendimento',
    links: [
      /* `quote` abre o pop-up de orçamento em vez de navegar. */
      { quote: true, label: 'Solicitar orçamento' },
      { quote: true, label: 'Falar com um especialista' },
      { href: '/produtos', label: 'Ver produtos' },
    ],
  },
];

export function Footer() {
  return (
    <>
      {/* Onda de entrada do rodapé: fundo claro da seção anterior, curva na
          cor do rodapé fechando até a base. */}
      <div className={s.wave} aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,52 C240,110 480,120 720,96 C960,72 1200,18 1440,44 L1440,120 L0,120 Z"
            fill="var(--hc-green-900)"
          />
        </svg>
      </div>
      <footer className={s.footer}>
        <Container>
        <div className={s.grid}>
          <div className={s.brandCol}>
            <Logo height={32} tone="light" />
            <p className={s.blurb}>
              Equipamentos e soluções para resposta a emergências ambientais. Há mais
              de 18 anos apoiando operações de contenção e absorção no Brasil.
            </p>
            <div className={s.contactList}>
              <ContactLink
                canal="email"
                origem="rodape"
                className={s.contactItem}
                href={`mailto:${site.contact.email}`}
              >
                <Icon name="mail" size={16} color="var(--hc-green-300)" />
                {site.contact.email}
              </ContactLink>
              <ContactLink
                canal="telefone"
                origem="rodape"
                className={s.contactItem}
                href={site.contact.phoneHref}
              >
                <Icon name="phone" size={16} color="var(--hc-green-300)" />
                {site.contact.phone}
              </ContactLink>
              <span className={s.contactItem}>
                <Icon name="globe" size={16} color="var(--hc-green-300)" />
                {site.contact.site}
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className={s.col}>
              <span className={s.colTitle}>{col.title}</span>
              {col.links.map((l) =>
                'href' in l ? (
                  <Link key={l.label} href={l.href} className={s.colLink}>
                    {l.label}
                  </Link>
                ) : (
                  <QuoteLink key={l.label} className={s.colLink}>
                    {l.label}
                  </QuoteLink>
                ),
              )}
            </div>
          ))}
        </div>

          <div className={s.bottom}>
            <span>
              © {new Date().getFullYear()} {site.legalName}
            </span>
            <span>{site.contact.hours}</span>
          </div>
        </Container>
        <NerdResolveBadge />
      </footer>
    </>
  );
}
