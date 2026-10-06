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

## Guardar fora do servidor

O que está aqui protege de `docker volume rm` e de container recriado — não de
perder a VPS. Se o servidor sumir, o backup vai com ele. Para cobrir isso,
copie `/var/backups/hclean/` para fora (rclone, rsync para outra máquina, ou
baixar com `scp` de vez em quando).
