# Correção do Erro SSL no Servidor

## Problema Identificado

O Nginx está tentando carregar certificados SSL que ainda não existem, causando falha na configuração.

## Solução Rápida (No Servidor)

Execute os seguintes comandos no servidor como root:

```bash
# 1. Remover configuração atual do Nginx
rm /etc/nginx/sites-enabled/ostour

# 2. Criar configuração HTTP temporária
cat > /etc/nginx/sites-available/ostour << 'EOF'
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name birding.b4b.agency www.birding.b4b.agency;
    
    access_log /var/log/nginx/ostour_access.log;
    error_log /var/log/nginx/ostour_error.log;
    
    client_max_body_size 100M;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
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
    }
}
EOF

# 3. Ativar configuração
ln -sf /etc/nginx/sites-available/ostour /etc/nginx/sites-enabled/

# 4. Testar e recarregar Nginx
nginx -t && systemctl reload nginx

# 5. Obter certificado SSL
mkdir -p /var/www/html/.well-known/acme-challenge
certbot certonly --webroot -w /var/www/html -d birding.b4b.agency -d www.birding.b4b.agency --non-interactive --agree-tos --email seu-email@exemplo.com

# 6. Após obter o certificado, configurar HTTPS
cat > /etc/nginx/sites-available/ostour << 'EOF'
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
    server_name birding.b4b.agency www.birding.b4b.agency;
    
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
    server_name birding.b4b.agency www.birding.b4b.agency;

    ssl_certificate /etc/letsencrypt/live/birding.b4b.agency/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/birding.b4b.agency/privkey.pem;
    
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
EOF

# 7. Testar e recarregar Nginx novamente
nginx -t && systemctl reload nginx

# 8. Configurar renovação automática
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
```

## Verificações

```bash
# Verificar se a aplicação está rodando
sudo -u ostour pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/ostour_error.log

# Verificar se o certificado foi obtido
ls -la /etc/letsencrypt/live/birding.b4b.agency/

# Testar acesso
curl -I http://birding.b4b.agency
curl -I https://birding.b4b.agency
```

## Próximos Passos

Após corrigir o SSL, use o script atualizado `install-vps.sh` para futuras instalações. O script foi corrigido para:

1. Configurar Nginx com HTTP primeiro
2. Obter certificado SSL
3. Reconfigurar Nginx com HTTPS apenas se o certificado existir
4. Incluir tratamento de erros e fallback para HTTP

## Observações Importantes

- **Certifique-se** de que o DNS do domínio está apontando para o IP do servidor antes de obter o certificado SSL
- O Let's Encrypt tem limite de requisições. Evite múltiplas tentativas em curto período
- Se o certificado falhar, a aplicação continuará funcionando via HTTP
