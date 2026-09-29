/**
 * Envia o lead para o container de medição server-side.
 *
 * O evento equivalente sai do navegador pelo dataLayer. Este aqui existe
 * porque aquele não chega quando um bloqueador barra o script, e é justamente
 * no tráfego pago que eles são mais comuns. O mesmo `lead_id` viaja nos dois
 * caminhos, e o container deduplica.
 *
 * Nada aqui pode derrubar o pedido: se a medição falhar, o lead já está a
 * caminho da caixa comercial, que é o que importa.
 */
import { env } from './env.js';
import type { QuoteItem } from './schema.js';

type DadosLead = {
  leadId: string;
  /** Valor estimado do pedido, para o lance por valor no Google Ads. */
  valor: number;
  nome: string;
  email: string;
  telefone?: string;
  estado?: string;
  produtos?: string;
  itens: QuoteItem[];
  /** Vêm da requisição, para o container atribuir a sessão certa. */
  clientId?: string;
  /** Identificador do clique no anúncio, para casar a conversão com a campanha. */
  gclid?: string;
  paginaOrigem?: string;
  userAgent?: string;
  ip?: string;
};

/** Tempo máximo esperando o container. Depois disso, desiste em silêncio. */
const TIMEOUT_MS = 3000;

export async function registrarLead(dados: DadosLead): Promise<void> {
  if (!env.SGTM_URL) return; // medição não configurada

  const corpo = {
    event_name: 'generate_lead',
    /* O container usa isto para casar com o evento do navegador. Sem ele o
       mesmo lead vira duas conversões no relatório. */
    lead_id: dados.leadId,
    client_id: dados.clientId,
    gclid: dados.gclid,
    page_location: dados.paginaOrigem,
    currency: 'BRL',
    value: dados.valor,
    estado_entrega: dados.estado,
    produtos_pedidos: dados.produtos,
    items: dados.itens.map((i) => ({ item_name: i.label, quantity: i.value })),
    user_data: {
      /* Enviado em claro para o próprio container, que é quem aplica o hash
         antes de repassar a Meta ou Google. Por isso o destino precisa ser um
         endpoint seu, nunca um terceiro qualquer. */
      email: dados.email,
      phone: dados.telefone,
      name: dados.nome,
    },
    user_agent: dados.userAgent,
    ip_override: dados.ip,
  };

  /* AbortSignal.timeout em vez de um setTimeout manual: a requisição é
     cancelada de verdade, sem deixar socket pendurado. */
  try {
    const res = await fetch(`${env.SGTM_URL}/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.SGTM_API_KEY ? { 'X-API-Key': env.SGTM_API_KEY } : {}),
      },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`[medicao] container respondeu ${res.status}`);
    }
  } catch (err) {
    // Rede fora, container fora, timeout: nada disso pode afetar o lead.
    console.error('[medicao] falha ao registrar:', (err as Error).message);
  }
}
