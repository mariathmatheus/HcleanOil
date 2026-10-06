#!/bin/sh
# Copia o volume `propostas` para fora do Docker, todos os dias.
#
# O volume guarda tres coisas que nao podem ser reconstruidas:
#
#   leads-pendentes/  pedidos de orcamento que o SMTP ainda nao aceitou. Sao
#                     clientes que JA viram "enviado" na tela. Perder um
#                     arquivo aqui e perder um pedido que ninguem leu.
#   agendados/        propostas automaticas esperando a hora de sair.
#   contador.json     a numeracao das propostas. Se voltar atras, duas
#                     propostas diferentes saem com o mesmo numero.
#
# Nada disso existe em outro lugar: nao esta no git, nao esta no e-mail, nao
# esta no banco (nao ha banco). O volume e a unica copia, e um `docker volume
# rm` acidental ou uma perda de disco levaria tudo.
#
# Roda pelo cron do host. Nao depende do container estar de pe: le o volume
# direto do disco, entao funciona inclusive quando o backend esta parado.

set -eu

VOLUME="${VOLUME:-hclean_propostas}"
DESTINO="${DESTINO:-/var/backups/hclean}"
# Quantos dias de copia guardar. Trinta cobre o mes e cabe em qualquer disco:
# sao arquivos JSON pequenos, nao imagens.
MANTER="${MANTER:-30}"

# O caminho real do volume no host. `docker volume inspect` em vez de assumir
# /var/lib/docker/volumes/...: o diretorio muda com o storage driver, e em
# alguns ambientes nem existe.
ORIGEM=$(docker volume inspect "$VOLUME" --format '{{ .Mountpoint }}' 2>/dev/null || true)
if [ -z "$ORIGEM" ] || [ ! -d "$ORIGEM" ]; then
  echo "[backup] volume '$VOLUME' nao encontrado" >&2
  exit 1
fi

mkdir -p "$DESTINO"
AGORA=$(date -u '+%Y-%m-%dT%H-%M-%SZ')
ARQUIVO="$DESTINO/propostas-$AGORA.tar.gz"

# Grava num temporario e so depois renomeia. Um tar.gz truncado por falta de
# espaco ou por desligamento no meio pareceria um backup valido na listagem,
# e a hora de descobrir que nao era seria a hora de restaurar.
TEMP="$ARQUIVO.parcial"
tar -czf "$TEMP" -C "$ORIGEM" . 
mv "$TEMP" "$ARQUIVO"

# Confere que o arquivo abre. Backup que nao foi lido nem uma vez e esperanca,
# nao backup.
if ! tar -tzf "$ARQUIVO" >/dev/null 2>&1; then
  echo "[backup] o arquivo gerado esta corrompido: $ARQUIVO" >&2
  rm -f "$ARQUIVO"
  exit 1
fi

TAMANHO=$(wc -c < "$ARQUIVO")
ITENS=$(tar -tzf "$ARQUIVO" | grep -c '\.json$' || true)
echo "[backup] $ARQUIVO (${TAMANHO}B, ${ITENS} json)"

# Remove o que passou da janela, e tambem parciais de execucoes interrompidas.
find "$DESTINO" -name 'propostas-*.tar.gz' -type f -mtime "+$MANTER" -delete
find "$DESTINO" -name '*.parcial' -type f -mtime +1 -delete

# Um arquivo com a hora do ultimo backup bem-sucedido, para a vigilancia poder
# reclamar quando parar de rodar. Backup que falha em silencio e o caso que
# deixa a pessoa descobrir no pior momento.
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$DESTINO/ultimo-ok.txt"

# Uma vez por semana, manda a copia para fora do servidor. Diario encheria a
# caixa comercial, e ruido e o que faz as pessoas pararem de olhar.
#
# `|| true`: falha no envio NAO invalida o backup. O arquivo em disco ja esta
# gravado e conferido; nao poder mandar por e-mail e um problema menor, e
# derrubar o backup por causa dele seria trocar o certo pelo duvidoso.
if [ "${ENVIAR_SEMANAL:-1}" = '1' ] && [ "$(date -u +%u)" = '7' ]; then
  echo '[backup] domingo: enviando copia por e-mail'
  docker compose exec -T backend node scripts/enviar-backup.mjs     "/backups/$(basename "$ARQUIVO")" ||     echo '[backup] o envio por e-mail falhou; o backup em disco esta ok' >&2
fi
