/**
 * Casca visual dos e-mails HCLEAN.
 *
 * Construída em tabelas com estilo inline de propósito: Outlook e Gmail
 * descartam <style> em <head> e não suportam flex/grid. O layout segue a peça
 * de referência — faixa verde-escura com a marca, corpo branco, rodapé verde.
 */

const GREEN_900 = '#061A11';
const GREEN_800 = '#092B1B';
const GREEN_300 = '#00BF63';
const PAPER = '#F7F7F7';
const TEXT = '#2A342F';
const MUTED = '#66736D';
const BORDER = '#DCE0DE';

/* Arial em vez de Archivo: webfont em e-mail é ignorado pela maioria dos
   clientes, então a pilha usa o que já existe na máquina do destinatário. */
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

export const colors = { GREEN_900, GREEN_800, GREEN_300, PAPER, TEXT, MUTED, BORDER, FONT };

/**
 * Cabeçalho: marca centralizada sobre o verde institucional, com o arco verde
 * no canto — desenhado em SVG embutido como data URI, porque SVG inline é
 * bloqueado por vários clientes e PNG externo exigiria hospedagem.
 */
function header(): string {
  return `
  <tr>
    <td style="padding:0;background-color:${GREEN_800};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:38px 24px;background-color:${GREEN_800};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;padding-right:14px;">
                  <!-- O texto alternativo existe de propósito: no Outlook
                       corporativo, caixa de boa parte do público B2B, a
                       imagem vem bloqueada por padrão, e sem ele o topo do
                       e-mail ficava um buraco sem rótulo nenhum. -->
                  <img src="cid:hclean-mark" width="46" height="46" alt="HCLEAN"
                       style="display:block;border:0;outline:none;text-decoration:none;width:46px;height:46px;" />
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:${FONT};font-size:31px;line-height:1;font-weight:bold;color:${PAPER};letter-spacing:0.5px;">HCLEAN</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="height:4px;line-height:4px;font-size:0;background-color:${GREEN_300};">&nbsp;</td>
  </tr>`;
}

function footer(): string {
  return `
  <tr>
    <td align="center" style="padding:16px 24px;background-color:#D8F2E4;">
      <span style="font-family:${FONT};font-size:12px;line-height:1.5;color:${GREEN_800};">
        &copy; HCLEAN &ndash; Todos os direitos reservados
      </span>
    </td>
  </tr>`;
}

/** Envolve o conteúdo do corpo na casca da marca. */
export function wrap(bodyHtml: string, preheader = ''): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<!-- Sem isto o Gmail e o Apple Mail invertem as cores por conta propria no
     modo escuro, e a faixa verde-escura com texto claro pode virar texto
     claro sobre fundo claro. Declarar que a peca entende os dois modos faz o
     cliente respeitar as cores em vez de adivinhar. -->
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>HCLEAN</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
  <!-- Preheader: primeira linha na caixa de entrada, invisível ao abrir. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAPER};">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- width:100% com max-width:600px: o atributo width="600" e o
             max-width cobrem o Outlook, que ignora o percentual, enquanto no
             celular a tabela encolhe em vez de cortar quase metade do
             conteudo. A maioria dos leads B2B abre no telefone. -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;border:1px solid ${BORDER};">
          ${header()}
          <tr>
            <td style="padding:32px 24px 34px;">
              ${bodyHtml}
            </td>
          </tr>
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------- utilitários */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const p = (text: string, extra = ''): string =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};${extra}">${text}</p>`;

export const h1 = (text: string): string =>
  `<h1 style="margin:0 0 6px;font-family:${FONT};font-size:21px;line-height:1.3;font-weight:bold;color:${GREEN_800};">${text}</h1>`;

export const eyebrow = (text: string): string =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:11px;line-height:1.4;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${GREEN_300};">${text}</p>`;

export const divider = (): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:22px 0;">
     <tr><td style="height:1px;line-height:1px;font-size:0;background-color:${BORDER};">&nbsp;</td></tr>
   </table>`;

/** Tabela rótulo/valor usada no corpo da notificação de lead. */
export function dataTable(rows: { label: string; value: string }[]): string {
  const body = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:11px 14px;background-color:#F7F9F8;border-top:${i ? `1px solid ${BORDER}` : '0'};font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};width:38%;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:11px 14px;border-top:${i ? `1px solid ${BORDER}` : '0'};font-family:${FONT};font-size:14px;line-height:1.5;color:${TEXT};font-weight:bold;vertical-align:top;">${r.value}</td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                 style="border-collapse:collapse;border:1px solid ${BORDER};">
            ${body}
          </table>`;
}

/** Botão sólido — VML para o Outlook, âncora estilizada nos demais. */
export function button(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="background-color:${GREEN_300};">
        <a href="${escapeHtml(href)}"
           style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:14px;font-weight:bold;line-height:1;color:${GREEN_900};text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}
