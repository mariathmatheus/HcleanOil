/**
 * Regras do formulário de orçamento, do lado do navegador.
 *
 * Existe separado do componente por dois motivos: espelha `contactSchema` do
 * backend (`apps/backend/src/lib/schema.ts`) e precisa ser lido em paralelo com
 * ele quando um limite muda; e a máscara de telefone tem casos de borda
 * suficientes — código de país, fixo, celular, caret — para merecer leitura
 * fora do meio do JSX.
 *
 * O princípio: o cliente nunca deve conseguir enviar algo que o servidor vai
 * recusar. Todo limite abaixo é o mesmo limite do schema, não um valor
 * aproximado.
 */

/** Limites de tamanho, iguais aos do `contactSchema`. */
export const LIMITES = {
  nome: 120,
  empresa: 160,
  email: 180,
  /** "(21) 99999-9999" — o formato brasileiro mais longo já pontuado. */
  telefone: 15,
  mensagem: 4000,
} as const;

/* ------------------------------------------------------------- telefone */

/**
 * Reduz um telefone digitado ou colado aos dígitos nacionais (DDD + número).
 *
 * Descartar tudo que não é dígito não basta: quem copia o número do WhatsApp
 * ou de um contato salvo traz o código do país, e `+55 (21) 99999-8888` virava
 * `(55) 2199-999` — um DDD inexistente, nove dígitos, recusado pelo servidor
 * como se a pessoa tivesse digitado errado. O código de país sai antes de
 * qualquer formatação, tanto na forma `+55` quanto `0055`.
 */
export function digitosDoTelefone(bruto: string): string {
  let d = bruto.replace(/\D/g, '');

  /* `0055 21 ...`: prefixo internacional discado. Só remove quando o que
     sobra ainda tem cara de telefone nacional. */
  if (d.startsWith('0055') && d.length > 12) d = d.slice(4);
  /* `+55 21 ...` ou `5521...`: 13 dígitos é celular com país, 12 é fixo com
     país. Abaixo disso o "55" pode ser o DDD de verdade (55 = RS, Santa
     Maria), então fica. */
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);

  return d.slice(0, 11);
}

/**
 * Formata os dígitos nacionais como `(DD) NNNNN-NNNN`.
 *
 * Celular tem 9 dígitos depois do DDD e fixo tem 8: o ponto do hífen muda
 * conforme o comprimento, e só aparece quando há algo depois dele.
 */
export function formatarTelefone(bruto: string): string {
  const numeros = digitosDoTelefone(bruto);
  if (!numeros) return '';
  /* Enquanto só há DDD, o fecha-parênteses ainda não existe: escrevê-lo aqui
     obrigaria a pessoa a apagá-lo para corrigir o segundo dígito. */
  if (numeros.length <= 2) return `(${numeros}`;

  const ddd = numeros.slice(0, 2);
  const resto = numeros.slice(2);

  /* Onde entra o hífen. Celular tem 9 dígitos depois do DDD e fixo tem 8, e
     até o 8º dígito os dois são indistinguíveis — por isso o hífen só aparece
     quando o número já passou de 8, revelando que é celular, ou quando parou
     em 8 e portanto fechou como fixo.

     Adiantar o hífen faria "(21) 9999-9" aparecer no meio da digitação de um
     celular e o separador saltar de posição na tecla seguinte. Entre 5 e 7
     dígitos o número ainda pode virar qualquer um dos dois, então segue sem
     separador. */
  const corte = resto.length > 8 ? 5 : resto.length === 8 ? 4 : 0;
  if (!corte) return `(${ddd}) ${resto}`;

  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/**
 * Onde o cursor deve ficar depois de a máscara reescrever o campo.
 *
 * Sem isso o cursor pulava para o fim a cada tecla digitada no meio do
 * número: corrigir o DDD de um telefone já preenchido era impossível, porque
 * o segundo dígito ia para o final da string. A conta é feita em dígitos, não
 * em caracteres — conta quantos dígitos existiam antes do cursor e recoloca-o
 * depois do mesmo número de dígitos no texto novo, pulando a pontuação.
 */
export function cursorDepoisDaMascara(
  formatado: string,
  anterior: string,
  cursorAnterior: number,
): number {
  const digitosAntesDoCursor = anterior.slice(0, cursorAnterior).replace(/\D/g, '').length;
  if (digitosAntesDoCursor === 0) {
    /* Nada digitado antes do cursor: encosta depois do "(" de abertura para o
       próximo dígito entrar no DDD, não fora dos parênteses. */
    return Math.min(1, formatado.length);
  }

  let vistos = 0;
  for (let i = 0; i < formatado.length; i += 1) {
    if (/\d/.test(formatado[i]!)) {
      vistos += 1;
      if (vistos === digitosAntesDoCursor) {
        /* Pula a pontuação que vem logo depois — ") " ou "-". Parar antes dela
           deixaria o cursor num ponto onde o próximo dígito não pode entrar, e
           a tecla seguinte o empurraria para o outro lado do separador. */
        let destino = i + 1;
        while (destino < formatado.length && !/\d/.test(formatado[destino]!)) {
          destino += 1;
        }
        return destino;
      }
    }
  }
  return formatado.length;
}

/* ------------------------------------------------------------ validação */

/** Campos que carregam mensagem de erro própria. */
export type CampoComErro = 'nome' | 'empresa' | 'email' | 'telefone' | 'estado';

export type Erros = Partial<Record<CampoComErro, string>>;

/**
 * Ordem de exibição — e de foco. O primeiro campo inválido é o primeiro desta
 * lista que falhou, não o primeiro que o `for` encontrou, para que o foco caia
 * sempre no campo mais alto do formulário.
 */
export const ORDEM_DOS_CAMPOS: CampoComErro[] = [
  'nome',
  'empresa',
  'email',
  'telefone',
  'estado',
];

/** `id` do input de cada campo. Os três de rastreamento não seguem o padrão. */
export const ID_DO_CAMPO: Record<CampoComErro, string> = {
  /* form-field-Nome / form-field-Email / form-field-phone vêm do formulário
     Elementor do site anterior e são lidos por seletor CSS pelo rastreamento
     de mídia. Não renomear. */
  nome: 'form-field-Nome',
  empresa: 'q-empresa',
  email: 'form-field-Email',
  telefone: 'form-field-phone',
  estado: 'q-estado',
};

/** `id` do parágrafo de erro, referenciado por `aria-describedby`. */
export function idDoErro(campo: CampoComErro) {
  return `${ID_DO_CAMPO[campo]}-erro`;
}

/*
 * E-mail: proposital ser mais permissivo que o do servidor. Recusar aqui um
 * endereço que a API aceitaria transformaria um erro nosso em "meu e-mail não
 * funciona neste site". Só barra o que claramente não é endereço — sem
 * arroba, sem domínio, com espaço no meio.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida os dados do formulário e devolve as mensagens em português.
 *
 * Em português porque `reportValidity()` mostrava o balão nativo no idioma do
 * navegador: num Chrome em inglês, um formulário em português respondia "Please
 * fill out this field" — e o balão desaparece ao primeiro clique, sem deixar
 * rastro de qual campo estava errado.
 */
export function validar(valores: Record<CampoComErro, string>): Erros {
  const erros: Erros = {};

  const nome = valores.nome.trim();
  if (!nome) erros.nome = 'Informe seu nome.';
  else if (nome.length < 2) erros.nome = 'Informe seu nome completo.';
  else if (nome.length > LIMITES.nome) {
    erros.nome = `Use no máximo ${LIMITES.nome} caracteres.`;
  }

  const empresa = valores.empresa.trim();
  if (!empresa) erros.empresa = 'Informe o nome da empresa.';
  else if (empresa.length < 2) erros.empresa = 'Informe o nome da empresa.';
  else if (empresa.length > LIMITES.empresa) {
    erros.empresa = `Use no máximo ${LIMITES.empresa} caracteres.`;
  }

  const email = valores.email.trim();
  if (!email) erros.email = 'Informe seu e-mail.';
  else if (!EMAIL.test(email)) erros.email = 'Informe um e-mail válido, como nome@empresa.com.br.';
  else if (email.length > LIMITES.email) {
    erros.email = `Use no máximo ${LIMITES.email} caracteres.`;
  }

  /* Telefone continua opcional: quem prefere ser contatado por e-mail não é
     obrigado a informar. Mas se informou, precisa fechar 10 ou 11 dígitos —
     é a mesma regra do servidor, e sem ela o envio voltava 400. */
  const digitos = digitosDoTelefone(valores.telefone);
  if (valores.telefone.trim() && digitos.length !== 10 && digitos.length !== 11) {
    erros.telefone = 'Informe DDD e telefone completos, como (21) 99999-9999.';
  }

  if (!valores.estado) erros.estado = 'Selecione o estado de entrega.';

  return erros;
}
