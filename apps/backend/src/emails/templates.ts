import {
  wrap,
  p,
  h1,
  eyebrow,
  divider,
  dataTable,
  escapeHtml,
  colors,
} from './layout.js';
import type { ContactPayload, QuoteItem } from '../lib/schema.js';

const { FONT, TEXT, MUTED, GREEN_800, GREEN_300 } = colors;

const SITE = 'hcleanoil.com.br';
const MAIL = 'contato@hcleanoil.com.br';
const PHONE = '(21) 99494-5460';

/** Bloco de assinatura, igual ao da peça de referência. */
function signature(): string {
  return `
  ${p('Atenciosamente,', `margin-bottom:4px;color:${MUTED};`)}
  <p style="margin:0 0 2px;font-family:${FONT};font-size:15px;line-height:1.5;font-weight:bold;color:${GREEN_800};">Equipe Comercial</p>
  <p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;font-weight:bold;color:${GREEN_800};">HCLEAN Equipamentos Ambientais Ltda</p>
  <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.9;color:${TEXT};">
    <a href="mailto:${MAIL}" style="color:${TEXT};text-decoration:none;">&#9993;&nbsp; ${MAIL}</a>
    &nbsp;|&nbsp;
    <a href="https://${SITE}" style="color:${TEXT};text-decoration:none;">&#127760;&nbsp; ${SITE}</a>
    <br />
    <a href="tel:+5521994945460" style="color:${TEXT};text-decoration:none;">&#128222;&nbsp; ${PHONE}</a>
  </p>`;
}

/* ------------------------------------------------------------------------ */
/* 1. Notificação interna — o lead que chega para a equipe comercial.        */
/* ------------------------------------------------------------------------ */

export function leadNotification(
  data: ContactPayload & { receivedAt: string; items?: QuoteItem[] },
) {
  const rows = [
    { label: 'Nome', value: escapeHtml(data.nome) },
    { label: 'Empresa', value: escapeHtml(data.empresa) },
    {
      label: 'E-mail',
      value: `<a href="mailto:${escapeHtml(data.email)}" style="color:${GREEN_800};">${escapeHtml(data.email)}</a>`,
    },
  ];

  if (data.telefone) {
    rows.push({
      label: 'Telefone',
      value: `<a href="tel:${escapeHtml(data.telefone.replace(/\D/g, ''))}" style="color:${GREEN_800};">${escapeHtml(data.telefone)}</a>`,
    });
  }
  /* O estado define o frete (CIF no Sudeste a partir de R$ 1.000, FOB no
     resto) e aparece na proposta, mas faltava no e-mail — a equipe recebia o
     lead sem saber para onde entregar. */
  if (data.estado) {
    rows.push({ label: 'Estado de entrega', value: escapeHtml(data.estado) });
  }
  if (data.produto) {
    rows.push({ label: 'Produto de interesse', value: escapeHtml(data.produto) });
  }

  /* Quantidades entram como linhas da mesma tabela, logo abaixo do produto:
     metragem, unidades por formato, capacidades de kit, dimensões do tanque. */
  for (const item of data.items ?? []) {
    rows.push({ label: item.label, value: escapeHtml(item.value) });
  }

  /* De onde veio o lead. Os parâmetros de campanha já chegavam ao servidor e
     seguiam para a medição, mas não apareciam em e-mail nenhum: quem abria a
     solicitação não sabia se era busca paga, orgânico ou indicação, e não dava
     para priorizar nem para reconciliar uma venda fechada com o anúncio que a
     trouxe. Só entra quando há o que mostrar, para não poluir o lead direto. */
  const origem = [
    data.utm_source && `origem ${data.utm_source}`,
    data.utm_medium && `mídia ${data.utm_medium}`,
    data.utm_campaign && `campanha ${data.utm_campaign}`,
    data.utm_term && `termo ${data.utm_term}`,
    data.utm_content && `anúncio ${data.utm_content}`,
  ]
    .filter(Boolean)
    .join(' · ');

  if (origem) {
    rows.push({ label: 'Campanha', value: escapeHtml(origem) });
  }
  /* O clique pago vale destacar à parte: é o que permite casar a venda com o
     anúncio no relatório do Ads. */
  const clique = data.gclid || data.gbraid || data.wbraid || data.msclkid || data.fbclid;
  if (clique) {
    rows.push({ label: 'Identificador do clique', value: escapeHtml(clique) });
  }
  if (data.pagina_origem) {
    rows.push({ label: 'Página de origem', value: escapeHtml(data.pagina_origem) });
  }

  rows.push({ label: 'Recebido em', value: escapeHtml(data.receivedAt) });

  const mensagem = data.mensagem?.trim()
    ? `${divider()}
       ${eyebrow('Observações')}
       <div style="padding:16px 18px;background-color:#F7F9F8;border-left:3px solid ${GREEN_300};font-family:${FONT};font-size:14px;line-height:1.65;color:${TEXT};white-space:pre-wrap;">${escapeHtml(data.mensagem.trim())}</div>`
    : '';


  const body = `
    ${eyebrow('Nova solicitação pelo site')}
    ${h1('Solicitação de atendimento')}
    ${p(`Uma nova solicitação foi enviada pelo formulário de contato do site.`, `color:${MUTED};margin-bottom:22px;`)}
    ${dataTable(rows)}
    ${mensagem}
    ${divider()}
    ${p(
      `Responda diretamente a este e-mail para falar com <strong>${escapeHtml(data.nome)}</strong>.`,
      `font-size:14px;color:${MUTED};margin-bottom:0;`,
    )}
  `;

  return {
    subject: `Nova solicitação — ${data.empresa} (${data.nome})`,
    html: wrap(body, `${data.nome} · ${data.empresa}${data.produto ? ` · ${data.produto}` : ''}`),
    text: [
      'NOVA SOLICITAÇÃO DE ATENDIMENTO',
      '',
      `Nome: ${data.nome}`,
      `Empresa: ${data.empresa}`,
      `E-mail: ${data.email}`,
      data.telefone ? `Telefone: ${data.telefone}` : null,
      data.estado ? `Estado de entrega: ${data.estado}` : null,
      data.produto ? `Produto de interesse: ${data.produto}` : null,
      ...(data.items ?? []).map((i) => `${i.label}: ${i.value}`),
      origem ? `Campanha: ${origem}` : null,
      clique ? `Identificador do clique: ${clique}` : null,
      data.pagina_origem ? `Página de origem: ${data.pagina_origem}` : null,
      `Recebido em: ${data.receivedAt}`,
      '',
      data.mensagem?.trim() ? `Observações:\n${data.mensagem.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/* ------------------------------------------------------------------------ */
/* 2. Confirmação para quem preencheu o formulário.                          */
/* ------------------------------------------------------------------------ */

export function leadConfirmation(data: ContactPayload) {
  const body = `
    ${p(`Prezado(a) <strong>${escapeHtml(data.nome)}</strong>,`)}
    ${p(
      `Recebemos sua solicitação e agradecemos o contato com a <strong>HCLEAN</strong>, empresa referência nacional em <strong>equipamentos e soluções para resposta a emergências ambientais</strong>.`,
    )}
    ${p(
      `Com mais de 18 anos de atuação, a HCLEAN fornece equipamentos utilizados em operações reais de contenção de derramamentos no Brasil, sendo também parceira técnica da Hidroclean, uma das pioneiras no país no setor de proteção ambiental.`,
    )}
    ${p(`Nossa equipe comercial entrará em contato para orientar você sobre:`)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 14px;">
      ${['Produtos adequados à sua operação', 'Aplicações e formas de uso', 'Condições e modalidades de fornecimento']
        .map(
          (item) => `
      <tr>
        <td style="padding:3px 8px 3px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${GREEN_300};vertical-align:top;">&bull;</td>
        <td style="padding:3px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};">${item}</td>
      </tr>`,
        )
        .join('')}
    </table>
    ${p(`Permanecemos à disposição para esclarecimentos técnicos ou comerciais.`)}
    ${divider()}
    ${signature()}
  `;

  return {
    subject: 'Recebemos sua solicitação — HCLEAN',
    html: wrap(body, 'Recebemos sua solicitação. Nossa equipe entrará em contato.'),
    text: [
      `Prezado(a) ${data.nome},`,
      '',
      'Recebemos sua solicitação e agradecemos o contato com a HCLEAN, empresa referência nacional em equipamentos e soluções para resposta a emergências ambientais.',
      '',
      'Com mais de 18 anos de atuação, a HCLEAN fornece equipamentos utilizados em operações reais de contenção de derramamentos no Brasil, sendo também parceira técnica da Hidroclean.',
      '',
      'Nossa equipe comercial entrará em contato para orientar você sobre:',
      '- Produtos adequados à sua operação',
      '- Aplicações e formas de uso',
      '- Condições e modalidades de fornecimento',
      '',
      'Atenciosamente,',
      'Equipe Comercial',
      'HCLEAN Equipamentos Ambientais Ltda',
      `${MAIL} | ${SITE}`,
      PHONE,
    ].join('\n'),
  };
}
