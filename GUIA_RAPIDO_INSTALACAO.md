# 🚀 Guia Rápido de Instalação

## Problema Resolvido

O script agora:
- ✅ Aceita URLs HTTPS (recomendado)
- ✅ Converte automaticamente SSH para HTTPS
- ✅ Suporta repositórios privados com Personal Access Token
- ✅ Melhor tratamento de erros

## Como Executar

### 1. Fazer upload do script corrigido

```bash
# Do seu computador local
scp install-vps.sh root@seu-servidor-ip:/root/
```

### 2. No servidor VPS

```bash
# Conectar
ssh root@seu-servidor-ip

# Limpar instalação anterior (se necessário)
sudo systemctl stop minio 2>/dev/null || true
sudo -u ostour pm2 delete all 2>/dev/null || true
sudo userdel -r ostour 2>/dev/null || true
sudo userdel -r minio-user 2>/dev/null || true
sudo rm -rf /home/ostour /data/minio
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ostour; DROP USER IF EXISTS ostour_user;" 2>/dev/null || true

# Dar permissão e executar
chmod +x install-vps.sh
./install-vps.sh
```

## 📝 Informações que o Script Vai Solicitar

### 1. Domínio
```
Digite seu domínio (ex: ostour.com.br): seu-dominio.com
```

### 2. Email SSL
```
Digite seu email para certificado SSL: seu@email.com
```

### 3. Senha PostgreSQL
```
Digite uma senha segura para o banco PostgreSQL: ********
```

### 4. Senha MinIO
```
Digite uma senha segura para o MinIO (min 8 caracteres): ********
```

### 5. URL do Repositório

**Para repositório PÚBLICO:**
```
Digite a URL do repositório Git (HTTPS): https://github.com/usuario/repo.git
O repositório é privado? (s/n): n
```

**Para repositório PRIVADO:**
```
Digite a URL do repositório Git (HTTPS): https://github.com/usuario/repo.git
O repositório é privado? (s/n): s
Digite seu GitHub username: seu-usuario
Digite seu Personal Access Token: ghp_xxxxxxxxxxxx
```

### 6. Branch
```
Digite o branch (padrão: main): main
```

### 7. Usuário Admin (opcional)
```
Deseja criar um usuário admin agora? (s/n): s
Nome do admin: Administrador
Email do admin: admin@ostour.com
Senha do admin: ********
```

## 🔑 Como Obter Personal Access Token (Repositório Privado)

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note**: `Deploy VPS OS/Tour`
   - **Expiration**: `No expiration` ou escolha um período
   - **Select scopes**: Marque `repo` (acesso completo ao repositório)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você não verá novamente!)
6. Use esse token no script quando solicitado

## ⚠️ Importante

- **Use HTTPS**, não SSH: `https://github.com/...` ✅
- Se colar URL SSH (`git@github.com:...`), o script converte automaticamente
- Para repositórios privados, o token precisa ter permissão `repo`
- Guarde as senhas em local seguro!

## 🎯 Após a Instalação

O script exibirá:
```
🌐 URL da Aplicação: https://seu-dominio.com
🔐 Console MinIO: https://seu-dominio.com/minio-console/
📁 Informações salvas em: /home/ostour/INSTALACAO_INFO.txt
```

## 🔧 Comandos Úteis Pós-Instalação

```bash
# Ver logs da aplicação
sudo -u ostour pm2 logs ostour

# Status da aplicação
sudo -u ostour pm2 status

# Reiniciar aplicação
sudo -u ostour pm2 restart ostour

# Ver logs do Nginx
sudo tail -f /var/log/nginx/ostour_error.log

# Verificar serviços
sudo systemctl status postgresql
sudo systemctl status minio
sudo systemctl status nginx
```

## 🐛 Troubleshooting

### Erro ao clonar repositório

**Sintoma:**
```
Permission denied (publickey)
```

**Solução:**
- Use URL HTTPS, não SSH
- Para privado, verifique se o token tem permissão `repo`
- Verifique se o branch existe

### Certificado SSL falhou

**Sintoma:**
```
Failed to obtain certificate
```

**Solução:**
- Verifique se o DNS está apontando para o IP do servidor
- Aguarde alguns minutos para propagação do DNS
- Execute manualmente: `sudo certbot --nginx -d seu-dominio.com`

### Aplicação não inicia

**Sintoma:**
```
pm2 status mostra "errored"
```

**Solução:**
```bash
# Ver logs de erro
sudo -u ostour pm2 logs ostour --err

# Verificar se build foi feito
cd /home/ostour/birding
sudo -u ostour npm run build

# Reiniciar
sudo -u ostour pm2 restart ostour
```

## ✅ Checklist Final

- [ ] DNS apontando para o IP do servidor
- [ ] Script executado sem erros
- [ ] Aplicação acessível via HTTPS
- [ ] Certificado SSL válido (cadeado verde)
- [ ] Login funcionando
- [ ] Upload de arquivos funcionando (MinIO)
- [ ] Backups configurados (verificar `/home/ostour/backups`)

## 📞 Precisa Reexecutar?

Se algo deu errado e precisa começar do zero:

```bash
# Limpar tudo
sudo systemctl stop minio nginx
sudo -u ostour pm2 delete all
sudo userdel -r ostour
sudo userdel -r minio-user
sudo rm -rf /home/ostour /data/minio /etc/nginx/sites-*/ostour
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ostour; DROP USER IF EXISTS ostour_user;"

# Executar novamente
./install-vps.sh
```
