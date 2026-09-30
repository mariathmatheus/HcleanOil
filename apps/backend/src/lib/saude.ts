/**
 * Estado observável do serviço, para o /health poder dizer mais que "ok".
 *
 * Existe por causa do incidente do túnel: o `verifyConnection()` da subida já
 * detectava o SMTP inalcançável, mas só imprimia no console. O /health seguia
 * devolvendo `{ok:true}`, o Docker considerava o container saudável e o painel
 * não tinha como mostrar que todo lead estava sendo recusado. O erro existia e
 * ninguém o via.
 */
import { verifyConnection } from './mailer.js';

type EstadoSmtp = 'desconhecido' | 'ok' | 'falha';

let estado: EstadoSmtp = 'desconhecido';
let detalhe: string | undefined;
let verificadoEm: string | undefined;

export function estadoSmtp(): { estado: EstadoSmtp; detalhe?: string; verificadoEm?: string } {
  return { estado, detalhe, verificadoEm };
}

/**
 * Confere o SMTP e guarda o resultado.
 *
 * Nunca rejeita: é diagnóstico, e uma exceção aqui derrubaria a subida do
 * processo por um problema que não impede o site de servir nem o lead de ser
 * gravado em disco.
 */
export async function conferirSmtp(): Promise<EstadoSmtp> {
  try {
    await verifyConnection();
    estado = 'ok';
    detalhe = undefined;
  } catch (err) {
    estado = 'falha';
    detalhe = err instanceof Error ? err.message : String(err);
  }
  verificadoEm = new Date().toISOString();
  return estado;
}
