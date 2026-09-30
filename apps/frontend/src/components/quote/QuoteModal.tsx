'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LogoMark } from '@/components/ui/Logo';
import { products } from '@/data/site';
import { findQuoteProduct, type QuantityField } from '@/data/quote';
import {
  identificadoresDeCampanha,
  abrirOrcamento,
  enviarLead,
  falhaNoEnvio,
} from '@/lib/analytics';
import {
  LIMITES,
  ORDEM_DOS_CAMPOS,
  ID_DO_CAMPO,
  cursorDepoisDaMascara,
  formatarTelefone,
  idDoErro,
  validar,
  type CampoComErro,
  type Erros,
} from './validacao';
import s from './QuoteModal.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const ENDPOINT = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Unidades federativas, para o estado de entrega. */
const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO',
];

type Props = {
  open: boolean;
  onClose: () => void;
  productSlug?: string;
};

/**
 * Um produto já adicionado ao pedido, com as variantes marcadas.
 *
 * As quantidades não vivem aqui: continuam nos inputs, e o FormData as lê no
 * envio. Guardar só a seleção evita duplicar estado — e mantém o valor
 * digitado intacto quando o cliente adiciona outro produto.
 */
type CartEntry = {
  slug: string;
  name: string;
  /** Ids das variantes marcadas. Variante única entra já marcada. */
  options: string[];
};

/**
 * Nome do campo enviado à API.
 *
 * O produto vai embutido no rótulo de propósito: no backend, o
 * reconhecimento por rótulo tem prioridade sobre o produto do formulário
 * (`reconhecer()` em proposta/orcamento.ts). Com vários produtos no mesmo
 * pedido não existe mais "o produto" único, então cada linha precisa se
 * identificar sozinha — senão manta e cordão cairiam no mesmo preço.
 */
function fieldName(product: string, option: string, label: string, unit: string) {
  /* Quando a variante já repete o nome do produto ("Kit SOPEP 200 L" dentro
     de "Kits SOPEP"), não duplica o prefixo. */
  const base = option.toLowerCase().includes(product.toLowerCase())
    ? option
    : `${product} — ${option}`;
  /* Se a variante já diz o que é ("Metragem desejada"), o rótulo do campo
     seria redundante. */
  return option.toLowerCase().includes(label.toLowerCase())
    ? `${base} (${unit})`
    : `${base} — ${label} (${unit})`;
}

export function QuoteModal({ open, onClose, productSlug }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  /* Produtos já adicionados ao pedido. Cada um guarda as variantes marcadas;
     as quantidades ficam nos próprios inputs, lidas no envio pelo FormData. */
  const [cart, setCart] = useState<CartEntry[]>([]);
  /* Produto em foco no seletor — ainda não faz parte do pedido. */
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  /* Erros por campo, em português. Substituem `reportValidity()`: o balão
     nativo saía no idioma do navegador e desaparecia ao primeiro clique. */
  const [erros, setErros] = useState<Erros>({});

  const config = slug ? findQuoteProduct(slug) : undefined;
  const alreadyInCart = cart.some((c) => c.slug === slug);

  /* Abre e fecha o <dialog> nativo em resposta à prop. showModal() é o que
     ativa a camada superior, o backdrop e a prisão de foco. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  /* Ao reabrir, volta ao estado inicial. Quando o pop-up nasce de uma página
     de produto, esse produto já entra no pedido — era o comportamento antigo
     e continua sendo o esperado por quem clicou ali. */
  useEffect(() => {
    if (!open) return;
    const inicial = productSlug ? entryFor(productSlug) : undefined;
    setCart(inicial ? [inicial] : []);
    setSlug('');
    setStatus('idle');
    setMessage('');
    /* Sem isto, reabrir o pop-up trazia de volta os erros da tentativa
       anterior sobre campos que o `reset()` logo abaixo acabou de limpar. */
    setErros({});

    /* O pop-up fica montado e só alterna `open`, de modo que o DOM sobrevive
       ao fechamento. Sem limpar aqui, reabrir trazia de volta o que a pessoa
       havia digitado enquanto o pedido zerava — e, pior, o consentimento
       continuava desmarcado numa tela que parecia nova. */
    ref.current?.querySelector('form')?.reset();

    /* Pelo mesmo motivo, o corpo rolável guardava a posição anterior: em tela
       pequena o pop-up reabria no meio do formulário, com Nome e E-mail acima
       da área visível e sem nenhuma pista de que existiam. */
    const corpo = ref.current?.querySelector<HTMLElement>('[data-corpo]');
    if (corpo) corpo.scrollTop = 0;

    /* Abertura do pop-up: é o topo do funil de orçamento, e separa quem
       demonstrou intenção de quem só passou pela página. */
    abrirOrcamento(
      productSlug ? 'pagina-de-produto' : 'cta-geral',
      inicial ? { item_id: inicial.slug, item_name: inicial.name } : undefined,
    );
  }, [open, productSlug]);

  /* Enquanto o pop-up está aberto, trava o scroll da página atrás. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /** Monta a entrada do carrinho, já com a variante marcada quando é única. */
  function entryFor(next: string): CartEntry | undefined {
    const produto = products.find((p) => p.slug === next);
    if (!produto) return undefined;
    const cfg = findQuoteProduct(next);
    return {
      slug: next,
      name: produto.name,
      /* Variante única não tem o que escolher: já entra marcada. */
      options: cfg?.options.length === 1 ? [cfg.options[0]!.id] : [],
    };
  }

  /* Montar e desmontar o pedido não emite evento de medição: `add_to_cart` e
     `remove_from_cart` foram retirados a pedido de quem lê os relatórios. O
     funil continua medido nas duas pontas que importam — `begin_checkout` na
     abertura do pop-up e `generate_lead` no envio. Os helpers seguem em
     `lib/analytics.ts` para o caso de os eventos voltarem. */
  function addProduct(next: string) {
    const entry = entryFor(next);
    if (!entry || cart.some((c) => c.slug === next)) return;
    setCart((prev) => [...prev, entry]);
    setSlug(''); // libera o seletor para o próximo produto
  }

  function removeProduct(next: string) {
    setCart((prev) => prev.filter((c) => c.slug !== next));
  }

  function toggleOption(productSlugKey: string, optionId: string, on: boolean) {
    setCart((prev) =>
      prev.map((c) =>
        c.slug === productSlugKey
          ? {
              ...c,
              options: on
                ? [...c.options, optionId]
                : c.options.filter((o) => o !== optionId),
            }
          : c,
      ),
    );
  }

  /**
   * Revalida um campo que já estava com erro, conforme a pessoa digita.
   *
   * Só limpa, nunca acusa: marcar um e-mail como inválido enquanto ele está
   * pela metade é acusar o visitante de um erro que ele ainda não cometeu. O
   * erro só nasce no envio ou ao sair do campo.
   */
  function revalidar(campo: CampoComErro) {
    setErros((prev) => {
      if (!prev[campo]) return prev;
      const form = ref.current?.querySelector('form');
      if (!form) return prev;
      const agora = validar(lerCampos(form));
      if (agora[campo]) return prev; // continua inválido: mantém a mensagem
      const { [campo]: _resolvido, ...resto } = prev;
      return resto;
    });
  }

  /** Marca o campo ao sair dele, se estiver inválido. */
  function validarAoSair(campo: CampoComErro) {
    const form = ref.current?.querySelector('form');
    if (!form) return;
    const erro = validar(lerCampos(form))[campo];
    setErros((prev) => {
      if (!erro) {
        if (!prev[campo]) return prev;
        const { [campo]: _resolvido, ...resto } = prev;
        return resto;
      }
      return prev[campo] === erro ? prev : { ...prev, [campo]: erro };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    /* `noValidate` desliga o balão do navegador, que saía no idioma do
       navegador — "Please fill out this field" num formulário em português — e
       sumia ao primeiro clique. A checagem acontece aqui e o erro fica escrito
       ao lado do campo, em português, até ser corrigido. */
    const achados = validar(lerCampos(form));
    if (Object.keys(achados).length) {
      setErros(achados);
      /* Foco no primeiro campo inválido de cima para baixo — não no primeiro
         que a validação encontrou. Em tela pequena o campo pode estar fora da
         área visível, e o `scrollIntoView` é o que o traz junto com o foco. */
      const primeiro = ORDEM_DOS_CAMPOS.find((c) => achados[c]);
      if (primeiro) {
        const el = campoDoForm(form, primeiro);
        el?.focus();
        el?.scrollIntoView({ block: 'center' });
      }
      return;
    }
    setErros({});

    const data = Object.fromEntries(new FormData(form));

    /* `produto` continua existindo como texto legível — é o que aparece no
       cabeçalho do e-mail e serve de fallback no reconhecimento do backend.
       Com vários produtos vira uma lista; cada quantidade já carrega o nome
       do seu produto no próprio rótulo. */
    data.produto = cart.map((c) => c.name).join(', ');

    /* Identificadores de campanha junto com o pedido: é o que permite à API
       atribuir a conversão server-side ao anúncio que a gerou. */
    Object.assign(data, identificadoresDeCampanha());

    setStatus('sending');
    setMessage('');

    try {
      const res = await fetch(`${ENDPOINT}/api/contato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        leadId?: string;
        /* Valor estimado do pedido, calculado pela tabela de preços no
           servidor. O navegador não conhece os preços. */
        valor?: number;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Não foi possível enviar sua solicitação.');
      }
      /* Conversão. `lead_id` vem do backend e repete no evento do servidor,
         para o GTM server-side deduplicar em vez de contar duas vezes. */
      /* O evento carrega valor e lead_id; a tag de conversão do Ads escuta
         `generate_lead` no container e usa os dois — o valor para o lance por
         valor, o id para não contar o mesmo lead duas vezes. */
      enviarLead({
        leadId: body.leadId,
        valor: body.valor,
        estado: typeof data.estado === 'string' ? data.estado : undefined,
        produtos: cart.map((c) => c.name).join(', '),
        itens: cart.map((c) => ({ item_id: c.slug, item_name: c.name, quantity: 1 })),
      });

      setStatus('sent');
      form.reset();
    } catch (err) {
      const motivo = err instanceof Error ? err.message : 'falha desconhecida';
      // Separa abandono de falha técnica: sem isso os dois viram o mesmo buraco
      // no funil.
      falhaNoEnvio(motivo);
      setStatus('error');
      setMessage(
        err instanceof Error ? err.message : 'Não foi possível enviar sua solicitação.',
      );
    }
  }

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="quote-title"
      /* Fecha ao clicar fora ou no Esc, mantendo o estado do React em sincronia. */
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {status === 'sent' ? (
        <div className={s.result}>
          <span className={s.resultIcon}>
            <Icon name="check" size={30} strokeWidth={2.4} />
          </span>
          <h2 className={s.resultTitle}>Solicitação enviada</h2>
          <p className={s.resultText}>
            Recebemos seus dados. Nossa equipe comercial entrará em contato para
            orientar você sobre produtos, aplicações e fornecimento.
          </p>
          <div style={{ paddingTop: 8 }}>
            <Button type="button" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className={s.head}>
            <LogoMark size={44} tone="dark" />
            <h2 id="quote-title" className={s.title}>
              Solicitar orçamento
            </h2>
            <p className={s.subtitle}>
              Informe os dados abaixo e nossa equipe retorna com a proposta.
            </p>
            <button
              type="button"
              className={s.close}
              onClick={onClose}
              aria-label="Fechar"
            >
              <Icon name="close" size={20} strokeWidth={2} />
            </button>
          </div>

          <div className={s.body} data-corpo>
            {/* Isca para robôs: humano nunca vê, logo nunca preenche. */}
            <div className={s.hp} aria-hidden="true">
              <label htmlFor="q-empresa-site">Não preencha</label>
              <input id="q-empresa-site" name="empresa_site" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Os ids form-field-Nome / form-field-Email / form-field-phone
                nao seguem o padrao do resto do formulario de proposito: o
                rastreamento de midia le esses campos por seletor CSS, e os
                nomes vem do formulario do site anterior (Elementor).
                Renomear quebra a captura de lead das campanhas. */}
            <div className={s.grid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="form-field-Nome">
                  Nome <span className={s.required}>*</span>
                </label>
                <input
                  className={s.input}
                  id="form-field-Nome"
                  name="nome"
                  required
                  autoComplete="name"
                  maxLength={LIMITES.nome}
                  placeholder="Digite seu nome"
                  aria-invalid={erros.nome ? true : undefined}
                  aria-describedby={erros.nome ? idDoErro('nome') : undefined}
                  onBlur={() => validarAoSair('nome')}
                  onInput={() => revalidar('nome')}
                />
                <Erro campo="nome" texto={erros.nome} />
              </div>

              <div className={s.field}>
                <label className={s.label} htmlFor="q-empresa">
                  Empresa <span className={s.required}>*</span>
                </label>
                <input
                  className={s.input}
                  id="q-empresa"
                  name="empresa"
                  required
                  autoComplete="organization"
                  maxLength={LIMITES.empresa}
                  placeholder="Razão social"
                  aria-invalid={erros.empresa ? true : undefined}
                  aria-describedby={erros.empresa ? idDoErro('empresa') : undefined}
                  onBlur={() => validarAoSair('empresa')}
                  onInput={() => revalidar('empresa')}
                />
                <Erro campo="empresa" texto={erros.empresa} />
              </div>

              <div className={s.field}>
                <label className={s.label} htmlFor="form-field-Email">
                  E-mail <span className={s.required}>*</span>
                </label>
                <input
                  className={s.input}
                  id="form-field-Email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={LIMITES.email}
                  placeholder="Digite um e-mail válido"
                  aria-invalid={erros.email ? true : undefined}
                  aria-describedby={erros.email ? idDoErro('email') : undefined}
                  onBlur={() => validarAoSair('email')}
                  onInput={() => revalidar('email')}
                />
                <Erro campo="email" texto={erros.email} />
              </div>

              <div className={s.field}>
                <label className={s.label} htmlFor="form-field-phone">
                  DDD + Telefone
                </label>
                {/* Sem `maxLength` aqui, de propósito — e isto é o oposto do
                    que parece certo.

                    `maxLength` conta caracteres JÁ formatados (15, de
                    "(21) 99999-9999"), mas o texto colado chega cru e mais
                    longo: "+55 (21) 99999-8888" tem 19. O navegador corta em
                    15 ANTES de qualquer handler rodar, então a máscara recebia
                    "+55 (21) 99999-" — nove dígitos, com o código do país já
                    impossível de distinguir do DDD — e produzia
                    "(55) 2199-999", que o servidor recusa. Medido: com o
                    atributo, "(55) 2199-999"; sem ele, "(21) 99999-8888".

                    Quem garante o limite é a máscara, que corta em 11 dígitos
                    na origem e nunca escreve mais de 15 caracteres no campo.
                    O atributo seria redundante no melhor caso e destrutivo no
                    pior. `LIMITES.telefone` continua sendo o teto que a
                    máscara respeita. */}
                <input
                  className={s.input}
                  id="form-field-phone"
                  name="telefone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(21) 99999-9999"
                  aria-invalid={erros.telefone ? true : undefined}
                  aria-describedby={erros.telefone ? idDoErro('telefone') : undefined}
                  onBlur={() => validarAoSair('telefone')}
                  onInput={(e) => {
                    const alvo = e.currentTarget;
                    const anterior = alvo.value;
                    const cursor = alvo.selectionStart ?? anterior.length;
                    const formatado = formatarTelefone(anterior);
                    if (formatado !== anterior) {
                      alvo.value = formatado;
                      /* Reposicionar o cursor é obrigatório aqui: reescrever
                         `value` joga o cursor para o fim do campo, e corrigir
                         um dígito no meio de um número já preenchido ficava
                         impossível — o dígito seguinte ia para o final. */
                      const destino = cursorDepoisDaMascara(formatado, anterior, cursor);
                      alvo.setSelectionRange(destino, destino);
                    }
                    revalidar('telefone');
                  }}
                />
                <Erro campo="telefone" texto={erros.telefone} />
              </div>

              {/* O estado define o frete: CIF no Sudeste a partir de R$ 1.000,
                  FOB no resto. Sem ele a proposta não sai calculada. */}
              <div className={s.field}>
                <label className={s.label} htmlFor="q-estado">
                  Estado de entrega <span className={s.required}>*</span>
                </label>
                <select
                  className={s.select}
                  id="q-estado"
                  name="estado"
                  required
                  defaultValue=""
                  aria-invalid={erros.estado ? true : undefined}
                  aria-describedby={erros.estado ? idDoErro('estado') : undefined}
                  onBlur={() => validarAoSair('estado')}
                  /* Num <select> a escolha é definitiva no primeiro clique:
                     `change` já pode limpar o erro, sem esperar o blur. */
                  onChange={() => revalidar('estado')}
                >
                  <option value="">Selecione</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                <Erro campo="estado" texto={erros.estado} />
              </div>

              {/* ------------------------------------------------ pedido */}
              <div className={s.field}>
                <label className={s.label} htmlFor="q-produto">
                  Produtos de interesse
                </label>
                <div className={s.picker}>
                  <select
                    className={s.select}
                    id="q-produto"
                    value={slug}
                    onChange={(e) => {
                      /* Adiciona na hora da escolha: pedir um clique a mais
                         em "Adicionar" seria um passo sem função. */
                      if (e.target.value) addProduct(e.target.value);
                    }}
                  >
                    <option value="">
                      {cart.length ? 'Adicionar outro produto…' : 'Selecione um produto'}
                    </option>
                    {products.map((p) => (
                      <option
                        key={p.slug}
                        value={p.slug}
                        disabled={cart.some((c) => c.slug === p.slug)}
                      >
                        {p.name}
                        {cart.some((c) => c.slug === p.slug) ? ' — já adicionado' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {!cart.length ? (
                  <p className={s.hint}>
                    Você pode incluir quantos produtos precisar na mesma solicitação.
                  </p>
                ) : null}
              </div>

              {/* Um cartão por produto do pedido. */}
              {cart.map((entry) => {
                const cfg = findQuoteProduct(entry.slug);
                const unica = cfg?.options.length === 1;
                return (
                  <div key={entry.slug} className={s.cartItem}>
                    <div className={s.cartHead}>
                      <span className={s.cartName}>{entry.name}</span>
                      <button
                        type="button"
                        className={s.cartRemove}
                        onClick={() => removeProduct(entry.slug)}
                        aria-label={`Remover ${entry.name} do pedido`}
                      >
                        <Icon name="close" size={15} strokeWidth={2.2} />
                      </button>
                    </div>

                    {cfg ? (
                      <div className={s.cartBody}>
                        {cfg.intro ? (
                          <p className={s.optionsIntro}>{cfg.intro}</p>
                        ) : null}

                        {cfg.options.map((opt) => {
                          const active = unica || entry.options.includes(opt.id);
                          return (
                            <div key={opt.id} className={s.option}>
                              {unica ? (
                                <div
                                  className={s.optionHead}
                                  style={{ cursor: 'default' }}
                                >
                                  {opt.label}
                                </div>
                              ) : (
                                <label className={s.optionHead}>
                                  <input
                                    type="checkbox"
                                    name={`item:${entry.name} — ${opt.label}`}
                                    checked={active}
                                    onChange={(e) =>
                                      toggleOption(entry.slug, opt.id, e.target.checked)
                                    }
                                  />
                                  {opt.label}
                                </label>
                              )}

                              {active ? (
                                <div className={s.optionBody}>
                                  {opt.fields.map((f) => (
                                    <QuantityInput
                                      key={f.name}
                                      field={f}
                                      product={entry.name}
                                      option={opt.label}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Produto sem configuração de quantidade: entra no
                         pedido mesmo assim, para a equipe cotar. */
                      <div className={s.cartBody}>
                        <p className={s.optionsIntro}>
                          Nossa equipe entrará em contato para dimensionar a
                          quantidade.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={s.field}>
                <label className={s.label} htmlFor="q-mensagem">
                  Observações
                </label>
                <textarea
                  className={s.textarea}
                  id="q-mensagem"
                  name="mensagem"
                  rows={3}
                  maxLength={LIMITES.mensagem}
                  placeholder="Descreva a aplicação, o cenário da operação ou qualquer detalhe relevante."
                />
              </div>

              {status === 'error' ? (
                <div className={s.alert} role="alert">
                  <Icon name="alert" size={17} />
                  <span>{message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={s.footer}>
            <label className={s.consent}>
              <input type="checkbox" name="consentimento" defaultChecked />
              Aceito receber contato e comunicações técnicas por e-mail.
            </label>
            <Button
              type="submit"
              size="lg"
              fullWidth
              iconRight="arrow-right"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ campos */

/**
 * Lê os campos validados direto do DOM.
 *
 * O formulário é não-controlado de propósito — é o que deixa o autofill do
 * navegador funcionar e o que faz `form.reset()` limpar tudo de uma vez. Então
 * a validação lê os valores na hora, em vez de manter uma cópia em estado que
 * o autofill não atualizaria.
 */
function lerCampos(form: HTMLFormElement): Record<CampoComErro, string> {
  /* Busca por `id` e não por `name`: `elements.namedItem` devolve uma
     RadioNodeList quando há mais de um campo com o mesmo nome, e os nomes das
     quantidades são montados a partir do produto escolhido — um deles pode
     colidir. O `id` é único por definição. */
  const ler = (campo: CampoComErro) => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `#${ID_DO_CAMPO[campo]}`,
    );
    return el ? el.value : '';
  };
  return {
    nome: ler('nome'),
    empresa: ler('empresa'),
    email: ler('email'),
    telefone: ler('telefone'),
    estado: ler('estado'),
  };
}

/** Elementos dos campos validados, na ordem do formulário. */
function campoDoForm(form: HTMLFormElement, campo: CampoComErro) {
  return form.querySelector<HTMLElement>(`#${ID_DO_CAMPO[campo]}`);
}

/**
 * Mensagem de erro de um campo.
 *
 * `role="alert"` para o leitor de tela anunciar o erro quando ele aparece; o
 * `id` é o mesmo que o campo referencia em `aria-describedby`.
 */
function Erro({ campo, texto }: { campo: CampoComErro; texto?: string }) {
  if (!texto) return null;
  return (
    <p className={s.error} id={idDoErro(campo)} role="alert">
      {texto}
    </p>
  );
}

/** Campo de quantidade: número com unidade, ou três medidas para o tanque. */
function QuantityInput({
  field,
  product,
  option,
}: {
  field: QuantityField;
  product: string;
  option: string;
}) {
  if (field.kind === 'dimensions') {
    return (
      <div>
        <div className={s.dims}>
          {[
            { k: 'c', label: 'Comprimento' },
            { k: 'l', label: 'Largura' },
            { k: 'a', label: 'Altura' },
          ].map((d) => (
            <label key={d.k} className={s.dimBox}>
              <span>{d.label}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                name={fieldName(product, option, d.label, field.unit)}
                placeholder={field.unit}
              />
            </label>
          ))}
        </div>
        {field.hint ? <p className={s.hint}>{field.hint}</p> : null}
      </div>
    );
  }

  /* O nome do campo vira o rótulo da linha no e-mail — e é por ele que o
     backend reconhece o produto quando o pedido tem vários. */
  const name = fieldName(product, option, field.label, field.unit);

  return (
    <div>
      <div className={s.qty}>
        <input
          type="number"
          inputMode="numeric"
          min={field.min}
          step={field.step}
          name={name}
          placeholder={field.placeholder}
          aria-label={`${product} — ${option} — ${field.label} em ${field.unit}`}
        />
        <span className={s.qtyUnit}>{field.unit}</span>
      </div>
      {field.hint ? <p className={s.hint}>{field.hint}</p> : null}
    </div>
  );
}
