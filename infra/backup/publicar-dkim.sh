#!/bin/sh
# Publica o registro DKIM na Cloudflare.
#
#   CF_TOKEN=... ZONA=hcleanoil.com.br infra/backup/publicar-dkim.sh 'v=DKIM1; k=rsa; p=MIGf...'
#
# A chave vem do cPanel (Email Deliverability > Manage > DKIM): e ele quem a
# gera e quem assina com a privada. Daqui so sai a parte publica para o DNS.
#
# Por que isso importa: sem DKIM, o destinatario nao tem como provar que a
# mensagem nao foi alterada no caminho, e Gmail e Outlook tratam o remetente
# com desconfianca. O resultado e o pior tipo de falha — o envio responde
# sucesso, o /health diz ok, e a mensagem vai para spam. Ninguem e avisado
# porque, tecnicamente, nada falhou.
#
# O SPF (+a +mx +ip4:45.148.96.63) e o DMARC (p=none) ja existem na zona. O
# DKIM e a perna que falta das tres.

set -eu

ZONA="${ZONA:-hcleanoil.com.br}"
SELETOR="${SELETOR:-default}"
VALOR="${1:-}"

if [ -z "$VALOR" ]; then
  echo "uso: $0 'v=DKIM1; k=rsa; p=<chave publica do cPanel>'" >&2
  exit 1
fi
case "$VALOR" in
  *v=DKIM1*) ;;
  *) echo "o valor nao parece um registro DKIM (falta v=DKIM1)" >&2; exit 1 ;;
esac
if [ -z "${CF_TOKEN:-}" ]; then
  echo "defina CF_TOKEN com um token de API com permissao de DNS na zona" >&2
  exit 1
fi

api() { curl -sS -H "Authorization: Bearer $CF_TOKEN" -H 'Content-Type: application/json' "$@"; }

ZID=$(api "https://api.cloudflare.com/client/v4/zones?name=$ZONA" \
      | grep -o '"id":"[0-9a-f]*"' | head -1 | cut -d'"' -f4)
[ -n "$ZID" ] || { echo "zona '$ZONA' nao encontrada com este token" >&2; exit 1; }

NOME="$SELETOR._domainkey.$ZONA"

# Atualiza se ja existir, em vez de criar um segundo: dois DKIM no mesmo nome
# fazem o verificador escolher um, e metade das mensagens falha a assinatura.
EXISTE=$(api "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?type=TXT&name=$NOME" \
         | grep -o '"id":"[0-9a-f]*"' | head -1 | cut -d'"' -f4)

# O escape do valor fica com uma ferramenta que entende JSON. A primeira
# versao montava a string com `sed` encadeado e produzia `"content":` VAZIO,
# o que publicaria um DKIM invalido — pior que nao ter DKIM, porque o
# verificador acha a assinatura e a recusa.
escapar() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"
  elif command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -Rs 'rtrimstr("\n")'
  else
    echo 'preciso de python3 ou jq para montar o JSON com seguranca' >&2
    exit 1
  fi
}

CORPO=$(printf '{"type":"TXT","name":"%s","content":%s,"ttl":3600}' "$NOME" "$(escapar "$VALOR")")

if [ -n "$EXISTE" ]; then
  echo "atualizando $NOME"
  R=$(api -X PUT "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/$EXISTE" --data "$CORPO")
else
  echo "criando $NOME"
  R=$(api -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" --data "$CORPO")
fi

printf '%s' "$R" | grep -q '"success":true' || { echo "falhou: $R" >&2; exit 1; }
echo "publicado. confira com:"
echo "  nslookup -type=TXT $NOME 8.8.8.8"
