'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { contatoDireto } from '@/lib/analytics';

/**
 * Link de contato que registra o clique.
 *
 * WhatsApp, telefone e e-mail levam o visitante para fora do site, e sem o
 * evento esses atendimentos ficam invisíveis no relatório: o funil pareceria
 * terminar em abandono quando na verdade virou conversa.
 *
 * A navegação não espera o evento. `dataLayer.push` é síncrono, e segurar o
 * clique para "garantir" o envio só atrasaria o visitante.
 */
export function ContactLink({
  canal,
  origem,
  children,
  onClick,
  ...props
}: {
  canal: 'whatsapp' | 'telefone' | 'email';
  /** Onde no site o link estava: cabeçalho, rodapé, página de produto. */
  origem: string;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        contatoDireto(canal, origem);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
