#!/bin/bash

# Script de Instalação Automática - OS/Tour VPS
# Este script automatiza todo o processo de configuração do servidor

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script precisa ser executado como root (use sudo)"
    exit 1
fi

# Banner
clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║                                               ║
║     OS/Tour - Instalação Automática VPS      ║
║                                               ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Este script irá instalar e configurar:"
echo "  • Node.js 18+"
echo "  • PostgreSQL"
echo "  • MinIO (Storage S3)"
echo "  • PM2 (Process Manager)"
echo "  • Nginx (Reverse Proxy)"
echo "  • Certificado SSL (Let's Encrypt)"
echo ""

read -p "Deseja continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_error "Instalação cancelada"
    exit 1
fi

# ============================================
# COLETA DE INFORMAÇÕES
# ============================================

print_header "1. Coleta de Informações"

# Domínio
read -p "Digite seu domínio (ex: ostour.com.br): " DOMAIN
while [ -z "$DOMAIN" ]; do
    print_warning "Domínio é obrigatório!"
    read -p "Digite seu domínio: " DOMAIN
done
print_success "Domínio: $DOMAIN"

# Email para Let's Encrypt
read -p "Digite seu email para certificado SSL: " SSL_EMAIL
while [ -z "$SSL_EMAIL" ]; do
    print_warning "Email é obrigatório!"
    read -p "Digite seu email: " SSL_EMAIL
done
print_success "Email: $SSL_EMAIL"

# Senha do PostgreSQL
read -sp "Digite uma senha segura para o banco PostgreSQL: " DB_PASSWORD
echo
while [ -z "$DB_PASSWORD" ]; do
    print_warning "Senha é obrigatória!"
    read -sp "Digite uma senha segura: " DB_PASSWORD
    echo
done
print_success "Senha do banco configurada"

# Senha do MinIO
read -sp "Digite uma senha segura para o MinIO (min 8 caracteres): " MINIO_PASSWORD
echo
while [ ${#MINIO_PASSWORD} -lt 8 ]; do
    print_warning "Senha deve ter no mínimo 8 caracteres!"
    read -sp "Digite uma senha segura: " MINIO_PASSWORD
    echo
done
print_success "Senha do MinIO configurada"

# URL do repositório Git
echo ""
print_info "Para repositórios públicos, use HTTPS: https://github.com/usuario/repo.git"
print_info "Para repositórios privados, você precisará de um Personal Access Token"
read -p "Digite a URL do repositório Git (HTTPS): " GIT_REPO
while [ -z "$GIT_REPO" ]; do
    print_warning "URL do repositório é obrigatória!"
    read -p "Digite a URL do repositório: " GIT_REPO
done

# Converter SSH para HTTPS se necessário
if [[ $GIT_REPO == git@github.com:* ]]; then
    print_warning "URL SSH detectada, convertendo para HTTPS..."
    GIT_REPO=$(echo $GIT_REPO | sed 's/git@github.com:/https:\/\/github.com\//')
    print_info "Nova URL: $GIT_REPO"
fi

# Verificar se é repositório privado
read -p "O repositório é privado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Para repositórios privados, você precisa de um Personal Access Token"
    print_info "Crie um em: https://github.com/settings/tokens (classic token com repo access)"
    read -p "Digite seu GitHub username: " GIT_USERNAME
    read -sp "Digite seu Personal Access Token: " GIT_TOKEN
    echo
    # Inserir credenciais na URL
    GIT_REPO=$(echo $GIT_REPO | sed "s|https://|https://${GIT_USERNAME}:${GIT_TOKEN}@|")
    print_success "Credenciais configuradas"
fi

print_success "Repositório: $(echo $GIT_REPO | sed 's/:.*@/@/')"  # Ocultar token no output

# Branch
read -p "Digite o branch (padrão: main): " GIT_BRANCH
GIT_BRANCH=${GIT_BRANCH:-main}
print_success "Branch: $GIT_BRANCH"

# Gerar chaves JWT
print_info "Gerando chaves JWT seguras..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
print_success "Chaves JWT geradas"

# Confirmação
echo ""
print_header "Confirmação das Configurações"
echo "Domínio: $DOMAIN"
echo "Email SSL: $SSL_EMAIL"
echo "Repositório: $GIT_REPO"
echo "Branch: $GIT_BRANCH"
echo ""
read -p "Confirma as configurações? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_error "Instalação cancelada"
    exit 1
fi

# ============================================
# INSTALAÇÃO
# ============================================

print_header "2. Atualizando Sistema"
apt update && apt upgrade -y
print_success "Sistema atualizado"

print_header "3. Instalando Dependências Básicas"
apt install -y curl git build-essential ufw fail2ban certbot python3-certbot-nginx
print_success "Dependências instaladas"

# ============================================
# NODE.JS
# ============================================

print_header "4. Instalando Node.js 18"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_success "Node.js instalado: $(node --version)"
else
    print_success "Node.js já instalado: $(node --version)"
fi

# ============================================
# POSTGRESQL
# ============================================

print_header "5. Instalando PostgreSQL"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    print_success "PostgreSQL instalado"
else
    print_success "PostgreSQL já instalado"
fi

print_info "Configurando banco de dados..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS ostour;
DROP USER IF EXISTS ostour_user;
CREATE DATABASE ostour;
CREATE USER ostour_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ostour TO ostour_user;
ALTER DATABASE ostour OWNER TO ostour_user;
\q
EOF
print_success "Banco de dados configurado"

# ============================================
# MINIO
# ============================================

print_header "6. Instalando MinIO"
if [ ! -f /usr/local/bin/minio ]; then
    wget -q https://dl.min.io/server/minio/release/linux-amd64/minio
    chmod +x minio
    mv minio /usr/local/bin/
    print_success "MinIO baixado"
else
    print_success "MinIO já instalado"
fi

# Criar usuário e diretório
if ! id -u minio-user &> /dev/null; then
    useradd -r minio-user -s /sbin/nologin
    print_success "Usuário minio-user criado"
fi

mkdir -p /data/minio
chown -R minio-user:minio-user /data/minio
print_success "Diretório MinIO criado"

# Criar serviço systemd
cat > /etc/systemd/system/minio.service << EOF
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local/

User=minio-user
Group=minio-user

Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=$MINIO_PASSWORD"
Environment="MINIO_VOLUMES=/data/minio"
Environment="MINIO_OPTS=--console-address :9001"

ExecStart=/usr/local/bin/minio server \$MINIO_OPTS \$MINIO_VOLUMES

Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start minio
systemctl enable minio
print_success "MinIO configurado e iniciado"

# ============================================
# PM2
# ============================================

print_header "7. Instalando PM2"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 instalado"
else
    print_success "PM2 já instalado"
fi

# ============================================
# NGINX
# ============================================

print_header "8. Instalando Nginx"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx instalado"
else
    print_success "Nginx já instalado"
fi

# ============================================
# USUÁRIO DA APLICAÇÃO
# ============================================

print_header "9. Configurando Usuário da Aplicação"
if ! id -u ostour &> /dev/null; then
    useradd -m -s /bin/bash ostour
    print_success "Usuário ostour criado"
else
    print_success "Usuário ostour já existe"
fi

# ============================================
# CLONAR REPOSITÓRIO
# ============================================

print_header "10. Clonando Repositório"

# Remover diretório se existir e estiver vazio ou corrompido
if [ -d "/home/ostour/birding" ] && [ ! -d "/home/ostour/birding/.git" ]; then
    print_warning "Removendo diretório birding incompleto..."
    rm -rf /home/ostour/birding
fi

# Clonar ou atualizar repositório
if sudo -u ostour bash << EOF
cd /home/ostour
if [ -d "birding/.git" ]; then
    echo "Repositório já existe, atualizando..."
    cd birding
    git fetch origin
    git checkout $GIT_BRANCH
    git pull origin $GIT_BRANCH
else
    echo "Clonando repositório..."
    git clone -b $GIT_BRANCH $GIT_REPO birding
fi
EOF
then
    print_success "Repositório clonado/atualizado com sucesso"
else
    print_error "Falha ao clonar repositório!"
    print_info "Verifique:"
    print_info "  1. A URL está correta (use HTTPS, não SSH)"
    print_info "  2. Se privado, o token tem permissão 'repo'"
    print_info "  3. O branch '$GIT_BRANCH' existe"
    exit 1
fi

# ============================================
# CONFIGURAR APLICAÇÃO
# ============================================

print_header "11. Configurando Aplicação"

# Criar arquivo .env
cat > /home/ostour/birding/.env << EOF
# Database
DATABASE_URL="postgresql://ostour_user:$DB_PASSWORD@localhost:5432/ostour?schema=public"
DIRECT_URL="postgresql://ostour_user:$DB_PASSWORD@localhost:5432/ostour?schema=public"

# MinIO S3 Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="$MINIO_PASSWORD"
MINIO_BUCKET_NAME="birding-files"
NEXT_PUBLIC_MINIO_PUBLIC_URL="https://$DOMAIN/minio"

# JWT Authentication
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

# Next.js
NEXT_PUBLIC_APP_URL="https://$DOMAIN"
NODE_ENV="production"
OUTPUT="standalone"

# Feature Flags
NEXT_PUBLIC_ENABLE_CLIENTE_PORTAL="false"
NEXT_PUBLIC_ENABLE_FORNECEDOR_PORTAL="false"
EOF

chown ostour:ostour /home/ostour/birding/.env
chmod 600 /home/ostour/birding/.env
print_success "Arquivo .env criado"

# Verificar se Next.js está configurado corretamente
print_info "Configurando Next.js para produção..."

# Atualizar next.config.js para standalone
if [ -f /home/ostour/birding/next.config.js ]; then
    sudo -u ostour bash << 'EOF'
cd /home/ostour/birding

# Backup do config original
cp next.config.js next.config.js.backup

# Adicionar output standalone se não existir
node -e "
const fs = require('fs');
let config = fs.readFileSync('next.config.js', 'utf8');

// Verificar se já tem output: 'standalone'
if (!config.includes(\"output:\")) {
  // Adicionar output standalone
  config = config.replace(
    /const nextConfig = {/,
    \"const nextConfig = {\\n  output: 'standalone',\"
  );
  fs.writeFileSync('next.config.js', config);
  console.log('✓ Configuração standalone adicionada');
} else {
  console.log('✓ Configuração standalone já existe');
}
"
EOF
    print_success "Next.js configurado para standalone"
fi

# Instalar dependências e build
print_info "Instalando dependências (isso pode demorar)..."
if sudo -u ostour bash << 'EOF'
cd /home/ostour/birding

# Limpar cache e builds anteriores
echo "🧹 Limpando cache e builds anteriores..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo

echo "📦 Instalando dependências..."
npm ci --production=false

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    echo "Tentando com npm install..."
    npm install --production=false
    if [ $? -ne 0 ]; then
        echo "❌ Erro fatal ao instalar dependências"
        exit 1
    fi
fi

echo "🔧 Gerando Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar Prisma Client"
    exit 1
fi

echo "�️ Executando migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar migrations"
    exit 1
fi

echo "�🔄 Corrigindo rotas dinâmicas da API..."
if [ -f scripts/fix-all-dynamic-routes.js ]; then
    node scripts/fix-all-dynamic-routes.js
    if [ $? -ne 0 ]; then
        echo "⚠️  Aviso: Erro ao corrigir rotas dinâmicas automaticamente"
        echo "Continuando com build..."
    fi
elif [ -f scripts/fix-dynamic-routes.js ]; then
    node scripts/fix-dynamic-routes.js
fi

# Verificar se todas as rotas têm export const dynamic
echo "🔍 Verificando rotas dinâmicas..."
ROUTES_WITHOUT_DYNAMIC=$(find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | wc -l)
if [ $ROUTES_WITHOUT_DYNAMIC -gt 0 ]; then
    echo "⚠️  Aviso: $ROUTES_WITHOUT_DYNAMIC rotas sem 'export const dynamic'"
    echo "Isso pode causar erros de build. Listando rotas:"
    find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | head -10
fi

echo "🏗️ Buildando aplicação..."
NODE_ENV=production npm run build 2>&1 | tee /tmp/build.log

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar aplicação"
    echo ""
    echo "Últimas 30 linhas do log de build:"
    tail -30 /tmp/build.log
    exit 1
fi

echo "✅ Build concluído com sucesso"
EOF
then
    print_success "Aplicação buildada com sucesso"
else
    print_error "Falha no build da aplicação"
    print_info "Verifique os logs acima para detalhes do erro"
    print_info ""
    print_info "Erros comuns e soluções:"
    print_info "  1. Rotas dinâmicas sem 'export const dynamic = force-dynamic'"
    print_info "     → Execute: node scripts/fix-all-dynamic-routes.js"
    print_info ""
    print_info "  2. Erro de memória (JavaScript heap out of memory)"
    print_info "     → Execute: NODE_OPTIONS='--max-old-space-size=4096' npm run build"
    print_info ""
    print_info "  3. Dependências faltando ou incompatíveis"
    print_info "     → Execute: rm -rf node_modules package-lock.json && npm install"
    print_info ""
    print_info "  4. Prisma Client desatualizado"
    print_info "     → Execute: npx prisma generate"
    exit 1
fi

# Criar diretório de logs
mkdir -p /home/ostour/logs
chown ostour:ostour /home/ostour/logs
print_success "Diretório de logs criado"

# ============================================
# CONFIGURAR PM2
# ============================================

print_header "12. Configurando PM2"

# Criar ecosystem.config.js otimizado para standalone
cat > /home/ostour/birding/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ostour',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/home/ostour/birding',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ostour/logs/err.log',
    out_file: '/home/ostour/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
chown ostour:ostour /home/ostour/birding/ecosystem.config.js
print_success "Ecosystem config criado"

# Iniciar aplicação com PM2
sudo -u ostour bash << EOF
cd /home/ostour/birding
pm2 start ecosystem.config.js
pm2 save
EOF

# Configurar PM2 para iniciar no boot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ostour --hp /home/ostour
print_success "PM2 configurado"

# ============================================
# CONFIGURAR NGINX
# ============================================

print_header "13. Configurando Nginx (HTTP temporário)"

# Primeiro: configuração HTTP apenas para validação SSL
cat > /etc/nginx/sites-available/ostour << 'NGINXEOF'
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 64;
}

upstream minio_api {
    server 127.0.0.1:9000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    access_log /var/log/nginx/ostour_access.log;
    error_log /var/log/nginx/ostour_error.log;
    
    client_max_body_size 100M;
    
    # Permitir validação SSL
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy para aplicação
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Substituir placeholder pelo domínio real
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/ostour

# Ativar site
ln -sf /etc/nginx/sites-available/ostour /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar nginx
nginx -t && systemctl reload nginx
print_success "Nginx configurado (HTTP)"

# ============================================
# CONFIGURAR SSL
# ============================================

print_header "14. Obtendo Certificado SSL"

# Criar diretório para validação
mkdir -p /var/www/html/.well-known/acme-challenge

# Obter certificado SSL
print_info "Obtendo certificado SSL do Let's Encrypt..."

# Verificar se já existe certificado
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "Certificado já existe, expandindo para incluir www..."
    certbot certonly --webroot -w /var/www/html \
        -d $DOMAIN -d www.$DOMAIN \
        --expand \
        --non-interactive \
        --agree-tos \
        --email $SSL_EMAIL
else
    print_info "Obtendo novo certificado SSL..."
    certbot certonly --webroot -w /var/www/html \
        -d $DOMAIN -d www.$DOMAIN \
        --non-interactive \
        --agree-tos \
        --email $SSL_EMAIL
fi

if [ $? -eq 0 ]; then
    print_success "Certificado SSL obtido com sucesso"
else
    print_error "Falha ao obter certificado SSL"
    print_warning "Verifique se o domínio $DOMAIN está apontando para este servidor"
    print_info "Comandos para debug:"
    print_info "  - ping $DOMAIN (deve apontar para este IP)"
    print_info "  - curl -I http://$DOMAIN (deve responder)"
    print_info "  - certbot certificates (listar certificados existentes)"
    print_info ""
    print_info "Para tentar novamente manualmente:"
    print_info "  certbot certonly --webroot -w /var/www/html -d $DOMAIN -d www.$DOMAIN --expand"
    
    read -p "Deseja continuar sem SSL? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
    print_warning "Continuando sem SSL - aplicação acessível via HTTP"
fi

# ============================================
# CONFIGURAR NGINX COM SSL
# ============================================

print_header "15. Configurando Nginx com SSL"

# Verificar se certificados existem
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_info "Configurando Nginx com HTTPS..."
    
    cat > /etc/nginx/sites-available/ostour << 'NGINXEOF'
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 64;
}

upstream minio_api {
    server 127.0.0.1:9000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    access_log /var/log/nginx/ostour_access.log;
    error_log /var/log/nginx/ostour_error.log;

    client_max_body_size 100M;

    location /minio/ {
        proxy_pass http://minio_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
        
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location /minio-console/ {
        proxy_pass http://minio_console/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

    # Substituir placeholder pelo domínio real
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/ostour
    
    # Testar e recarregar nginx
    nginx -t && systemctl reload nginx
    print_success "Nginx configurado com SSL"
    
    # Configurar renovação automática
    print_info "Configurando renovação automática de certificados..."
    (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    print_success "Renovação automática configurada"
else
    print_warning "Certificados SSL não encontrados - mantendo configuração HTTP"
fi

# ============================================
# CONFIGURAR FIREWALL
# ============================================

print_header "16. Configurando Firewall"

ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

print_success "Firewall configurado"

# ============================================
# CONFIGURAR BACKUPS
# ============================================

print_header "17. Configurando Backups Automáticos"

mkdir -p /home/ostour/backups
chown ostour:ostour /home/ostour/backups

# Criar script de backup se não existir
if [ ! -f /home/ostour/backup.sh ]; then
    cat > /home/ostour/backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/home/ostour/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Iniciando backup: $DATE"

# Backup do banco de dados
pg_dump -U ostour_user ostour | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos arquivos MinIO
tar -czf $BACKUP_DIR/minio_$DATE.tar.gz /data/minio 2>/dev/null || true

# Backup do .env
cp /home/ostour/birding/.env $BACKUP_DIR/env_$DATE.backup

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup concluído: $DATE"
BACKUPEOF

    chmod +x /home/ostour/backup.sh
    chown ostour:ostour /home/ostour/backup.sh
fi

# Adicionar ao crontab do usuário ostour
sudo -u ostour bash << EOF
(crontab -l 2>/dev/null | grep -v backup.sh; echo "0 2 * * * /home/ostour/backup.sh >> /home/ostour/logs/backup.log 2>&1") | crontab -
EOF

print_success "Backups automáticos configurados (diariamente às 2h)"

# ============================================
# CRIAR USUÁRIO ADMIN
# ============================================

print_header "18. Criar Usuário Administrador"

read -p "Deseja criar um usuário admin agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Nome do admin: " ADMIN_NAME
    read -p "Email do admin: " ADMIN_EMAIL
    read -sp "Senha do admin: " ADMIN_PASSWORD
    echo
    
    sudo -u ostour bash << EOF
cd /home/ostour/birding
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('$ADMIN_PASSWORD', 10);
    
    // Criar organização
    const org = await prisma.organizacao.create({
      data: { nome: 'Organização Principal' }
    });
    
    // Criar usuário admin
    const user = await prisma.usuario.create({
      data: {
        orgId: org.id,
        nome: '$ADMIN_NAME',
        email: '$ADMIN_EMAIL',
        hashSenha: hash,
        roleGlobal: 'admin',
        ativo: true
      }
    });
    
    console.log('✓ Usuário admin criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar admin:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
"
EOF
    print_success "Usuário admin criado"
fi

# ============================================
# FINALIZAÇÃO
# ============================================

print_header "🎉 Instalação Concluída!"

echo ""
print_success "Aplicação instalada e configurada com sucesso!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Informações Importantes:"
echo ""
echo "🌐 URL da Aplicação: https://$DOMAIN"
echo "🔐 Console MinIO: https://$DOMAIN/minio-console/"
echo "   Usuário: minioadmin"
echo "   Senha: $MINIO_PASSWORD"
echo ""
echo "🗄️ Banco de Dados:"
echo "   Host: localhost:5432"
echo "   Database: ostour"
echo "   Usuário: ostour_user"
echo "   Senha: $DB_PASSWORD"
echo ""
echo "📁 Diretórios:"
echo "   Aplicação: /home/ostour/birding"
echo "   Logs: /home/ostour/logs"
echo "   Backups: /home/ostour/backups"
echo ""
echo "🔧 Comandos Úteis:"
echo "   Ver logs: sudo -u ostour pm2 logs ostour"
echo "   Status: sudo -u ostour pm2 status"
echo "   Reiniciar: sudo -u ostour pm2 restart ostour"
echo "   Deploy: sudo -u ostour /home/ostour/birding/deploy.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Salvar informações em arquivo
cat > /home/ostour/INSTALACAO_INFO.txt << EOF
Instalação OS/Tour - $(date)

URL: https://$DOMAIN
Email SSL: $SSL_EMAIL

MinIO Console: https://$DOMAIN/minio-console/
MinIO User: minioadmin
MinIO Password: $MINIO_PASSWORD

Database: ostour
DB User: ostour_user
DB Password: $DB_PASSWORD

JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET

Repositório: $GIT_REPO
Branch: $GIT_BRANCH
EOF

chmod 600 /home/ostour/INSTALACAO_INFO.txt
chown ostour:ostour /home/ostour/INSTALACAO_INFO.txt

print_info "Informações salvas em: /home/ostour/INSTALACAO_INFO.txt"
print_warning "IMPORTANTE: Guarde essas informações em local seguro!"

echo ""
print_success "Instalação finalizada! Acesse https://$DOMAIN"
