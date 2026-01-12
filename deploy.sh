#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Ir para o diretório da aplicação
cd /home/ostour/birding

# Fazer backup do banco (opcional)
echo "📦 Fazendo backup do banco..."
mkdir -p ~/backups
pg_dump -U ostour_user ostour > ~/backups/ostour_$(date +%Y%m%d_%H%M%S).sql

# Puxar últimas alterações
echo "📥 Puxando alterações do Git..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Executar migrations
echo "🗄️ Executando migrations..."
npx prisma generate
npx prisma migrate deploy

# Build da aplicação
echo "🔨 Fazendo build..."
npm run build

# Reiniciar aplicação
echo "♻️ Reiniciando aplicação..."
pm2 restart ostour

echo "✅ Deploy concluído com sucesso!"
