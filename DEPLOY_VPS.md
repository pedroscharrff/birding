# Guia de Deploy em VPS

Este guia detalha como fazer deploy da aplicação OS/Tour em um VPS próprio usando Ubuntu/Debian.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso SSH root ou sudo
- Domínio apontando para o IP do VPS (opcional, mas recomendado)
- Mínimo 2GB RAM, 2 CPU cores, 20GB disco

## 🚀 Passo 1: Preparar o Servidor

### 1.1 Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar dependências básicas

```bash
sudo apt install -y curl git build-essential
```

### 1.3 Instalar Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar instalação
npm --version
```

### 1.4 Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.5 Configurar PostgreSQL

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Dentro do psql, executar:
CREATE DATABASE ostour;
CREATE USER ostour_user WITH PASSWORD 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE ostour TO ostour_user;
ALTER DATABASE ostour OWNER TO ostour_user;
\q
```

### 1.6 Instalar MinIO (Storage S3-compatible)

```bash
# Baixar MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Criar diretório para dados
sudo mkdir -p /data/minio
sudo useradd -r minio-user -s /sbin/nologin
sudo chown minio-user:minio-user /data/minio
```

### 1.7 Configurar MinIO como serviço

Criar arquivo `/etc/systemd/system/minio.service`:

```bash
sudo nano /etc/systemd/system/minio.service
```

Conteúdo:

```ini
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
Environment="MINIO_ROOT_PASSWORD=SuaSenhaSegura123"
Environment="MINIO_VOLUMES=/data/minio"
Environment="MINIO_OPTS=--console-address :9001"

ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES

Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

Iniciar MinIO:

```bash
sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio
sudo systemctl status minio
```

### 1.8 Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.9 Instalar Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔧 Passo 2: Configurar a Aplicação

### 2.1 Criar usuário para a aplicação

```bash
sudo useradd -m -s /bin/bash ostour
sudo su - ostour
```

### 2.2 Clonar o repositório

```bash
cd ~
git clone <URL_DO_SEU_REPOSITORIO> birding
cd birding
```

### 2.3 Instalar dependências

```bash
npm install
```

### 2.4 Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Configurar o arquivo `.env`:

```env
# Database
DATABASE_URL="postgresql://ostour_user:sua_senha_segura_aqui@localhost:5432/ostour?schema=public"
DIRECT_URL="postgresql://ostour_user:sua_senha_segura_aqui@localhost:5432/ostour?schema=public"

# MinIO S3 Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="SuaSenhaSegura123"
MINIO_BUCKET_NAME="birding-files"
NEXT_PUBLIC_MINIO_PUBLIC_URL="https://seu-dominio.com/minio"

# JWT Authentication
JWT_SECRET="gere_uma_chave_aleatoria_segura_aqui_min_32_chars"
JWT_REFRESH_SECRET="gere_outra_chave_aleatoria_diferente_min_32_chars"

# Next.js
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
NODE_ENV="production"

# Feature Flags
NEXT_PUBLIC_ENABLE_CLIENTE_PORTAL="false"
NEXT_PUBLIC_ENABLE_FORNECEDOR_PORTAL="false"
```

**Gerar chaves JWT seguras:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.5 Executar migrations do banco

```bash
npx prisma generate
npx prisma migrate deploy
```

### 2.6 (Opcional) Popular banco com dados iniciais

```bash
npm run db:seed
```

### 2.7 Build da aplicação

```bash
npm run build
```

## 🚀 Passo 3: Configurar PM2

### 3.1 Criar arquivo de configuração PM2

Criar `ecosystem.config.js`:

```bash
nano ecosystem.config.js
```

Conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'ostour',
    script: 'npm',
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
    max_memory_restart: '1G'
  }]
};
```

### 3.2 Criar diretório de logs

```bash
mkdir -p /home/ostour/logs
```

### 3.3 Iniciar aplicação com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copiar e executar o comando que o PM2 mostrar.

### 3.4 Verificar status

```bash
pm2 status
pm2 logs ostour
```

## 🌐 Passo 4: Configurar Nginx

### 4.1 Criar configuração do site

```bash
sudo nano /etc/nginx/sites-available/ostour
```

Conteúdo:

```nginx
# Upstream para a aplicação Next.js
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Upstream para MinIO Console
upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 64;
}

# Upstream para MinIO API
upstream minio_api {
    server 127.0.0.1:9000;
    keepalive 64;
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    return 301 https://$server_name$request_uri;
}

# Servidor principal HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # Certificados SSL (configurar depois com Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/ostour_access.log;
    error_log /var/log/nginx/ostour_error.log;

    # Tamanho máximo de upload
    client_max_body_size 100M;

    # MinIO API (para uploads/downloads de arquivos)
    location /minio/ {
        proxy_pass http://minio_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }

    # MinIO Console (admin)
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

    # Aplicação Next.js
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para assets estáticos
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

### 4.2 Ativar o site

```bash
sudo ln -s /etc/nginx/sites-available/ostour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Passo 5: Configurar SSL com Let's Encrypt

### 5.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obter certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 5.3 Renovação automática

```bash
sudo certbot renew --dry-run
```

O Certbot configura automaticamente a renovação via cron.

## 🔥 Passo 6: Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

## 📊 Passo 7: Monitoramento e Manutenção

### Verificar logs da aplicação

```bash
pm2 logs ostour
pm2 monit
```

### Verificar logs do Nginx

```bash
sudo tail -f /var/log/nginx/ostour_access.log
sudo tail -f /var/log/nginx/ostour_error.log
```

### Verificar logs do PostgreSQL

```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Verificar logs do MinIO

```bash
sudo journalctl -u minio -f
```

## 🔄 Atualizações da Aplicação

### Script de deploy automático

Criar `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Ir para o diretório da aplicação
cd /home/ostour/birding

# Fazer backup do banco (opcional)
echo "📦 Fazendo backup do banco..."
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
```

Tornar executável:

```bash
chmod +x deploy.sh
```

Executar deploy:

```bash
./deploy.sh
```

## 🔐 Segurança Adicional

### 1. Configurar fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Desabilitar login root via SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Alterar:
```
PermitRootLogin no
PasswordAuthentication no  # Se usar chaves SSH
```

```bash
sudo systemctl restart sshd
```

### 3. Configurar backup automático

Criar script `/home/ostour/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ostour/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -U ostour_user ostour | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos arquivos MinIO
tar -czf $BACKUP_DIR/minio_$DATE.tar.gz /data/minio

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

Adicionar ao crontab:

```bash
crontab -e
```

Adicionar linha:
```
0 2 * * * /home/ostour/backup.sh >> /home/ostour/logs/backup.log 2>&1
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
pm2 logs ostour --lines 100
```

### Erro de conexão com banco

```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1"
```

### MinIO não acessível

```bash
sudo systemctl status minio
sudo journalctl -u minio -n 50
```

### Nginx retorna 502

```bash
sudo nginx -t
sudo systemctl status nginx
curl http://localhost:3000  # Testar se Next.js está rodando
```

## 📝 Checklist Final

- [ ] PostgreSQL instalado e configurado
- [ ] MinIO instalado e rodando
- [ ] Aplicação buildada com sucesso
- [ ] PM2 gerenciando a aplicação
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] Monitoramento configurado
- [ ] DNS apontando para o servidor
- [ ] Testar todas as funcionalidades principais

## 🌟 Melhorias Opcionais

1. **CDN**: Usar Cloudflare para cache e proteção DDoS
2. **Monitoring**: Instalar Grafana + Prometheus
3. **Logs centralizados**: Configurar ELK Stack ou Loki
4. **CI/CD**: Configurar GitHub Actions para deploy automático
5. **Staging**: Criar ambiente de staging separado
6. **Redis**: Adicionar cache com Redis
7. **Load Balancer**: Se escalar, usar múltiplas instâncias

## 📞 Suporte

Para problemas específicos, verificar:
- Logs da aplicação: `pm2 logs`
- Logs do sistema: `journalctl -xe`
- Status dos serviços: `systemctl status <serviço>`
