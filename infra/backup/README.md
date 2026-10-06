# Backup da fila de leads e das propostas

O volume `hclean_propostas` guarda três coisas que **não existem em outro
lugar** — nem no git, nem no e-mail, nem em banco (não há banco):

| o que | por que importa |
|---|---|
| `leads-pendentes/` | pedidos de orçamento que o SMTP ainda não aceitou. São clientes que **já viram "enviado"** na tela. Perder um arquivo é perder um pedido que ninguém leu. |
| `agendados/` | propostas automáticas esperando a hora de sair |
| `contador.json` | a numeração das propostas. Se voltar atrás, duas propostas diferentes saem com o mesmo número. |

## Instalar no servidor

```sh
cd /opt/hclean
# roda todo dia às 3h da manhã
( crontab -l 2>/dev/null; echo '0 3 * * * cd /opt/hclean && sh infra/backup/backup.sh >> /var/log/hclean-backup.log 2>&1' ) | crontab -
crontab -l | grep backup
```

Um backup à mão, para conferir que funciona:

```sh
sh infra/backup/backup.sh
ls -la /var/backups/hclean/
```

## Restaurar

```sh
sh infra/backup/restaurar.sh                    # o mais recente
sh infra/backup/restaurar.sh /var/backups/hclean/propostas-2026-10-06T03-00-00Z.tar.gz
```

A restauração **não apaga** o que já está no volume: escreve os arquivos do
backup por cima e deixa o resto. É deliberado — restaurar não deveria poder
destruir um lead que chegou depois do backup.

Ela reinicia o backend no fim, porque a fila é lida na subida: sem isso, os
leads restaurados ficariam no disco sem ninguém tentar reenviá-los.

## O que foi testado

Perda total do volume → restauração devolveu os 4 arquivos, lead íntegro e
contador preservado (não voltou a zero). Vale repetir esse teste de vez em
quando: backup que nunca foi restaurado é esperança, não backup.

## Fora do servidor: e-mail semanal

Todo **domingo**, o backup manda dois anexos para a caixa comercial (`MAIL_TO`):

| anexo | para que serve |
|---|---|
| `propostas-*.tar.gz` | **restaurar**. Volta direto no `restaurar.sh`. |
| `leads-historico.csv` | **consultar**. Uma linha por lead desde sempre, nada apagado, abre no Excel. |

A divisão é de propósito. O `.tar.gz` guarda o estado recente do volume — é o
que permite voltar. O `.csv` é o histórico real: a fila do servidor **esvazia**
quando o e-mail sai, então um backup do volume não contém o que já foi
enviado. O CSV contém.

Semanal e não diário porque um anexo por dia na caixa comercial vira ruído, e
ruído é o que faz as pessoas pararem de olhar.

Falha no envio **não** invalida o backup: o arquivo em disco já está gravado e
conferido antes de o e-mail ser tentado.

Para desligar o envio (mantendo o backup em disco):

```sh
ENVIAR_SEMANAL=0 sh infra/backup/backup.sh
```

Para testar o envio agora, sem esperar domingo:

```sh
docker compose exec -T backend node scripts/enviar-backup.mjs
```

### Sobre o CSV

É gravado pelo backend no momento em que o lead chega, antes de qualquer
tentativa de e-mail. Separado por `;` e com BOM, que é o que o Excel em
português espera — com vírgula, ele amassa tudo numa coluna só.

Valores que começam com `=`, `+`, `-` ou `@` recebem um apóstrofo na frente.
Sem isso, alguém poderia mandar `=HYPERLINK(...)` no campo de mensagem e a
planilha executaria aquilo ao ser aberta.

### O que ainda não está coberto

O e-mail protege de perder a VPS, mas depende da caixa continuar existindo e
de ninguém apagar as mensagens. Para arquivo de longo prazo, vale guardar os
anexos de vez em quando em outro lugar — ou configurar nuvem (rclone) depois.
