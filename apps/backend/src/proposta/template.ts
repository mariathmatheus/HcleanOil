/**
 * Template da proposta comercial, fiel ao modelo Word da HCLEAN.
 *
 * Reproduz "Proposta Padrão - Hclean.docx": capa, sumário, apresentação
 * institucional, as seções técnicas ilustradas de cada produto, a tabela de
 * preços, as condições comerciais e o campo de assinatura.
 *
 * Duas diferenças em relação ao .docx, ambas deliberadas:
 *
 * 1. Só entram as seções dos produtos cotados — é o que o gerador Python já
 *    faz com `remover_secoes()`. Quem pede barreira não recebe 20 páginas de
 *    absorvente.
 * 2. O PDF sai do Chromium, não do Word. Roda igual em Windows e Linux, sem
 *    licença e sem interface.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Orcamento } from './orcamento.js';
import { moeda } from './precos.js';
import {
  SECOES,
  APRESENTACAO,
  INTRO_EQUIPAMENTOS,
  INTRO_GRUPO,
  CONDICOES,
  type SecaoProposta,
} from './secoes.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const IMAGENS = join(AQUI, 'imagens');

const VERDE_ESCURO = '#092B1B';
const VERDE = '#00A855';
const CINZA_BORDA = '#DCE0DE';
const TEXTO = '#2A342F';
const TEXTO_FRACO = '#66736D';

/* As imagens viram data URI: o Chromium imprime sem buscar arquivo, e o PDF
   fica autocontido. Lidas uma vez e mantidas em memória. */
const cacheImagens = new Map<string, string>();

function imagemBase64(arquivo: string): string | null {
  if (cacheImagens.has(arquivo)) return cacheImagens.get(arquivo)!;
  try {
    const bytes = readFileSync(join(IMAGENS, arquivo));
    const tipo = arquivo.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const uri = `data:${tipo};base64,${bytes.toString('base64')}`;
    cacheImagens.set(arquivo, uri);
    return uri;
  } catch {
    // Imagem ausente não pode impedir a proposta de sair.
    return null;
  }
}

/**
 * Marca da capa em vetor, portada de `Logo.tsx` do site.
 *
 * A image1.png do Word traz o próprio fundo verde-escuro; sobre a capa, que
 * também é verde-escura, ela aparecia como um retângulo dentro do outro. Em
 * SVG o fundo é transparente e ainda imprime nítida em qualquer escala.
 */
const LOGO_SVG = `
  <div class="marca">
    <svg viewBox="0 0 200 200" width="96" height="96" role="img" aria-label="HCLEAN">
      <defs>
        <linearGradient id="hc-front" x1="0" y1="0.2" x2="1" y2="0.9">
          <stop offset="0" stop-color="#7FD9AE"/>
          <stop offset="0.45" stop-color="#42B383"/>
          <stop offset="1" stop-color="#2C8F63"/>
        </linearGradient>
        <linearGradient id="hc-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2F7D52"/>
          <stop offset="0.5" stop-color="#2C7FA8"/>
          <stop offset="1" stop-color="#4FA3CE"/>
        </linearGradient>
        <clipPath id="hc-clip"><circle cx="100" cy="100" r="82"/></clipPath>
      </defs>
      <circle cx="100" cy="100" r="87" fill="none" stroke="rgba(247,247,247,.95)" stroke-width="8"/>
      <g clip-path="url(#hc-clip)">
        <path d="M10 126 C46 92, 86 92, 122 116 C148 133, 170 136, 192 122 L192 200 L10 200 Z" fill="url(#hc-back)"/>
        <path d="M10 140 C46 106, 86 106, 122 130 C148 147, 170 150, 192 136 L192 149 C170 163, 148 160, 122 143 C86 119, 46 119, 10 153 Z" fill="rgba(255,255,255,.95)"/>
        <path d="M10 154 C46 120, 86 120, 122 144 C148 161, 170 164, 192 150 L192 200 L10 200 Z" fill="url(#hc-front)"/>
      </g>
    </svg>
    <span class="marca-nome">HCLEAN</span>
  </div>`;

export type DadosProposta = {
  numero: string;
  data: string;
  validade: string;
  cliente: { nome: string; empresa: string; email: string; telefone?: string };
  prazoEntrega: string;
  orcamento: Orcamento;
  observacoes?: string;
};

const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ------------------------------------------------- seleção das seções ---- */

/** Liga o id do catálogo de preços ao título da seção técnica. */
const SECAO_DO_PRECO: Record<string, RegExp> = {
  'barreira-de-contencao-seafence': /^seafence$/i,
  'barreira-de-contencao-abfence': /^ab-fence$/i,
  cordao: /^cordão absorvente$/i,
  manta: /^manta absorvente$/i,
  /* Mesma seção técnica da manta comum: o que muda é a espessura, não o
     produto. Sem esta linha a proposta sairia sem a apresentação da manta. */
  'manta-4mm': /^manta absorvente$/i,
  rolo: /^rolo absorvente$/i,
  travesseiro: /^travesseiro/i,
  'barreira-tiras': /tiras/i,
  'barreira-flocada': /flocada/i,
  'sopep-50': /^kit sopep$/i,
  'sopep-100': /^kit sopep$/i,
  'sopep-200': /^kit sopep$/i,
  'kit-primeiro-atendimento': /primeiro atendimento/i,
  'tanque-terrestre': /^tanque terrestre$/i,
  'turfa-organica': /^turfa/i,
};

/**
 * Seções a incluir, na ordem do modelo.
 *
 * Casa pelo id do catálogo, não pelo texto da descrição: o rótulo do
 * formulário é genérico demais para decidir ("Quantidade", "Metragem
 * desejada") e antes fazia a AB-Fence virar SeaFence.
 *
 * A linha do absorvente restringe as variantes — quem pede manta da Linha
 * Verde recebe a manta verde e a apresentação da Linha Verde, não as três.
 */
function secoesRelevantes(o: Orcamento): SecaoProposta[] {
  const alvos: RegExp[] = [];
  const linhas = new Set<string>();

  for (const item of o.linhas) {
    const alvo = item.precoId ? SECAO_DO_PRECO[item.precoId] : undefined;
    if (alvo) alvos.push(alvo);

    const linha =
      item.linhaProduto ??
      item.descricao.match(/Linha (Branca|Verde|Cinza)/i)?.[0];
    if (linha) linhas.add(linha);
  }

  if (!alvos.length) return [];

  return SECOES.filter((s) => {
    // Apresentação da linha entra se algum item for daquela linha.
    if (/^Linha (Branca|Verde|Cinza)$/i.test(s.titulo)) return linhas.has(s.titulo);
    if (!alvos.some((a) => a.test(s.titulo))) return false;
    /* Variante de absorvente: só a linha pedida. Sem linha informada fica a
       Branca, que é a padrão do catálogo — nunca as três de uma vez. */
    if (s.linha) {
      return linhas.size ? linhas.has(s.linha) : s.linha === 'Linha Branca';
    }
    return true;
  });
}

/* ------------------------------------------------------------ blocos ----- */

function blocoSecao(s: SecaoProposta, numeroFigura: number): string {
  const img = s.imagem ? imagemBase64(s.imagem) : null;
  const titulo = s.linha ? `${s.titulo} — ${s.linha}` : s.titulo;

  return `
  <section class="produto">
    <h3>${esc(titulo)}</h3>
    ${
      img
        ? `<figure>
             <img src="${img}" alt="${esc(s.legenda ?? titulo)}">
             <figcaption>Figura ${numeroFigura}: ${esc(s.legenda ?? titulo)}</figcaption>
           </figure>`
        : ''
    }
    ${s.paragrafos.map((t) => `<p>${esc(t)}</p>`).join('')}
    ${
      s.itens?.length
        ? `<ul>${s.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
        : ''
    }
    ${s.tabela ? tabelaEspecificacoes(s.tabela) : ''}
  </section>`;
}

/** Tabela de especificações do produto (a Tabela 1 do modelo). */
function tabelaEspecificacoes(t: NonNullable<SecaoProposta['tabela']>): string {
  const [cabecalho, ...corpo] = t.linhas;
  return `
  <div class="bloco-tabela">
    <table class="specs">
      <thead><tr>${cabecalho.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${corpo
        .map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>
    </table>
    <p class="legenda-tabela">${esc(t.legenda)}</p>
  </div>`;
}

function tabelaItens(o: Orcamento): string {
  const linhas = o.linhas
    .map((l) => {
      const qtd = Number.isInteger(l.quantidade)
        ? String(l.quantidade)
        : l.quantidade.toFixed(2).replace('.', ',');
      const unit =
        l.precoUnitario !== undefined
          ? moeda(l.precoUnitario)
          : '<span class="cotacao">sob cotação</span>';
      const tot =
        l.total !== undefined
          ? moeda(l.total)
          : '<span class="cotacao">a definir</span>';
      const nota = l.observacao ? `<div class="nota">${esc(l.observacao)}</div>` : '';

      return `<tr>
        <td>${esc(l.descricao)}${nota}</td>
        <td class="num">${unit}</td>
        <td>${esc(l.unidade)}</td>
        <td class="num">${qtd}</td>
        <td class="num forte">${tot}</td>
      </tr>`;
    })
    .join('');

  return `
  <table class="itens">
    <thead><tr>
      <th>Produto</th><th class="num">Valor Unitário</th><th>Unidade de Medida</th>
      <th class="num">Quantidade Desejada</th><th class="num">Valor Total</th>
    </tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

/* ------------------------------------------------------------- montagem -- */

export function montarHtmlProposta(d: DadosProposta): string {
  const { orcamento: o } = d;
  const secoes = secoesRelevantes(o);

  /* Agrupa na ordem do modelo, com a abertura de cada grupo. */
  const grupos: { nome: string; secoes: SecaoProposta[] }[] = [];
  for (const s of secoes) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.nome === s.grupo) ultimo.secoes.push(s);
    else grupos.push({ nome: s.grupo, secoes: [s] });
  }

  let figura = 0;
  const corpoEquipamentos = grupos
    .map(
      (g) => `
    <h2>${esc(g.nome)}</h2>
    ${INTRO_GRUPO[g.nome] ? `<p>${esc(INTRO_GRUPO[g.nome])}</p>` : ''}
    ${g.secoes.map((s) => blocoSecao(s, s.imagem ? ++figura : 0)).join('')}`,
    )
    .join('');

  const alerta = o.exigeCotacao
    ? `<div class="alerta">Esta cotação exige personalização — há itens sem preço de tabela.</div>`
    : '';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Proposta ${esc(d.numero)}</title>
<style>
  @page { size: A4; margin: 20mm 18mm 22mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font: 10.5pt/1.55 "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: ${TEXTO};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ------------------------------------------------------------- capa --- */
  .capa {
    height: 247mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: ${VERDE_ESCURO};
    color: #F7F7F7;
    border-radius: 10px;
    padding: 40px;
    break-after: page;
  }
  .marca {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 46px;
  }
  .marca-nome {
    font-size: 34pt;
    font-weight: 700;
    letter-spacing: 3px;
    color: #F7F7F7;
  }
  .capa h1 {
    font-size: 26pt;
    margin: 0 0 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .capa .sub {
    font-size: 13pt;
    color: #9FE3BE;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 46px;
  }
  .capa .dados { font-size: 13pt; line-height: 2; }
  .capa .dados strong { display: block; font-size: 16pt; }

  /* ---------------------------------------------------------- sumário --- */
  .sumario { break-after: page; }
  .sumario ol { padding-left: 18px; }
  .sumario li { margin-bottom: 6px; }

  h1 {
    font-size: 15pt;
    color: ${VERDE_ESCURO};
    margin: 0 0 12px;
    padding-bottom: 7px;
    border-bottom: 2px solid ${VERDE};
    break-after: avoid;
  }
  h2 {
    font-size: 12.5pt;
    color: ${VERDE_ESCURO};
    margin: 26px 0 8px;
    break-after: avoid;
  }
  h3 {
    font-size: 11pt;
    color: ${VERDE};
    margin: 20px 0 8px;
    break-after: avoid;
  }
  p { margin: 0 0 9px; text-align: justify; }
  ul { margin: 0 0 12px; padding-left: 20px; }
  li { margin-bottom: 4px; }

  /* A seção inteira não cabe sempre numa folha; forçar avoid aqui faria o
     Chromium ignorar o pedido e ainda partir a tabela no meio. Protege-se o
     que precisa ficar junto: figura, tabela e seus títulos. */
  section.produto { margin-bottom: 18px; }

  figure { margin: 10px 0 12px; text-align: center; break-inside: avoid; }
  figure img {
    max-width: 78%;
    max-height: 70mm;
    border: 1px solid ${CINZA_BORDA};
    border-radius: 6px;
  }
  figcaption {
    font-size: 8.5pt;
    color: ${TEXTO_FRACO};
    margin-top: 5px;
    font-style: italic;
  }

  /* Tabela e legenda são uma unidade: separadas, a legenda vira órfã. */
  .bloco-tabela { break-inside: avoid; }
  table.specs {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 4px;
    font-size: 9pt;
  }
  table.specs th, table.specs td {
    border: 1px solid ${CINZA_BORDA};
    padding: 6px 9px;
    text-align: center;
  }
  table.specs th {
    background: #EEF4F1;
    color: ${VERDE_ESCURO};
    font-weight: 600;
  }
  .legenda-tabela {
    font-size: 8.5pt;
    color: ${TEXTO_FRACO};
    font-style: italic;
    text-align: center;
    margin-bottom: 12px;
  }

  /* ------------------------------------------------------------ dados --- */
  .cliente { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .cliente td { padding: 5px 0; vertical-align: top; }
  .cliente td:first-child { width: 140px; color: ${TEXTO_FRACO}; }

  .alerta {
    background: #FBEEEC;
    border: 1px solid #E0A9A0;
    border-left: 4px solid #C4392B;
    color: #A32B1F;
    font-weight: 600;
    padding: 11px 14px;
    border-radius: 6px;
    margin-bottom: 20px;
  }

  table.itens { width: 100%; border-collapse: collapse; margin-top: 10px; }
  table.itens th {
    background: ${VERDE_ESCURO};
    color: #F7F7F7;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: .8px;
    text-align: left;
    padding: 9px 10px;
  }
  table.itens th.num, table.itens td.num { text-align: right; }
  table.itens td {
    padding: 9px 10px;
    border-bottom: 1px solid ${CINZA_BORDA};
    vertical-align: top;
  }
  table.itens tr:nth-child(even) td { background: #F7F9F8; }
  .forte { font-weight: 700; color: ${VERDE_ESCURO}; }
  .cotacao { color: #C4392B; font-weight: 600; }
  .nota { font-size: 8.5pt; color: ${TEXTO_FRACO}; margin-top: 3px; }

  .totais {
    margin: 14px 0 0 auto;
    width: 310px;
    border-collapse: collapse;
    break-inside: avoid;
  }
  .totais td { padding: 7px 10px; }
  .totais tr.total td {
    background: ${VERDE_ESCURO};
    color: #F7F7F7;
    font-size: 12pt;
    font-weight: 700;
  }

  .assinaturas {
    display: flex;
    gap: 40px;
    margin-top: 44px;
    break-inside: avoid;
  }
  .assinaturas div { flex: 1; text-align: center; }
  .assinaturas .linha {
    border-top: 1px solid ${TEXTO};
    margin-bottom: 6px;
    padding-top: 8px;
  }

  tr { break-inside: avoid; }
</style></head>
<body>

  <!-- ------------------------------------------------------------ capa -->
  <div class="capa">
    ${LOGO_SVG}
    <h1>Proposta Técnica/Comercial</h1>
    <div class="sub">Equipamentos de resposta a emergência</div>
    <div class="dados">
      <strong>Proposta nº ${esc(d.numero)}</strong>
      Cliente: ${esc(d.cliente.empresa)}<br>
      ${esc(d.data)}
    </div>
  </div>

  <!-- --------------------------------------------------------- sumário -->
  <div class="sumario">
    <h1>Sumário</h1>
    <ol>
      <li>Apresentação</li>
      <li>Equipamentos e Materiais para Resposta a Emergências
        <ol>${grupos.map((g) => `<li>${esc(g.nome)}</li>`).join('')}</ol>
      </li>
      <li>Preços e Condições Comerciais</li>
      <li>Validade da Proposta</li>
      <li>Assinatura e Aprovação</li>
    </ol>
  </div>

  <!-- ---------------------------------------------------- apresentação -->
  <h1>Apresentação</h1>
  ${APRESENTACAO.map((t) => `<p>${esc(t)}</p>`).join('')}

  <h1>Equipamentos e Materiais para Resposta a Emergências</h1>
  <p>${esc(INTRO_EQUIPAMENTOS)}</p>
  ${corpoEquipamentos}

  <!-- ------------------------------------------------ preços e condições -->
  <h1 style="margin-top:30px;">Preços e Condições Comerciais</h1>
  ${alerta}
  <p>${esc(CONDICOES.intro)}</p>

  <table class="cliente">
    <tr><td>Cliente</td><td><strong>${esc(d.cliente.empresa)}</strong></td></tr>
    <tr><td>Contato</td><td>${esc(d.cliente.nome)}</td></tr>
    <tr><td>E-mail</td><td>${esc(d.cliente.email)}</td></tr>
    ${d.cliente.telefone ? `<tr><td>Telefone</td><td>${esc(d.cliente.telefone)}</td></tr>` : ''}
    ${o.estado ? `<tr><td>Estado de entrega</td><td>${esc(o.estado)}</td></tr>` : ''}
  </table>

  ${tabelaItens(o)}

  <table class="totais">
    <tr><td>Frete</td><td class="num"><strong>${esc(o.frete.rotulo)}</strong></td></tr>
    <tr class="total"><td>Total</td><td class="num">${moeda(o.total)}</td></tr>
  </table>

  <ul style="margin-top:18px;">
    <li>Frete: <strong>${esc(o.frete.rotulo)}</strong>${
      o.frete.cif ? ' — incluso para o Sudeste em pedidos a partir de R$ 1.000,00' : ''
    };</li>
    <li>Prazo de entrega: <strong>${esc(d.prazoEntrega)}</strong>;</li>
    ${CONDICOES.itens.map((t) => `<li>${esc(t)}</li>`).join('')}
  </ul>

  ${d.observacoes ? `<h2>Observações do cliente</h2><p>${esc(d.observacoes)}</p>` : ''}

  <!-- ------------------------------------------------------- validade -->
  <h1 style="margin-top:26px;">Validade da Proposta</h1>
  <p>${esc(CONDICOES.validade)}</p>

  <h1 style="margin-top:26px;">Assinatura e Aprovação</h1>
  <div class="assinaturas">
    <div>
      <div class="linha"></div>
      Representante HCLEAN<br>
      Data: ___ / ___ / _____
    </div>
    <div>
      <div class="linha"></div>
      ${esc(d.cliente.empresa)}<br>
      Data: ___ / ___ / _____
    </div>
  </div>

</body></html>`;
}
