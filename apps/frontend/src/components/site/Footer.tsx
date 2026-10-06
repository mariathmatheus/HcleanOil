import Link from 'next/link';
import { Container } from '@/components/ui/Layout';
import { ContactLink } from '@/components/analytics/ContactLink';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { QuoteLink } from '@/components/quote/QuoteLink';
import { site, anosDeCasa } from '@/data/site';
import s from './Footer.module.css';

import NerdResolveBadge from './NerdResolveBadge';
/** Um item de coluna navega (`href`) ou abre o pop-up de orçamento (`quote`). */
type FooterLink = { label: string } & ({ href: string } | { quote: true });

/* Os tres termos que o comprador de fato busca, segundo a midia: "barreira de
   contencao", "absorvente de oleo" e "kit SOPEP". A coluna apontava para
   ancoras de /produtos (`/produtos#kits-de-emergencia`), que nao sao URLs
   proprias: o Kit SOPEP e o Tanque Terrestre recebiam link de 3 e 2 paginas do
   site, contra 14 da Linha Branca. Apontando para a pagina do produto, o link
   do rodape passa a valer nas 18 paginas. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Soluções',
    links: [
      { href: '/produtos/barreira-de-contencao-seafence', label: 'Barreiras de contenção' },
      { href: '/produtos/absorvente-oleo-linha-branca', label: 'Absorventes de óleo' },
      { href: '/produtos/kit-sopep', label: 'Kit SOPEP' },
      { href: '/produtos/tanque-terrestre-armazenamento', label: 'Tanque terrestre' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/sobre', label: 'Quem somos' },
      { href: '/sobre#historia', label: 'Nossa história' },
      { href: '/sobre#operacoes', label: 'Operações reais' },
      /* No rodape, e nao so no aviso de cookies: a revisao do Google Ads
         espera alcancar a politica a partir de QUALQUER pagina do site, e o
         aviso de cookies desaparece depois da primeira escolha. O rodape e o
         unico lugar que aparece nas 18 paginas sem excecao. */
      { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
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
              de {anosDeCasa} anos apoiando operações de contenção e absorção no Brasil.
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
              {/* CNPJ no rodapé de todas as páginas. A política de anúncios do
                  Google espera identificar o anunciante no próprio site, e não
                  só numa página de política — foi um dos pontos da reprovação.
                  Aparece quando o dado existir em `site.legal`; até lá, nada,
                  porque um rótulo "CNPJ:" sem número é pior que a ausência. */}
              {site.legal.cnpj ? ` · CNPJ ${site.legal.cnpj}` : null}
            </span>
            <span>{site.contact.hours}</span>
          </div>
        </Container>
        <NerdResolveBadge />
      </footer>
    </>
  );
}
