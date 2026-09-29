/**
 * E-mails que acompanham a proposta em PDF.
 *
 * Dois destinos, dois textos: o cliente recebe a proposta pronta; a equipe
 * recebe o aviso quando algum item exige cotação manual.
 */
import { wrap, p, h1, eyebrow, divider, dataTable, escapeHtml, colors } from './layout.js';
import { moeda } from '../proposta/precos.js';
import type { PropostaGerada } from '../proposta/gerar.js';
import type { ContactPayload } from '../lib/schema.js';

const { FONT, TEXT, MUTED, GREEN_800, GREEN_300 } = colors;

const SITE = 'hcleanoil.com.br';
const MAIL = 'contato@hcleanoil.com.br';
const PHONE = '(21) 99494-5460';

function assinatura(): string {
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

/** Resumo dos itens, para o corpo do e-mail. */
function resumo(proposta: PropostaGerada) {
  const linhas = proposta.orcamento.linhas.map((l) => ({
    label: escapeHtml(l.descricao),
    value:
      l.total !== undefined
        ? `${l.quantidade} ${l.unidade} · ${moeda(l.total)}`
        : `${l.quantidade} ${l.unidade} · <span style="color:#C4392B;font-weight:bold;">sob cotação</span>`,
  }));

  linhas.push({
    label: 'Frete',
    value: escapeHtml(proposta.orcamento.frete.rotulo),
  });
  linhas.push({
    label: 'Total',
    value: `<span style="font-size:16px;">${moeda(proposta.orcamento.total)}</span>`,
  });

  return dataTable(linhas);
}

/* ------------------------------------------------------------- ao cliente */

export function propostaParaCliente(data: ContactPayload, proposta: PropostaGerada) {
  const body = `
    ${eyebrow(`Proposta ${escapeHtml(proposta.numero)}`)}
    ${h1('Sua proposta está pronta')}
    ${p(`Prezado(a) <strong>${escapeHtml(data.nome)}</strong>,`)}
    ${p(
      'Segue em anexo a proposta comercial referente à sua solicitação. O documento traz os itens, os valores e as condições de fornecimento.',
    )}
    ${resumo(proposta)}
    ${divider()}
    ${p(
      'A proposta tem validade de 30 dias. Qualquer ajuste de quantidade ou dúvida sobre aplicação, é só responder a este e-mail.',
    )}
    ${assinatura()}
  `;

  const texto = [
    `Prezado(a) ${data.nome},`,
    '',
    `Segue em anexo a proposta ${proposta.numero}, referente à sua solicitação.`,
    '',
    ...proposta.orcamento.linhas.map(
      (l) =>
        `- ${l.descricao}: ${l.quantidade} ${l.unidade} — ${
          l.total !== undefined ? moeda(l.total) : 'sob cotação'
        }`,
    ),
    '',
    `Frete: ${proposta.orcamento.frete.rotulo}`,
    `Total: ${moeda(proposta.orcamento.total)}`,
    '',
    'Validade de 30 dias. Qualquer dúvida, é só responder a este e-mail.',
    '',
    'Equipe Comercial',
    'HCLEAN Equipamentos Ambientais Ltda',
    `${MAIL} | ${SITE} | ${PHONE}`,
  ].join('\n');

  return {
    subject: `Proposta ${proposta.numero} — HCLEAN`,
    html: wrap(body, `Proposta ${proposta.numero} · ${moeda(proposta.orcamento.total)}`),
    text: texto,
  };
}

/* --------------------------------------------------------------- à equipe */

export function propostaParaEquipe(data: ContactPayload, proposta: PropostaGerada) {
  const semPreco = proposta.orcamento.linhas.filter((l) => l.total === undefined);

  const body = `
    <div style="background:#FBEEEC;border:1px solid #E0A9A0;border-left:4px solid #C4392B;padding:14px 16px;margin-bottom:22px;">
      <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.5;font-weight:bold;color:#A32B1F;">
        Esta cotação exige personalização
      </p>
      <p style="margin:6px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#A32B1F;">
        ${semPreco.length} ${semPreco.length === 1 ? 'item não tem' : 'itens não têm'}
        preço de tabela. A proposta <strong>não foi enviada ao cliente</strong> —
        complete os valores e encaminhe manualmente.
      </p>
    </div>

    ${eyebrow(`Proposta ${escapeHtml(proposta.numero)} · rascunho`)}
    ${h1('Proposta aguardando cotação')}
    ${p(`Solicitação de <strong>${escapeHtml(data.empresa)}</strong> (${escapeHtml(data.nome)}).`, `color:${MUTED};margin-bottom:20px;`)}
    ${resumo(proposta)}
    ${divider()}
    ${p(
      `Itens a precificar: <strong>${semPreco.map((l) => escapeHtml(l.descricao)).join(', ')}</strong>.`,
      `font-size:14px;`,
    )}
    ${p(
      `Responda para <a href="mailto:${escapeHtml(data.email)}" style="color:${GREEN_800};">${escapeHtml(data.email)}</a>.`,
      `font-size:14px;color:${MUTED};margin-bottom:0;`,
    )}
  `;

  const texto = [
    'ESTA COTAÇÃO EXIGE PERSONALIZAÇÃO',
    '',
    `Proposta ${proposta.numero} (rascunho) — NÃO enviada ao cliente.`,
    `Cliente: ${data.empresa} (${data.nome}) — ${data.email}`,
    '',
    'Itens:',
    ...proposta.orcamento.linhas.map(
      (l) =>
        `- ${l.descricao}: ${l.quantidade} ${l.unidade} — ${
          l.total !== undefined ? moeda(l.total) : 'SOB COTAÇÃO'
        }`,
    ),
    '',
    `Parcial: ${moeda(proposta.orcamento.total)} · ${proposta.orcamento.frete.rotulo}`,
  ].join('\n');

  return {
    subject: `Cotação manual — Proposta ${proposta.numero} — ${data.empresa}`,
    html: wrap(body, `Proposta ${proposta.numero} precisa de cotação manual`),
    text: texto,
  };
}
