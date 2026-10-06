#!/bin/sh
# Devolve um backup do volume `propostas` para o lugar.
#
#   infra/backup/restaurar.sh                      o mais recente
#   infra/backup/restaurar.sh /caminho/arquivo.tar.gz   um especifico
#
# Existe porque backup sem restauracao testada e esperanca, nao backup. Na
# hora que fizer falta, ninguem vai querer descobrir a sintaxe do tar com um
# cliente esperando o orcamento.
#
# O que ele NAO faz: apagar o que ja esta no volume. Os arquivos do backup sao
# escritos por cima, e o que existe a mais continua. E deliberado — restaurar
# nao deveria poder destruir um lead que chegou depois do backup.

set -eu

VOLUME="${VOLUME:-hclean_propostas}"
DESTINO="${DESTINO:-/var/backups/hclean}"

ARQUIVO="${1:-}"
if [ -z "$ARQUIVO" ]; then
  ARQUIVO=$(ls -1t "$DESTINO"/propostas-*.tar.gz 2>/dev/null | head -1 || true)
fi
if [ -z "$ARQUIVO" ] || [ ! -f "$ARQUIVO" ]; then
  echo "nenhum backup encontrado em $DESTINO" >&2
  exit 1
fi

ORIGEM=$(docker volume inspect "$VOLUME" --format '{{ .Mountpoint }}' 2>/dev/null || true)
if [ -z "$ORIGEM" ]; then
  echo "volume '$VOLUME' nao existe; suba o compose uma vez para cria-lo" >&2
  exit 1
fi

echo "restaurando $ARQUIVO em $ORIGEM"
tar -tzf "$ARQUIVO" >/dev/null || { echo "arquivo corrompido" >&2; exit 1; }
tar -xzf "$ARQUIVO" -C "$ORIGEM"

# O backend le a fila na subida: sem reiniciar, os leads restaurados ficariam
# no disco sem ninguem tentar reenvia-los.
echo "reiniciando o backend para ele retomar a fila"
docker compose restart backend 2>/dev/null || \
  echo "(reinicie o backend a mao: docker compose restart backend)"

echo "pronto"
