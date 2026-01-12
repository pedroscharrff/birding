#!/bin/bash
BACKUP_DIR="/home/ostour/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Iniciando backup: $DATE"

# Backup do banco de dados
echo "Fazendo backup do banco de dados..."
pg_dump -U ostour_user ostour | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos arquivos MinIO
echo "Fazendo backup dos arquivos MinIO..."
tar -czf $BACKUP_DIR/minio_$DATE.tar.gz /data/minio 2>/dev/null || echo "Aviso: Alguns arquivos do MinIO podem não ter sido copiados"

# Backup do .env (importante para recuperação)
echo "Fazendo backup das configurações..."
cp /home/ostour/birding/.env $BACKUP_DIR/env_$DATE.backup

# Manter apenas últimos 7 dias
echo "Limpando backups antigos..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

# Mostrar tamanho dos backups
echo "Backups atuais:"
du -sh $BACKUP_DIR/*

echo "Backup concluído: $DATE"
