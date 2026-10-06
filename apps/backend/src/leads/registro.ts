/**
 * Registro permanente de todo lead que entrou, em CSV.
 *
 * Existe porque a fila (`fila.ts`) NÃO é histórico: o arquivo do lead é
 * apagado assim que o servidor SMTP aceita a mensagem. É uma sala de espera,
 * e por isso costuma estar vazia — o que é bom sinal, mas significa que um
 * backup da fila não guarda o que já foi enviado.
 *
 * Aqui é o contrário: nada é apagado, nunca. Uma linha por lead, acrescentada
 * no momento em que ele chega, independente de o e-mail ter saído ou não. É o
 * que permite responder "quantos pedidos vieram em setembro" meses depois, e
 * é a cópia que sobrevive se a caixa de e-mail for limpa.
 *
 * CSV e não JSON porque o destino é planilha: o Excel abre direto, sem
 * conversão nem ferramenta no meio.
 */
import { appendFile, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../lib/env.js';
import type { ContactPayload, QuoteItem } from '../lib/schema.js';

const ARQUIVO = join(env.PROPOSTAS_DIR, 'leads-historico.csv');

/* Ponto-e-vírgula, não vírgula. O Excel em português trata a vírgula como
   separador DECIMAL, então um arquivo separado por vírgula abre com tudo
   amassado numa coluna só. O ponto-e-vírgula é o que o Excel pt-BR espera. */
const SEP = ';';

const COLUNAS = [
  'recebido_em',
  'lead_id',
  'nome',
  'empresa',
  'email',
  'telefone',
  'estado',
  'produto',
  'valor',
  'itens',
  'mensagem',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'pagina_origem',
] as const;

/**
 * Prepara um valor para uma célula de CSV.
 *
 * Três armadilhas, todas reais com dados de formulário:
 *
 * 1. O separador, a aspa e a quebra de linha dentro do texto quebram a
 *    estrutura. A mensagem do formulário tem até 4000 caracteres e quebras de
 *    linha à vontade, então isto não é hipotético.
 * 2. Um valor que começa com `=`, `+`, `-` ou `@` é lido pelo Excel como
 *    FÓRMULA. Alguém pode mandar `=HYPERLINK(...)` no campo de mensagem e a
 *    planilha executaria aquilo ao ser aberta — é injeção de fórmula em CSV.
 *    O apóstrofo à frente força o Excel a tratar como texto.
 * 3. Aspa dentro de campo entre aspas se escapa DOBRANDO, não com barra.
 */
function celula(valor: unknown): string {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  texto = texto.replace(/\r\n|\r|\n/g, ' ').trim();
  if (/^[=+\-@\t]/.test(texto)) texto = `'${texto}`;
  if (texto.includes(SEP) || texto.includes('"')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Acrescenta o lead ao histórico.
 *
 * Nunca lança: é registro, não parte do fluxo do pedido. Se o disco estiver
 * cheio ou a pasta sumir, o lead ainda tem de ser gravado na fila e enviado —
 * perder a linha do histórico é ruim, perder o pedido do cliente é grave.
 */
export async function registrarNoHistorico(lead: {
  leadId: string;
  recebidoEm: string;
  valor: number;
  dados: ContactPayload;
  itens: QuoteItem[];
}): Promise<void> {
  try {
    await mkdir(env.PROPOSTAS_DIR, { recursive: true });

    /* O cabeçalho entra uma vez só, na criação. */
    try {
      await access(ARQUIVO);
    } catch {
      /* BOM no começo: sem ele o Excel abre o arquivo como Windows-1252 e
         "Contenção" vira "ContenÃ§Ã£o". Com BOM ele reconhece UTF-8. */
      await writeFile(ARQUIVO, '﻿' + COLUNAS.join(SEP) + '\n', 'utf8');
    }

    const d = lead.dados;
    const linha = [
      lead.recebidoEm,
      lead.leadId,
      d.nome,
      d.empresa,
      d.email,
      d.telefone ?? '',
      d.estado ?? '',
      d.produto ?? '',
      /* Vírgula decimal, como o Excel pt-BR espera. */
      lead.valor ? String(lead.valor).replace('.', ',') : '',
      lead.itens.map((i) => `${i.label}: ${i.value}`).join(' | '),
      d.mensagem ?? '',
      d.utm_source ?? '',
      d.utm_medium ?? '',
      d.utm_campaign ?? '',
      d.pagina_origem ?? '',
    ].map(celula);

    await appendFile(ARQUIVO, linha.join(SEP) + '\n', 'utf8');
  } catch (err) {
    console.error('[historico] falha ao registrar lead:', err);
  }
}

/** Quantas linhas o histórico tem. Para o /health e para o backup relatarem. */
export async function totalNoHistorico(): Promise<number> {
  try {
    const texto = await readFile(ARQUIVO, 'utf8');
    return texto.split('\n').filter((l) => l.trim()).length - 1; // menos o cabeçalho
  } catch {
    return 0;
  }
}
