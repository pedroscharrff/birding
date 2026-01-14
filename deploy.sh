#!/bin/bash
set -euo pipefail

# ============================================
# Script de Deploy Robusto
# ============================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo "🚀 Iniciando deploy..."

# ============================================
# 1. AUTODETECÇÃO DE DIRETÓRIO
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
print_success "Diretório: $SCRIPT_DIR"

# ============================================
# 2. VALIDAÇÃO DE PRÉ-REQUISITOS
# ============================================
print_info "Validando pré-requisitos..."

# Verificar arquivos essenciais
for file in package.json .env next.config.js prisma/schema.prisma; do
    if [ ! -f "$file" ]; then
        print_error "Arquivo não encontrado: $file"
        exit 1
    fi
done
print_success "Arquivos essenciais OK"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não instalado"
    exit 1
fi
NODE_VERSION=$(node --version | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versão muito antiga (atual: v$NODE_VERSION, mínimo: v18)"
    exit 1
fi
print_success "Node.js $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm não instalado"
    exit 1
fi
print_success "npm $(npm --version)"

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 não instalado"
    exit 1
fi
print_success "PM2 instalado"

# Verificar DATABASE_URL
if ! grep -q "^DATABASE_URL=" .env; then
    print_error "DATABASE_URL não encontrado no .env"
    exit 1
fi
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL vazio"
    exit 1
fi
print_success "DATABASE_URL configurado"

# Verificar next.config.js não está em modo export
if grep -q "output.*['\"]export['\"]" next.config.js; then
    print_error "next.config.js está configurado para export estático"
    print_info "Altere para: output: 'standalone'"
    exit 1
fi
print_success "Next.js configurado corretamente"

# ============================================
# 3. BACKUP DO BANCO DE DADOS
# ============================================
print_info "Fazendo backup do banco..."
BACKUP_DIR="$HOME/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    print_success "Backup salvo: $BACKUP_FILE"
else
    print_warning "Backup falhou (continuando...)"
    rm -f "$BACKUP_FILE"
fi

# ============================================
# 4. SALVAR COMMIT ATUAL (PARA ROLLBACK)
# ============================================
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
print_info "Commit atual: ${CURRENT_COMMIT:0:8}"

# ============================================
# 5. ATUALIZAR CÓDIGO
# ============================================
print_info "Atualizando código do Git..."
git fetch origin

# Verificar se há alterações
BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
if [ "$BEHIND" -eq 0 ]; then
    print_warning "Nenhuma atualização disponível"
else
    print_info "Aplicando $BEHIND commit(s)..."
    if ! git pull origin main; then
        print_error "Falha ao atualizar código"
        exit 1
    fi
    print_success "Código atualizado"
fi

# ============================================
# 6. LIMPAR CACHE
# ============================================
print_info "Limpando cache..."
rm -rf .next node_modules/.cache tsconfig.tsbuildinfo
print_success "Cache limpo"

# ============================================
# 7. INSTALAR DEPENDÊNCIAS
# ============================================
print_info "Instalando dependências..."
if [ -f package-lock.json ]; then
    if ! npm ci; then
        print_error "npm ci falhou - package-lock.json pode estar inconsistente"
        print_info "Execute localmente: npm install && git add package-lock.json && git commit"
        exit 1
    fi
else
    print_warning "package-lock.json não encontrado, usando npm install"
    npm install
fi
print_success "Dependências instaladas"

# ============================================
# 8. GERAR PRISMA CLIENT
# ============================================
print_info "Gerando Prisma Client..."
if ! npx prisma generate; then
    print_error "Falha ao gerar Prisma Client"
    exit 1
fi
print_success "Prisma Client gerado"

# ============================================
# 9. EXECUTAR MIGRATIONS
# ============================================
print_info "Executando migrations..."
if ! npx prisma migrate deploy; then
    print_error "Falha ao executar migrations"
    print_info "Verifique o banco de dados e tente novamente"
    exit 1
fi
print_success "Migrations executadas"

# ============================================
# 10. BUILD DA APLICAÇÃO
# ============================================
print_info "Buildando aplicação..."
BUILD_LOG=$(mktemp)
if ! NODE_ENV=production npm run build 2>&1 | tee "$BUILD_LOG"; then
    print_error "Build falhou"
    echo ""
    print_info "Últimas 30 linhas do erro:"
    tail -30 "$BUILD_LOG"
    rm -f "$BUILD_LOG"
    
    # Rollback
    if [ "$CURRENT_COMMIT" != "unknown" ]; then
        print_warning "Revertendo para commit anterior..."
        git reset --hard "$CURRENT_COMMIT"
    fi
    exit 1
fi
rm -f "$BUILD_LOG"
print_success "Build concluído"

# ============================================
# 11. COPIAR ARQUIVOS ESTÁTICOS (STANDALONE)
# ============================================
print_info "Copiando arquivos estáticos para standalone..."
if [ -d ".next/standalone" ]; then
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    cp -r public .next/standalone/ 2>/dev/null || true
    print_success "Arquivos estáticos copiados"
else
    print_warning "Diretório standalone não encontrado (pulando...)"
fi

# ============================================
# 12. RELOAD/RESTART DA APLICAÇÃO
# ============================================
print_info "Reiniciando aplicação..."

# Verificar se app está rodando
if pm2 describe ostour &> /dev/null; then
    # App existe, tentar reload (zero-downtime)
    if pm2 reload ostour --update-env; then
        print_success "Aplicação recarregada (zero-downtime)"
    else
        print_warning "Reload falhou, tentando restart..."
        pm2 restart ostour
        print_success "Aplicação reiniciada"
    fi
else
    # App não existe, iniciar
    if [ -f ecosystem.config.js ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start npm --name ostour -- start
    fi
    print_success "Aplicação iniciada"
fi

# ============================================
# 13. HEALTHCHECK
# ============================================
print_info "Verificando saúde da aplicação..."

# Detectar porta (padrão 3000)
PORT=$(grep -E "PORT\s*=" ecosystem.config.js 2>/dev/null | grep -oE '[0-9]+' | head -1)
PORT=${PORT:-3000}

# Aguardar e verificar
MAX_RETRIES=30
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "http://127.0.0.1:$PORT" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    
    # Verificar se PM2 mostra erro
    if pm2 describe ostour 2>/dev/null | grep -q "errored\|stopped"; then
        print_error "Aplicação crashou durante inicialização"
        print_info "Logs:"
        pm2 logs ostour --lines 30 --nostream
        
        # Rollback
        if [ "$CURRENT_COMMIT" != "unknown" ]; then
            print_warning "Revertendo para versão anterior..."
            git reset --hard "$CURRENT_COMMIT"
            npm ci
            npx prisma generate
            npm run build
            pm2 restart ostour
        fi
        exit 1
    fi
    
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$HEALTH_OK" = true ]; then
    print_success "Aplicação respondendo na porta $PORT"
else
    print_error "Aplicação não respondeu após ${MAX_RETRIES}s"
    print_info "Logs:"
    pm2 logs ostour --lines 30 --nostream
    exit 1
fi

# ============================================
# 14. VERIFICAÇÃO FINAL
# ============================================
print_info "Verificação final..."
pm2 status ostour

# Salvar estado do PM2
pm2 save > /dev/null 2>&1

echo ""
print_success "✅ Deploy concluído com sucesso!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Informações:"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "  Porta: $PORT"
echo "  Backup: $BACKUP_FILE"
echo ""
echo "🔗 Comandos úteis:"
echo "  pm2 logs ostour       # Ver logs"
echo "  pm2 monit             # Monitorar recursos"
echo "  pm2 restart ostour    # Reiniciar"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
