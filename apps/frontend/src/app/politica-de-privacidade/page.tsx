import type { Metadata } from 'next';
import { Container, Section } from '@/components/ui/Layout';
import { Hero, HeroCopy, HeroTitle, HeroLead } from '@/components/sections/Shared';
import { Ornament, ornamentHost } from '@/components/sections/Ornament';
import { site } from '@/data/site';
import s from './privacidade.module.css';

/**
 * Política de Privacidade (LGPD, Lei 13.709/2018).
 *
 * O texto descreve o que o CÓDIGO deste repositório realmente faz, campo por
 * campo — não um modelo genérico. Cada afirmação aqui tem origem verificável:
 *
 *   - campos coletados ......... components/quote/QuoteModal.tsx e, no
 *                                backend, lib/schema.ts (`contactSchema`)
 *   - destino do formulário .... backend routes/contato.ts
 *   - guarda em disco .......... backend leads/fila.ts (`VALIDADE_MS`, 7 dias)
 *   - cópia ao operador ........ MAIL_BCC em backend lib/mailer.ts, aplicado a
 *                                TODO envio por valor padrão do parâmetro
 *   - dado enviado ao Google ... backend lib/medicao.ts (`user_data`: nome,
 *                                e-mail, telefone, IP e user-agent)
 *   - identificadores .......... lib/analytics.ts (UTMS e CLIQUES)
 *   - cookies e consentimento .. components/analytics/Consent.tsx, lib/ads.ts
 *
 * Se qualquer um desses arquivos mudar o que coleta, para onde manda ou por
 * quanto tempo guarda, ESTE TEXTO precisa mudar no mesmo commit. Uma política
 * que descreve um comportamento que o código não tem mais é pior do que
 * nenhuma: deixa de ser informação e passa a ser declaração falsa ao titular.
 *
 * O que NÃO está aqui, de propósito: não há promessa de certificação, de ISO,
 * de criptografia em repouso nem de qualquer controle de segurança que o
 * código não demonstre. O que existe (TLS no transporte, limite de 5 envios
 * por IP a cada 15 min em routes/contato.ts) está dito como é, sem adjetivo.
 *
 * O Microsoft Clarity ESTÁ declarado, e é bom entender por quê: procurar por
 * ele no repositório não encontra nada, porque ele não vem do nosso código —
 * entra pelo container do GTM. Medido no navegador contra o site no ar: sete
 * requisições a `clarity.ms`, mais a sincronia com o Bing. Gravação de sessão
 * é o tratamento mais sensível que este site faz, então declarar o que o
 * código mostra, e não o que o site de fato carrega, seria omissão.
 *
 * A lição vale para o resto do documento: o que é servido ao visitante inclui
 * o que o container injeta. Se uma tag nova entrar lá, esta página precisa
 * acompanhar.
 *
 * As lacunas de identificação jurídica (CNPJ, endereço) ficam como marcador
 * visível `[... a preencher]`, não como texto plausível: inventar um CNPJ num
 * documento legal é pior do que deixá-lo em branco, e o marcador amarelo
 * garante que ninguém o publique sem perceber.
 */

/** Data da última revisão do texto. Atualizar A MÃO quando o conteúdo mudar. */
const ATUALIZADO_EM = '3 de outubro de 2026';

/* O índice e os títulos saem da mesma lista: o link do índice e o `id` do
   bloco não podem divergir, e manter os dois à mão garantia que um dia
   divergiriam. */
const SECOES = [
  { id: 'quem-somos', titulo: 'Quem é o controlador dos seus dados' },
  { id: 'dados', titulo: 'Quais dados coletamos' },
  { id: 'finalidades', titulo: 'Para que usamos e com que base legal' },
  { id: 'compartilhamento', titulo: 'Com quem compartilhamos' },
  { id: 'cookies', titulo: 'Cookies e tecnologias de medição' },
  { id: 'retencao', titulo: 'Por quanto tempo guardamos' },
  { id: 'direitos', titulo: 'Seus direitos como titular' },
  { id: 'seguranca', titulo: 'Segurança' },
  { id: 'menores', titulo: 'Crianças e adolescentes' },
  { id: 'alteracoes', titulo: 'Alterações nesta política' },
  { id: 'contato', titulo: 'Como falar com a gente' },
] as const;

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como a HCLEAN coleta, usa, compartilha e protege os dados pessoais de quem solicita orçamento ou navega no site, conforme a LGPD (Lei 13.709/2018).',
  alternates: { canonical: '/politica-de-privacidade' },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <Hero>
        <HeroCopy>
          <HeroTitle>Política de Privacidade</HeroTitle>
          <HeroLead>
            Esta página explica, em linguagem direta, quais dados pessoais a HCLEAN
            coleta neste site, por que coleta, com quem compartilha, por quanto tempo
            guarda e como você pede acesso, correção ou exclusão.
          </HeroLead>
        </HeroCopy>
      </Hero>

      <Section tone="page" className={ornamentHost}>
        <Ornament shape="wave" place="left" />
        <Container>
          <div className={s.coluna}>
            <p className={s.vigencia}>Última atualização: {ATUALIZADO_EM}.</p>

            <nav aria-label="Seções desta política" style={{ marginTop: 24 }}>
              <ul className={s.indice}>
                {SECOES.map((sec) => (
                  <li key={sec.id}>
                    <a href={`#${sec.id}`}>{sec.titulo}</a>
                  </li>
                ))}
              </ul>
            </nav>

            <div style={{ marginTop: 48 }}>
              {/* --------------------------------------------- controlador */}
              <section className={s.bloco} id="quem-somos">
                <h2>1. Quem é o controlador dos seus dados</h2>
                <p>
                  O controlador dos dados pessoais tratados neste site é a{' '}
                  <strong>{site.legalName}</strong>, inscrita no CNPJ{' '}
                  <span className={s.pendente}>[CNPJ a preencher]</span>, com sede em{' '}
                  <span className={s.pendente}>[endereço a preencher]</span>.
                </p>
                <p>
                  &ldquo;Controlador&rdquo;, na LGPD, é quem decide o que se faz com o
                  dado. Quando você pede um orçamento neste site, é a HCLEAN quem
                  decide — e por isso é a HCLEAN que responde por essas decisões
                  perante você.
                </p>
                <p>
                  Para falar sobre privacidade, use{' '}
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>. A
                  designação formal de um encarregado pelo tratamento de dados
                  pessoais (art. 41 da LGPD) está{' '}
                  <span className={s.pendente}>[encarregado a designar]</span>; até
                  que seja publicada aqui, esse e-mail é o canal oficial e as
                  solicitações recebidas por ele são atendidas nos mesmos prazos.
                </p>
              </section>

              {/* ---------------------------------------------------- dados */}
              <section className={s.bloco} id="dados">
                <h2>2. Quais dados coletamos</h2>

                <h3>2.1 Dados que você mesmo informa</h3>
                <p>
                  Pelo formulário de orçamento do site. Os campos obrigatórios são
                  nome, empresa e e-mail; os demais são opcionais e o formulário
                  funciona sem eles.
                </p>
                <ul className={s.lista}>
                  <li>
                    <strong>Nome</strong> e <strong>empresa</strong> — obrigatórios,
                    para sabermos com quem falamos.
                  </li>
                  <li>
                    <strong>E-mail</strong> — obrigatório, é por onde a resposta sai.
                  </li>
                  <li>
                    <strong>Telefone</strong> — opcional. Quem prefere ser contatado
                    só por e-mail pode deixar em branco.
                  </li>
                  <li>
                    <strong>Estado de entrega</strong> — opcional, define o frete na
                    cotação.
                  </li>
                  <li>
                    <strong>Produtos e quantidades</strong> do pedido, e a{' '}
                    <strong>mensagem</strong> que você escrever.
                  </li>
                </ul>
                <p>
                  Não pedimos CPF, RG, dados bancários nem qualquer dado sensível
                  (origem racial, saúde, biometria, opinião política, convicção
                  religiosa). Pedimos que você também não os escreva no campo de
                  mensagem — ele é livre, mas não é o lugar para isso.
                </p>

                <h3>2.2 Dados de navegação e de campanha</h3>
                <p>
                  Coletados automaticamente quando você acessa o site, sujeitos à sua
                  escolha de cookies (seção 5):
                </p>
                <ul className={s.lista}>
                  <li>
                    <strong>Páginas visitadas</strong>, páginas de produto abertas,
                    cliques em orçamento, telefone, e-mail e WhatsApp.
                  </li>
                  <li>
                    <strong>Identificadores de campanha</strong> presentes no
                    endereço de origem: <code>utm_source</code>,{' '}
                    <code>utm_medium</code>, <code>utm_campaign</code>,{' '}
                    <code>utm_term</code>, <code>utm_content</code>,{' '}
                    <code>utm_id</code>, e os identificadores de clique em anúncio{' '}
                    <code>gclid</code>, <code>gbraid</code>, <code>wbraid</code>,{' '}
                    <code>fbclid</code> e <code>msclkid</code>. Ficam guardados no
                    seu navegador durante a visita (<em>sessionStorage</em>, apagado
                    ao fechar a aba) e, se você enviar o formulário, seguem junto com
                    ele — é como sabemos de qual anúncio ou busca o pedido veio.
                  </li>
                  <li>
                    <strong>Endereço IP</strong> e <strong>identificação do
                    navegador</strong> (user-agent), recebidos pelo servidor em
                    qualquer requisição e usados na medição de conversão descrita na
                    seção 4.
                  </li>
                  <li>
                    <strong>Identificador de medição</strong> do Google Analytics
                    (cookie <code>_ga</code>), quando você aceita cookies de
                    estatística.
                  </li>
                </ul>
                <p>
                  Usamos também o <strong>Microsoft Clarity</strong>, que grava a
                  navegação na página — movimento do ponteiro, rolagem e cliques — e
                  monta mapas de calor, para entendermos onde a navegação trava. O
                  Clarity mascara por padrão o conteúdo dos campos de formulário, de
                  modo que o que você digita antes de enviar não é capturado. A
                  Microsoft é operadora desses dados e aplica também a política de
                  privacidade dela, que inclui o uso dos cookies de identificação da
                  própria Microsoft e do Bing.
                </p>
                <p>
                  Sendo transparente sobre uma limitação atual: o Clarity começa a
                  gravar assim que a página abre, <strong>antes</strong> de você
                  responder ao aviso de cookies. Estamos ajustando isso para que ele
                  passe a respeitar a sua escolha, como as demais ferramentas de
                  medição já fazem. Até lá, se preferir não ser gravado, o bloqueio
                  pelo navegador ou uma extensão de privacidade impede o
                  carregamento.
                </p>

                <h3>2.3 Contato por WhatsApp</h3>
                <p>
                  O botão de WhatsApp abre uma conversa com o número comercial da
                  HCLEAN no aplicativo ou site do WhatsApp. A partir desse ponto, o
                  tratamento das mensagens, do seu número e da sua foto de perfil
                  segue também a política de privacidade do WhatsApp (Meta), sobre a
                  qual a HCLEAN não tem controle. Do nosso lado, guardamos a conversa
                  como atendimento comercial.
                </p>
              </section>

              {/* ----------------------------------------------- finalidades */}
              <section className={s.bloco} id="finalidades">
                <h2>3. Para que usamos e com que base legal</h2>
                <p>
                  A LGPD exige uma base legal para cada finalidade. Não usamos
                  consentimento como base para tudo: responder ao seu pedido de
                  orçamento não depende de consentimento, e dizer que depende seria
                  impreciso. Veja o que vale para cada caso:
                </p>
                {/* `tabindex={0}` e `role="group"`: o envelope rola de lado
                    (no telefone esconde 372px dos 720px da tabela, a coluna
                    "Base legal" inteira), e sem foco de teclado quem navega
                    sem mouse não tinha como alcançar essa rolagem — a base
                    legal de cada finalidade ficava inacessível. axe-core
                    acusava `scrollable-region-focusable` (serious). O `role`
                    com `aria-label` dá nome ao que recebe o foco, para o
                    leitor de tela não anunciar um grupo sem rótulo. */}
                <div
                  className={s.tabelaEnvelope}
                  tabIndex={0}
                  role="group"
                  aria-label="Base legal por finalidade (tabela rolável)"
                >
                  <table className={s.tabela}>
                    <thead>
                      <tr>
                        <th scope="col">Finalidade</th>
                        <th scope="col">Dados</th>
                        <th scope="col">Base legal (LGPD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Responder ao pedido de orçamento, cotar e
                          enviar a proposta</th>
                        <td>Nome, empresa, e-mail, telefone, estado, produtos,
                          mensagem</td>
                        <td>Procedimentos preliminares de contrato, a pedido do
                          titular — art. 7º, V</td>
                      </tr>
                      <tr>
                        <th scope="row">Confirmar o recebimento do pedido por e-mail</th>
                        <td>Nome, e-mail</td>
                        <td>Art. 7º, V</td>
                      </tr>
                      <tr>
                        <th scope="row">Guardar o pedido até a entrega à equipe
                          comercial</th>
                        <td>Todo o conteúdo do formulário</td>
                        <td>Art. 7º, V, e legítimo interesse em não perder a
                          solicitação — art. 7º, IX</td>
                      </tr>
                      <tr>
                        <th scope="row">Enviar comunicações técnicas e comerciais
                          além da resposta ao pedido</th>
                        <td>Nome, e-mail, telefone</td>
                        <td>Consentimento, pela caixa de seleção do formulário —
                          art. 7º, I</td>
                      </tr>
                      <tr>
                        <th scope="row">Medir audiência e entender o uso do site</th>
                        <td>Páginas, cliques, cookie de estatística</td>
                        <td>Consentimento, pelo aviso de cookies — art. 7º, I</td>
                      </tr>
                      <tr>
                        <th scope="row">Medir conversão de anúncios e exibir
                          remarketing</th>
                        <td>Identificadores de campanha e de clique, IP,
                          user-agent, e-mail, nome e telefone do formulário</td>
                        <td>Consentimento, pelo aviso de cookies — art. 7º, I</td>
                      </tr>
                      <tr>
                        <th scope="row">Proteger o formulário contra abuso e
                          spam</th>
                        <td>Endereço IP</td>
                        <td>Legítimo interesse — art. 7º, IX</td>
                      </tr>
                      <tr>
                        <th scope="row">Cumprir obrigação legal, fiscal ou
                          regulatória e defender direitos</th>
                        <td>Dados do negócio fechado</td>
                        <td>Obrigação legal — art. 7º, II; exercício de direitos em
                          processo — art. 7º, VI</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  A caixa <em>&ldquo;Aceito receber contato e comunicações técnicas
                  por e-mail&rdquo;</em> no formulário vem marcada e você pode
                  desmarcá-la antes de enviar. Desmarcada, nós ainda respondemos ao
                  seu pedido de orçamento — essa resposta é o motivo do contato, não
                  marketing —, mas não o incluímos em comunicações posteriores.
                </p>
              </section>

              {/* ------------------------------------------ compartilhamento */}
              <section className={s.bloco} id="compartilhamento">
                <h2>4. Com quem compartilhamos</h2>
                <p>
                  Não vendemos dados pessoais e não os cedemos para que terceiros
                  anunciem produtos próprios. O compartilhamento se limita a quem
                  opera a infraestrutura do site e do atendimento:
                </p>
                <ul className={s.lista}>
                  <li>
                    <strong>Google</strong> (Google Ireland Ltd. / Google LLC) — Google
                    Analytics, Google Ads e Google Tag Manager, para medir audiência e
                    conversão de anúncios. Quando você consente com cookies de
                    publicidade, a medição de uma conversão inclui{' '}
                    <strong>nome, e-mail e telefone informados no formulário</strong>,
                    além do IP e do user-agent, para que o Google reconheça a
                    conversão como vinda daquele clique. Esses dados passam primeiro
                    por um servidor de medição no próprio domínio da HCLEAN
                    (<code>api.hcleanoil.com.br</code>, operado com a plataforma
                    Stape), que é quem aplica o embaralhamento criptográfico (hash) do
                    e-mail e do telefone antes do repasse ao Google. Sem o seu
                    consentimento para cookies de publicidade, esse envio não ocorre.
                  </li>
                  <li>
                    <strong>Stape</strong> (Stape Inc.) — hospeda o servidor de
                    medição citado acima, que processa os eventos em trânsito.
                  </li>
                  <li>
                    <strong>Provedor de e-mail</strong> — transporta a notificação do
                    seu pedido para a nossa caixa comercial e a confirmação e a
                    proposta em PDF para você. O conteúdo do formulário trafega
                    nessas mensagens.
                  </li>
                  <li>
                    <strong>Provedor de hospedagem</strong> — mantém o site e o
                    servidor que recebe o formulário, incluindo o arquivo temporário
                    do pedido descrito na seção 6.
                  </li>
                  <li>
                    <strong>Cópia operacional</strong> — por configuração do sistema
                    de e-mail, uma <strong>cópia oculta de todas as mensagens
                    enviadas pelo site</strong> (notificação, confirmação e proposta)
                    pode ser endereçada a uma caixa de monitoramento do operador
                    técnico que mantém a aplicação, para diagnóstico de falha de
                    entrega. Essa caixa recebe, portanto, o mesmo conteúdo do seu
                    pedido, e o operador trata esses dados como operador na acepção
                    do art. 5º, VII da LGPD: apenas a pedido e em nome da HCLEAN.
                  </li>
                  <li>
                    <strong>WhatsApp / Meta</strong> — somente se você optar por nos
                    chamar por esse canal.
                  </li>
                  <li>
                    <strong>Autoridades públicas</strong> — quando houver requisição
                    legal, ordem judicial ou obrigação regulatória.
                  </li>
                </ul>
                <p>
                  <strong>Transferência internacional.</strong> Google, Stape e Meta
                  operam servidores fora do Brasil, de modo que parte desses dados é
                  tratada no exterior, nos termos dos arts. 33 e seguintes da LGPD. A
                  HCLEAN se vale das cláusulas contratuais e dos compromissos de
                  proteção de dados oferecidos por esses fornecedores.
                </p>
              </section>

              {/* -------------------------------------------------- cookies */}
              <section className={s.bloco} id="cookies">
                <h2>5. Cookies e tecnologias de medição</h2>
                <p>
                  Na sua primeira visita aparece um aviso no rodapé da tela com duas
                  opções: <em>&ldquo;Só os essenciais&rdquo;</em> e{' '}
                  <em>&ldquo;Aceitar todos&rdquo;</em>. Até você escolher,{' '}
                  <strong>nenhum cookie de estatística ou de publicidade é
                  gravado</strong> e nenhum identificador seu é enviado ao Google: as
                  tags carregam em modo restrito, com todos os sinais de
                  consentimento negados por padrão (Consent Mode v2 do Google).
                </p>
                <ul className={s.lista}>
                  <li>
                    <strong>Essenciais</strong> — fazem o site funcionar: guardam a
                    sua escolha de cookies no navegador e, durante a visita, os
                    identificadores de campanha. Não dependem de consentimento,
                    porque sem eles o site não entrega o que você pediu.
                  </li>
                  <li>
                    <strong>Estatística</strong> — Google Analytics 4. Mostram quais
                    páginas e produtos são procurados. Só com o seu consentimento.
                  </li>
                  <li>
                    <strong>Publicidade</strong> — Google Ads. Medem a conversão dos
                    anúncios e permitem apresentar nossos produtos a quem já visitou o
                    site. Só com o seu consentimento.
                  </li>
                </ul>
                <h3>Como recusar ou mudar de ideia</h3>
                <ul className={s.lista}>
                  <li>
                    No aviso de cookies, escolha <em>&ldquo;Só os
                    essenciais&rdquo;</em>: estatística e publicidade seguem negadas.
                  </li>
                  <li>
                    Para rever a escolha já feita, apague os dados deste site no seu
                    navegador (a escolha fica num registro local chamado{' '}
                    <code>hclean-consent</code>). O aviso reaparece na visita
                    seguinte e você escolhe de novo.
                  </li>
                  <li>
                    O seu navegador também permite bloquear ou apagar cookies por
                    site, nas configurações de privacidade.
                  </li>
                  <li>
                    Você pode desativar a personalização de anúncios do Google em{' '}
                    <a
                      href="https://myadcenter.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      myadcenter.google.com
                    </a>
                    .
                  </li>
                </ul>
                <p>
                  Recusar cookies de estatística e de publicidade não bloqueia
                  nenhuma parte do site: o catálogo, o formulário e o atendimento
                  funcionam igual.
                </p>
              </section>

              {/* -------------------------------------------------- retenção */}
              <section className={s.bloco} id="retencao">
                <h2>6. Por quanto tempo guardamos</h2>
                <ul className={s.lista}>
                  <li>
                    <strong>Arquivo temporário do pedido no servidor</strong> — o
                    pedido é gravado em disco no momento do envio, para não se perder
                    caso o e-mail falhe, e é apagado assim que a notificação é aceita
                    pelo servidor de e-mail. Se o envio continuar falhando, o arquivo
                    é descartado em <strong>até 7 dias</strong>.
                  </li>
                  <li>
                    <strong>E-mails do pedido e da proposta na caixa comercial</strong>{' '}
                    — mantidos enquanto durar a negociação e, depois dela, pelo prazo
                    necessário à defesa de direitos.
                  </li>
                  <li>
                    <strong>Dados de negócio fechado</strong> — pelos prazos fiscais e
                    legais aplicáveis, que em regra alcançam 5 anos.
                  </li>
                  <li>
                    <strong>Base de contatos para comunicações</strong> — até você
                    revogar o consentimento ou pedir a exclusão.
                  </li>
                  <li>
                    <strong>Identificadores de campanha no seu navegador</strong> —
                    apagados quando você fecha a aba.
                  </li>
                  <li>
                    <strong>Dados de medição no Google</strong> — pelos prazos de
                    retenção configurados nas ferramentas do Google, que também os
                    aplica agregadamente.
                  </li>
                </ul>
                <p>
                  Terminado o prazo e cumprida a finalidade, os dados são eliminados
                  ou anonimizados, salvo quando a lei exigir a guarda.
                </p>
              </section>

              {/* -------------------------------------------------- direitos */}
              <section className={s.bloco} id="direitos">
                <h2>7. Seus direitos como titular</h2>
                <p>
                  O art. 18 da LGPD lhe garante, a qualquer momento e sem custo,
                  pedir à HCLEAN:
                </p>
                <ul className={s.lista}>
                  <li>
                    <strong>Confirmação</strong> de que tratamos dados seus, e{' '}
                    <strong>acesso</strong> a eles.
                  </li>
                  <li>
                    <strong>Correção</strong> de dado incompleto, inexato ou
                    desatualizado.
                  </li>
                  <li>
                    <strong>Anonimização, bloqueio ou eliminação</strong> de dado
                    desnecessário, excessivo ou tratado em desconformidade com a lei.
                  </li>
                  <li>
                    <strong>Portabilidade</strong> a outro fornecedor, conforme a
                    regulamentação da ANPD.
                  </li>
                  <li>
                    <strong>Eliminação</strong> dos dados tratados com base no seu
                    consentimento, ressalvadas as hipóteses de guarda previstas em
                    lei.
                  </li>
                  <li>
                    <strong>Informação</strong> sobre com quem compartilhamos seus
                    dados (seção 4) e sobre a possibilidade de não consentir, com as
                    consequências da recusa (seção 5).
                  </li>
                  <li>
                    <strong>Revogação do consentimento</strong>, a qualquer momento.
                    Revogar não desfaz o que foi feito licitamente antes, e não afeta
                    o tratamento que tem outra base legal — responder ao seu pedido de
                    orçamento, por exemplo.
                  </li>
                  <li>
                    <strong>Oposição</strong> a tratamento fundado em legítimo
                    interesse.
                  </li>
                </ul>
                <h3>Como exercer</h3>
                <p>
                  Escreva para{' '}
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>{' '}
                  com o assunto <em>&ldquo;LGPD&rdquo;</em>, dizendo qual direito quer
                  exercer. Responderemos no menor prazo possível e, nos pedidos de
                  confirmação e acesso, nos prazos do art. 19 da LGPD: imediatamente,
                  em formato simplificado, ou em até 15 dias na declaração completa.
                </p>
                <p>
                  Para proteger você mesmo, podemos pedir informação adicional que
                  confirme a sua identidade antes de atender — não atenderíamos a um
                  pedido de exclusão feito por terceiro em seu nome.
                </p>
                <p>
                  Se não ficar satisfeito com a nossa resposta, você pode reclamar à{' '}
                  <a
                    href="https://www.gov.br/anpd/pt-br"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Autoridade Nacional de Proteção de Dados (ANPD)
                  </a>
                  .
                </p>
              </section>

              {/* ------------------------------------------------ segurança */}
              <section className={s.bloco} id="seguranca">
                <h2>8. Segurança</h2>
                <p>
                  Descrevemos aqui apenas as medidas que o site de fato aplica, sem
                  prometer certificação que não temos:
                </p>
                <ul className={s.lista}>
                  <li>
                    O site é servido por conexão criptografada (HTTPS/TLS), e o
                    formulário trafega por ela.
                  </li>
                  <li>
                    O formulário valida e limita o tamanho de cada campo antes de
                    qualquer processamento, e aplica limite de envios por endereço IP
                    para conter abuso automatizado.
                  </li>
                  <li>
                    O acesso à caixa comercial que recebe os pedidos é restrito à
                    equipe da HCLEAN.
                  </li>
                  <li>
                    O arquivo temporário do pedido no servidor é apagado assim que a
                    entrega se confirma (seção 6).
                  </li>
                </ul>
                <p>
                  Nenhum sistema é inviolável. Se ocorrer incidente de segurança com
                  risco ou dano relevante a você, comunicaremos você e a ANPD, como
                  manda o art. 48 da LGPD.
                </p>
              </section>

              {/* -------------------------------------------------- menores */}
              <section className={s.bloco} id="menores">
                <h2>9. Crianças e adolescentes</h2>
                <p>
                  Este site atende empresas e profissionais, e não é dirigido a
                  menores de 18 anos. Não coletamos dados de crianças e adolescentes
                  de forma consciente. Se identificarmos um registro assim, nós o
                  eliminamos — e, se você for responsável legal e suspeitar que isso
                  aconteceu, escreva para{' '}
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
                </p>
              </section>

              {/* ----------------------------------------------- alterações */}
              <section className={s.bloco} id="alteracoes">
                <h2>10. Alterações nesta política</h2>
                <p>
                  Esta política pode mudar quando o site passar a coletar outro dado,
                  usar outra ferramenta ou mudar uma finalidade. A data de
                  &ldquo;última atualização&rdquo; no topo da página indica a versão
                  vigente, e a versão publicada aqui é sempre a que vale. Se a mudança
                  exigir novo consentimento, pediremos a você de novo em vez de
                  presumir o anterior.
                </p>
              </section>

              {/* -------------------------------------------------- contato */}
              <section className={s.bloco} id="contato">
                <h2>11. Como falar com a gente</h2>
                <div className={s.destaque}>
                  <p>
                    <strong>{site.legalName}</strong>
                    <br />
                    CNPJ <span className={s.pendente}>[CNPJ a preencher]</span>
                    <br />
                    <span className={s.pendente}>[endereço a preencher]</span>
                  </p>
                  <p>
                    Privacidade e LGPD:{' '}
                    <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
                    <br />
                    Telefone: <a href={site.contact.phoneHref}>{site.contact.phone}</a>
                    <br />
                    Atendimento: {site.contact.hours}
                  </p>
                </div>
                <p className={s.vigencia}>
                  Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais) e Lei
                  nº 12.965/2014 (Marco Civil da Internet).
                </p>
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
