#!/bin/bash

# Script de Verificação de Prontidão para Build
# Verifica se a aplicação está pronta para build na VPS

echo "🔍 Verificando prontidão para build..."
echo ""

ERRORS=0
WARNINGS=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# 1. Verificar Node.js e npm
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verificando Node.js e npm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"
    
    # Verificar versão mínima (18.0.0)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}✗${NC} Node.js versão muito antiga (mínimo: 18.0.0)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js não instalado"
    ERRORS=$((ERRORS + 1))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm instalado: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm não instalado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# 2. Verificar arquivos essenciais
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verificando arquivos essenciais"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILES=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    ".env"
    "prisma/schema.prisma"
    "scripts/fix-all-dynamic-routes.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file não encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ============================================
# 3. Verificar next.config.js
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Verificando configuração do Next.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "next.config.js" ]; then
    if grep -q "output.*standalone" next.config.js; then
        echo -e "${GREEN}✓${NC} next.config.js tem output: 'standalone'"
    else
        echo -e "${YELLOW}⚠${NC} next.config.js não tem output: 'standalone'"
        echo "  Adicione: output: 'standalone' no nextConfig"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ============================================
# 4. Verificar variáveis de ambiente
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Verificando variáveis de ambiente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    REQUIRED_VARS=(
        "DATABASE_URL"
        "DIRECT_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "MINIO_ENDPOINT"
        "MINIO_ACCESS_KEY"
        "MINIO_SECRET_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            echo -e "${GREEN}✓${NC} $var"
        else
            echo -e "${RED}✗${NC} $var não encontrado"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} Arquivo .env não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# 5. Verificar rotas dinâmicas
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Verificando rotas dinâmicas da API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "app/api" ]; then
    TOTAL_ROUTES=$(find app/api -name "route.ts" -type f 2>/dev/null | wc -l)
    ROUTES_WITH_DYNAMIC=$(find app/api -name "route.ts" -type f -exec grep -l "export const dynamic" {} \; 2>/dev/null | wc -l)
    ROUTES_WITHOUT_DYNAMIC=$(find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | wc -l)
    
    echo "Total de rotas: $TOTAL_ROUTES"
    echo "Rotas com 'export const dynamic': $ROUTES_WITH_DYNAMIC"
    echo "Rotas sem 'export const dynamic': $ROUTES_WITHOUT_DYNAMIC"
    echo ""
    
    if [ $ROUTES_WITHOUT_DYNAMIC -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} $ROUTES_WITHOUT_DYNAMIC rotas precisam de correção"
        echo ""
        echo "Rotas que precisam de correção (primeiras 10):"
        find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | head -10 | while read route; do
            echo "  - $route"
        done
        echo ""
        echo "Execute para corrigir:"
        echo "  node scripts/fix-all-dynamic-routes.js"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Todas as rotas estão configuradas corretamente"
    fi
else
    echo -e "${RED}✗${NC} Diretório app/api não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# 6. Verificar node_modules
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Verificando dependências"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules existe"
    
    # Verificar se Prisma Client foi gerado
    if [ -d "node_modules/.prisma/client" ]; then
        echo -e "${GREEN}✓${NC} Prisma Client gerado"
    else
        echo -e "${YELLOW}⚠${NC} Prisma Client não gerado"
        echo "  Execute: npx prisma generate"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} node_modules não encontrado"
    echo "  Execute: npm install"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================
# 7. Verificar cache e builds anteriores
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Verificando cache e builds anteriores"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".next" ]; then
    echo -e "${YELLOW}⚠${NC} Diretório .next existe (build anterior)"
    echo "  Recomendado limpar antes de novo build: rm -rf .next"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Sem build anterior"
fi

if [ -d "node_modules/.cache" ]; then
    echo -e "${YELLOW}⚠${NC} Cache do node_modules existe"
    echo "  Recomendado limpar: rm -rf node_modules/.cache"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Sem cache"
fi

if [ -f "tsconfig.tsbuildinfo" ]; then
    echo -e "${YELLOW}⚠${NC} tsconfig.tsbuildinfo existe"
    echo "  Recomendado limpar: rm tsconfig.tsbuildinfo"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Sem tsbuildinfo"
fi

echo ""

# ============================================
# 8. Verificar espaço em disco (se em Linux)
# ============================================
if command -v df &> /dev/null; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "8. Verificando espaço em disco"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')
    
    echo "Espaço disponível: $DISK_AVAIL"
    echo "Uso: ${DISK_USAGE}%"
    
    if [ "$DISK_USAGE" -gt 90 ]; then
        echo -e "${RED}✗${NC} Espaço em disco crítico (>90%)"
        ERRORS=$((ERRORS + 1))
    elif [ "$DISK_USAGE" -gt 80 ]; then
        echo -e "${YELLOW}⚠${NC} Espaço em disco baixo (>80%)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Espaço em disco OK"
    fi
    
    echo ""
fi

# ============================================
# RESUMO
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Tudo OK! Pronto para build.${NC}"
    echo ""
    echo "Execute:"
    echo "  npm run build"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avisos encontrados${NC}"
    echo ""
    echo "Recomendações antes do build:"
    echo "  1. Limpar cache: rm -rf .next node_modules/.cache tsconfig.tsbuildinfo"
    echo "  2. Corrigir rotas: node scripts/fix-all-dynamic-routes.js"
    echo "  3. Gerar Prisma: npx prisma generate"
    echo ""
    echo "Depois execute:"
    echo "  npm run build"
    exit 0
else
    echo -e "${RED}✗ $ERRORS erros e $WARNINGS avisos encontrados${NC}"
    echo ""
    echo "Corrija os erros antes de tentar o build."
    exit 1
fi
