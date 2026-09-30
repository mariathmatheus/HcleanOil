/**
 * Gera a proposta em PDF.
 *
 * Renderiza o HTML no Chromium que o Playwright já traz. Isso substitui a
 * dependência de Microsoft Word do gerador antigo: o mesmo binário roda em
 * Windows e Linux, sem interface, sem licença e sem COM.
 *
 * O navegador sobe uma vez e é reaproveitado entre chamadas — abrir um
 * Chromium por proposta levaria segundos a cada pedido.
 */
import { chromium, type Browser } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { montarHtmlProposta, type DadosProposta } from './template.js';
import { montarOrcamento, type Orcamento } from './orcamento.js';
import type { QuoteItem } from '../lib/schema.js';

const PASTA = process.env.PROPOSTAS_DIR ?? 'propostas';
const CONTADOR = join(PASTA, 'contador.json');

let browser: Browser | null = null;

async function navegador(): Promise<Browser> {
  if (browser?.isConnected()) return browser;
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  return browser;
}

/** Fecha o navegador — usado no encerramento do processo. */
export async function encerrarNavegador() {
  if (browser?.isConnected()) await browser.close();
  browser = null;
}

/**
 * Próximo número da proposta, no formato NN/AAAA.
 *
 * O contador é por ano e vive num JSON, como no gerador antigo. Se o arquivo
 * não existir, começa do número informado em PROPOSTA_INICIAL — útil para
 * continuar de onde a numeração manual parou.
 */
async function proximoNumero(): Promise<string> {
  const ano = String(new Date().getFullYear());
  let dados: Record<string, number> = {};

  if (existsSync(CONTADOR)) {
    try {
      dados = JSON.parse(await readFile(CONTADOR, 'utf8'));
    } catch {
      // Arquivo corrompido não pode travar o atendimento: recomeça a contagem.
      dados = {};
    }
  }

  const inicial = Number(process.env.PROPOSTA_INICIAL ?? 0);
  const atual = dados[ano] ?? inicial;
  const proximo = atual + 1;
  dados[ano] = proximo;

  await mkdir(PASTA, { recursive: true });
  await writeFile(CONTADOR, JSON.stringify(dados), 'utf8');

  return `${String(proximo).padStart(2, '0')}/${ano}`;
}

/** Nome de arquivo sem acento, espaço ou caractere proibido. */
function nomeSeguro(texto: string, max = 24): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // acentos
    .replace(/[^\w\s-]/g, '') // pontua\u00e7\u00e3o e s\u00edmbolos
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, max);
}

const hoje = () =>
  new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function emDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export type PedidoProposta = {
  nome: string;
  empresa: string;
  email: string;
  telefone?: string;
  estado?: string;
  produto?: string;
  mensagem?: string;
  itens: QuoteItem[];
};

export type PropostaGerada = {
  numero: string;
  arquivo: string;
  pdf: Buffer;
  orcamento: Orcamento;
};

/**
 * Monta o orçamento, renderiza o PDF e devolve o arquivo em memória — quem
 * chamou decide se anexa ao e-mail, salva em disco, ou ambos.
 */
export async function gerarProposta(pedido: PedidoProposta): Promise<PropostaGerada> {
  const orcamento = montarOrcamento(pedido.itens, {
    produto: pedido.produto,
    estado: pedido.estado,
  });

  const numero = await proximoNumero();

  const dados: DadosProposta = {
    numero,
    data: hoje(),
    /* 30 dias, igual ao que o documento diz em CONDICOES.validade e ao que os
       e-mails prometem. Ficou 15 aqui por um tempo, sem contradizer nada só
       porque o campo não chega a ser renderizado — mas seria um desmentido
       silencioso no dia em que alguém o usasse. */
    validade: emDias(30),
    cliente: {
      nome: pedido.nome,
      empresa: pedido.empresa,
      email: pedido.email,
      telefone: pedido.telefone,
    },
    prazoEntrega: process.env.PRAZO_ENTREGA ?? 'a combinar',
    orcamento,
    observacoes: pedido.mensagem,
  };

  const html = montarHtmlProposta(dados);

  const b = await navegador();
  const page = await b.newPage();
  try {
    /* `domcontentloaded` basta: o HTML não busca nada externo — a marca é SVG
       embutido e a fonte é do sistema. */
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8pt;color:#8E9A94;padding:0 16mm;
                    display:flex;justify-content:space-between;">
          <span>Proposta ${numero} · HCLEAN</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '18mm', bottom: '22mm', left: '16mm', right: '16mm' },
    });

    const arquivo =
      `Proposta_${numero.replace('/', '_')}_` +
      `${nomeSeguro(pedido.empresa)}_` +
      `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;

    return { numero, arquivo, pdf, orcamento };
  } finally {
    await page.close();
  }
}
