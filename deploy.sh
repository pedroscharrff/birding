#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Ir para o diretório da aplicação
cd /home/ostour/birding

# Fazer backup do banco
echo "📦 Fazendo backup do banco..."
mkdir -p ~/backups
PGPASSWORD=$(grep DATABASE_URL .env | cut -d':' -f3 | cut -d'@' -f1) pg_dump -U ostour_user -h localhost ostour > ~/backups/ostour_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "⚠️  Backup do banco falhou (continuando...)"

# Puxar últimas alterações
echo "📥 Puxando alterações do Git..."
git fetch origin
git pull origin main

# Limpar cache e builds anteriores
echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production=false || npm install --production=false

# Executar migrations
echo "🗄️ Executando migrations..."
npx prisma generate
npx prisma migrate deploy

# Corrigir rotas dinâmicas
echo "🔄 Corrigindo rotas dinâmicas..."
if [ -f scripts/fix-all-dynamic-routes.js ]; then
    node scripts/fix-all-dynamic-routes.js
fi

# Verificar rotas sem dynamic export
echo "🔍 Verificando rotas..."
ROUTES_WITHOUT_DYNAMIC=$(find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | wc -l)
if [ $ROUTES_WITHOUT_DYNAMIC -gt 0 ]; then
    echo "⚠️  Aviso: $ROUTES_WITHOUT_DYNAMIC rotas sem 'export const dynamic'"
fi

# Build da aplicação
echo "🔨 Fazendo build..."
NODE_ENV=production npm run build

# Reiniciar aplicação
echo "♻️ Reiniciando aplicação..."
pm2 restart ostour

# Aguardar aplicação iniciar
echo "⏳ Aguardando aplicação iniciar..."
sleep 5

# Verificar status
echo "📊 Status da aplicação:"
pm2 status ostour

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🔗 Comandos úteis:"
echo "  - Ver logs: pm2 logs ostour"
echo "  - Status: pm2 status"
echo "  - Monitorar: pm2 monit"
