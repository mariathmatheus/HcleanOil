# Site institucional (Next.js).
#
# Três estágios para que a imagem final não carregue nem o código-fonte nem as
# dependências de build: o `output: standalone` do Next monta um servidor com
# só o que ele usa em produção.

# ----------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` respeita o lockfile — build reproduzível, ao contrário de `install`.
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# A URL da API entra no bundle no momento do build (NEXT_PUBLIC_*), não em
# tempo de execução — por isso vem como argumento, e não como variável do
# container.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# O diretorio so existe se alguma imagem foi otimizada no build; cria vazio
# para o COPY do estagio final nunca falhar.
RUN mkdir -p .next/cache/images

# ------------------------------------------------------------- produção
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Sem isto o processo roda como root; o node:alpine já traz este usuário.
USER node

# O standalone traz o server.js e as dependências mínimas. `static` e `public`
# ficam de fora dele e precisam ser copiados à parte, senão o site sobe sem
# CSS nem imagens.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Cache do otimizador de imagem, aquecido durante o build.
# Sem isto, a primeira visita depois de cada deploy paga o reencode de todas
# as imagens — e era o que deixava o LCP da home em 4s.
COPY --from=build --chown=node:node /app/.next/cache/images ./.next/cache/images

EXPOSE 3000

# Sem curl/wget na imagem alpine slim: o próprio node faz a checagem.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
