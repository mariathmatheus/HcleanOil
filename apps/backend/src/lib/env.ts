import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as carregarEnv } from 'dotenv';
import { z } from 'zod';

/*
 * Configuração em duas camadas.
 *
 * `.env` fica de fora do git porque guarda senha de SMTP e chaves de API, e o
 * repositório é público. O efeito colateral era que toda configuração NÃO
 * secreta — endereço do servidor de e-mail, para quem vai a cópia dos leads —
 * também não viajava: um `git pull` no servidor trazia o código novo e deixava
 * a configuração velha para trás, sem ninguém perceber até os leads pararem.
 *
 * Então o que não é segredo vive em `.env.producao`, versionado, e o `.env`
 * guarda só o que não pode ser publicado.
 *
 * `.env.producao` vem primeiro e com `override`, de propósito: o `.env` de
 * cada servidor já existia antes desta separação e carrega valores antigos
 * dos mesmos campos. Se o `.env` vencesse, um `git pull` continuaria não
 * corrigindo nada — que é exatamente o problema que esta separação existe
 * para resolver. Quem precisa de valor diferente numa máquina define a
 * variável no ambiente, que vence os dois.
 */
/* Os caminhos saem da localização deste módulo, e não do diretório de
   trabalho: dentro do container o processo sobe de `/app` com o código em
   `/app/dist`, e um caminho relativo silenciosamente não encontrava nada.
   Procura na raiz do serviço e um nível acima, que cobre rodar do fonte e
   rodar do build. */
const aqui = dirname(fileURLToPath(import.meta.url));
const candidatos = [
  resolve(aqui, '../../.env.producao'),
  resolve(aqui, '../.env.producao'),
  resolve(process.cwd(), '.env.producao'),
];

const encontrado = candidatos.find((caminho) => existsSync(caminho));
if (encontrado) {
  carregarEnv({ path: encontrado, override: true });
} else {
  /* Não interrompe: em desenvolvimento o `.env` sozinho basta. Mas avisa alto,
     porque em produção este arquivo ausente significa configuração velha
     valendo — foi assim que o formulário passou a responder sucesso sem que
     nenhum e-mail saísse. */
  console.warn(
    '[env] .env.producao não encontrado; valendo apenas o .env local.',
    `Procurado em: ${candidatos.join(', ')}`,
  );
}

carregarEnv();

/**
 * Configuração do serviço. Validada na subida: melhor o processo não iniciar
 * do que descobrir uma senha SMTP ausente no primeiro lead perdido.
 */
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SMTP_HOST: z.string().min(1, 'SMTP_HOST é obrigatório'),
  SMTP_PORT: z.coerce.number().default(587),
  /* TLS implícito (465) ou STARTTLS (587). Vazio segue a porta, mas dá para
     forçar: em redes com inspeção de TLS a 465 é cortada e só a 587 passa. */
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  /**
   * Nome usado na validação do certificado TLS (SNI), quando difere de
   * SMTP_HOST.
   *
   * Existe porque o apelido do servidor de e-mail pode estar atrás de um
   * proxy que não encaminha SMTP. Nesse caso a conexão vai pelo endereço do
   * servidor de e-mail, que não é proxeado, e o certificado continua sendo
   * conferido contra o nome que ele realmente cobre. Sem isso a alternativa
   * seria desligar a validação, o que exporia a senha a quem estivesse no
   * caminho.
   */
  SMTP_SERVERNAME: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  SMTP_USER: z.string().min(1, 'SMTP_USER é obrigatório'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS é obrigatório'),

  /** Remetente exibido. Deve ser um endereço autorizado pelo servidor SMTP. */
  MAIL_FROM: z.string().email('MAIL_FROM precisa ser um e-mail válido'),
  MAIL_FROM_NAME: z.string().default('HCLEAN'),

  /** Caixa que recebe os leads do formulário. */
  MAIL_TO: z.string().email('MAIL_TO precisa ser um e-mail válido'),

  /**
   * Cópia oculta de tudo que sai: notificação, confirmação e proposta.
   *
   * Fica oculta de propósito — o cliente que recebe a confirmação não vê
   * este endereço. Vazio ou ausente desliga a cópia.
   */
  /* Aceita mais de um endereço, separados por vírgula: a equipe quer a cópia
     na caixa do domínio e também numa conta de apoio, e antes só cabia um. */
  MAIL_BCC: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .superRefine((v, ctx) => {
      if (!v) return;
      for (const parte of v.split(',')) {
        const email = parte.trim();
        if (!email) continue;
        if (!z.string().email().safeParse(email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `MAIL_BCC tem um e-mail inválido: ${email}`,
          });
        }
      }
    }),

  /** Envia confirmação para quem preencheu o formulário. */
  SEND_CONFIRMATION: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  /**
   * Gera e envia a proposta em PDF logo após a confirmação.
   *
   * Quando o pedido tem item sem preço de tabela (hoje só o tanque), a
   * proposta vai apenas para a equipe, que completa os valores à mão.
   */
  ENVIAR_PROPOSTA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  /** Onde salvar o contador de numeração das propostas. */
  PROPOSTAS_DIR: z.string().default('propostas'),

  /**
   * Número da última proposta emitida manualmente, para a numeração
   * automática continuar de onde parou em vez de recomeçar do 1.
   */
  PROPOSTA_INICIAL: z.coerce.number().default(0),

  /**
   * Janela de atraso do envio da proposta, em segundos.
   *
   * A proposta fica pronta em segundos, e uma cotação instantânea denuncia
   * que ninguém olhou o pedido. O atraso é sorteado dentro desta janela a
   * cada pedido: um valor fixo teria a mesma cara de automação.
   *
   * Zerar os dois desliga o atraso e a proposta volta a sair na hora.
   */
  PROPOSTA_ATRASO_MIN_S: z.coerce.number().min(0).default(300),
  PROPOSTA_ATRASO_MAX_S: z.coerce.number().min(0).default(600),

  /** Prazo de entrega exibido nas condições da proposta. */
  PRAZO_ENTREGA: z.string().default('a combinar'),

  /**
   * Medição server-side (Stape, GTM server-side ou Measurement Protocol).
   *
   * O evento do navegador não chega quando um bloqueador barra o script, e é
   * justamente no tráfego pago que eles são mais comuns. O servidor manda o
   * lead direto, e o `lead_id` repetido nos dois caminhos deixa o container
   * deduplicar em vez de contar duas vezes.
   *
   * Vazio desliga o envio: o site e o formulário seguem funcionando.
   */
  SGTM_URL: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().replace(/\/$/, '') : undefined)),

  /**
   * Valor atribuído a um lead cujo pedido não tem preço de tabela.
   *
   * O Google Ads precisa de um número para otimizar por valor de conversão.
   * Zero desligaria o lance por valor justamente para o tanque e os pedidos
   * grandes sob cotação, que são os de maior ticket. Um valor de referência
   * conservador mantém esses leads no jogo sem inflar o retorno declarado.
   */
  VALOR_LEAD_SEM_PRECO: z.coerce.number().min(0).default(1500),

  /** Chave opcional exigida pelo container server-side, se houver. */
  SGTM_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  /** Origens liberadas no CORS, separadas por vírgula. */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`Configuração inválida:\n${issues}\n\nVeja .env.example.`);
  process.exit(1);
}

export const env = parsed.data;
