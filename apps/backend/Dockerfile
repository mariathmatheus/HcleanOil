# API do formulário de orçamento (Express + Playwright).
#
# A imagem base não é a `node:alpine` do frontend: a proposta em PDF é
# renderizada num Chromium via Playwright, e a imagem oficial já traz o
# navegador com todas as bibliotecas de sistema que ele exige. A tag precisa
# casar com a versão do playwright no package.json — navegador e biblioteca
# são versionados juntos.

# ----------------------------------------------------------------- deps
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compila o TypeScript e copia as imagens da proposta para dist/.
RUN npm run build

# ------------------------------------------------------------ produção
FROM mcr.microsoft.com/playwright:v1.62.1-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Só as dependências de produção: tsx, tipos e pdfjs ficam de fora.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Configuração de produção que não é segredo (endereço do servidor de e-mail,
# destinatários). Precisa entrar na imagem: sem ela o processo caía no `.env`
# antigo do host, que ainda aponta para o endereço de SMTP que deixou de
# existir — o formulário respondia sucesso e nada saía. A senha continua fora
# da imagem, chegando por env_file em tempo de execução.
COPY .env.producao ./.env.producao

# As propostas geradas e o contador de numeração são gravados em disco. O
# diretório é ponto de montagem de um volume (ver docker-compose), para a
# numeração sobreviver à recriação do container.
RUN mkdir -p /app/propostas && chown -R pwuser:pwuser /app

# A imagem do Playwright traz este usuário sem privilégios já configurado
# para o navegador.
USER pwuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
