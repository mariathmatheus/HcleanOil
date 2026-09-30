'use client';

import { useEffect, useState } from 'react';
import { site } from '@/data/site';
import { contatoDireto } from '@/lib/analytics';
import s from './WhatsAppButton.module.css';

/**
 * Atalho flutuante para o WhatsApp.
 *
 * O número já existia em `site.ts` mas não aparecia em lugar nenhum do site.
 * Em venda técnica B2B no Brasil o WhatsApp costuma ter a resposta mais
 * rápida, e sem o botão o visitante que não quer preencher formulário não
 * tinha caminho nenhum.
 *
 * O clique registra `contact_click`, para o atendimento que vira conversa
 * não desaparecer do relatório como se fosse abandono.
 */
export function WhatsAppButton() {
  /* Recolhe enquanto a faixa de consentimento está de pé. No telefone os dois
     disputam o mesmo canto: subir o botão acima da faixa o jogava em cima dos
     números do hero, cobrindo o terceiro deles. A faixa é a decisão que vem
     primeiro de qualquer forma, e o botão reaparece assim que ela é
     respondida. */
  const [recolhido, setRecolhido] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    const olhar = () =>
      setRecolhido(Boolean(raiz.style.getPropertyValue('--consent-lift')));

    olhar();
    /* A faixa publica a variável no <html> ao aparecer e a remove ao ser
       respondida, então basta observar o atributo de estilo da raiz. */
    const observador = new MutationObserver(olhar);
    observador.observe(raiz, { attributes: true, attributeFilter: ['style'] });
    return () => observador.disconnect();
  }, []);

  return (
    <a
      className={s.botao}
      data-recolhido={recolhido ? 'true' : undefined}
      href={site.contact.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com um especialista pelo WhatsApp"
      onClick={() => contatoDireto('whatsapp', 'botao-flutuante')}
    >
      {/* Marca do WhatsApp em caminho próprio: evita carregar uma biblioteca
          de ícones inteira por causa de um único glifo. */}
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23z" />
      </svg>
    </a>
  );
}
