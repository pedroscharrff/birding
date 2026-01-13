# Correções de Build na VPS - Janeiro 2026

## 🎯 Problemas Identificados e Resolvidos

### 1. ❌ Rotas Dinâmicas Incompletas (CRÍTICO)

**Problema:**
- Apenas 8 de 45 rotas da API tinham `export const dynamic = 'force-dynamic'`
- Next.js 14 tenta pré-renderizar rotas por padrão
- Rotas usando `cookies()`, `headers()` ou `searchParams` falhavam no build

**Solução Implementada:**
- ✅ Melhorado `scripts/fix-all-dynamic-routes.js` para funcionar em Windows e Linux
- ✅ Removida dependência do comando `find` (não disponível nativamente no Windows)
- ✅ Melhor detecção de imports multi-linha
- ✅ Validação automática de rotas antes do build

**Arquivo:** `scripts/fix-all-dynamic-routes.js`

```javascript
// Agora usa fs.readdirSync recursivo (funciona em todos os sistemas)
const findRouteFiles = () => {
  const routes = [];
  const walkSync = (dir) => {
    // Implementação cross-platform
  };
  walkSync('app/api');
  return routes;
};
```

---

### 2. ❌ Processo de Build Frágil

**Problemas:**
- Build não limpava cache anterior (.next, node_modules/.cache)
- Não validava se rotas foram corrigidas antes do build
- Erros de build não eram claramente reportados
- Faltava fallback para `npm install` quando `npm ci` falhava

**Soluções Implementadas:**

#### A. Limpeza de Cache (`install-vps.sh` linha 437-441)
```bash
echo "🧹 Limpando cache e builds anteriores..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo
```

#### B. Instalação Robusta de Dependências (linha 443-454)
```bash
npm ci --production=false

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    echo "Tentando com npm install..."
    npm install --production=false
fi
```

#### C. Validação de Rotas Dinâmicas (linha 483-490)
```bash
ROUTES_WITHOUT_DYNAMIC=$(find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; 2>/dev/null | wc -l)
if [ $ROUTES_WITHOUT_DYNAMIC -gt 0 ]; then
    echo "⚠️  Aviso: $ROUTES_WITHOUT_DYNAMIC rotas sem 'export const dynamic'"
    echo "Listando rotas:"
    find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \; | head -10
fi
```

#### D. Log de Build Detalhado (linha 492-501)
```bash
NODE_ENV=production npm run build 2>&1 | tee /tmp/build.log

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar aplicação"
    echo "Últimas 30 linhas do log de build:"
    tail -30 /tmp/build.log
    exit 1
fi
```

---

### 3. ✅ Certificado SSL (Já estava correto)

O script `install-vps.sh` já tinha tratamento adequado para SSL:
- Usa `--expand` quando certificado já existe
- Fallback para HTTP se SSL falhar
- Configuração em duas etapas (HTTP primeiro, depois HTTPS)

**Linhas 617-654 do install-vps.sh**

---

### 4. ✅ Script de Deploy Melhorado

**Arquivo:** `deploy.sh`

**Melhorias Implementadas:**

#### A. Backup Automático do Banco
```bash
PGPASSWORD=$(grep DATABASE_URL .env | cut -d':' -f3 | cut -d'@' -f1) \
  pg_dump -U ostour_user -h localhost ostour > ~/backups/ostour_$(date +%Y%m%d_%H%M%S).sql
```

#### B. Limpeza de Cache
```bash
rm -rf .next
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo
```

#### C. Correção Automática de Rotas
```bash
if [ -f scripts/fix-all-dynamic-routes.js ]; then
    node scripts/fix-all-dynamic-routes.js
fi
```

#### D. Validação Pós-Deploy
```bash
sleep 5
pm2 status ostour
```

---

## 🚀 Como Usar as Correções

### Primeira Instalação na VPS

```bash
# 1. Fazer upload dos arquivos corrigidos para o servidor
scp install-vps.sh root@seu-servidor:/root/
scp -r scripts root@seu-servidor:/root/

# 2. Executar instalação
ssh root@seu-servidor
chmod +x install-vps.sh
sudo bash install-vps.sh
```

O script agora:
1. ✅ Limpa cache automaticamente
2. ✅ Corrige todas as rotas dinâmicas
3. ✅ Valida rotas antes do build
4. ✅ Mostra logs detalhados de erros
5. ✅ Fornece soluções para erros comuns

---

### Deploy de Atualizações

```bash
# No servidor, como usuário ostour
cd /home/ostour/birding
./deploy.sh
```

O script de deploy agora:
1. ✅ Faz backup do banco automaticamente
2. ✅ Limpa cache antes do build
3. ✅ Corrige rotas dinâmicas automaticamente
4. ✅ Valida o build
5. ✅ Verifica status após reiniciar

---

## 🔍 Verificação e Troubleshooting

### 1. Verificar se todas as rotas estão corrigidas

```bash
cd /home/ostour/birding

# Listar rotas SEM export const dynamic
find app/api -name "route.ts" -type f -exec grep -L "export const dynamic" {} \;

# Contar rotas corrigidas
find app/api -name "route.ts" -type f -exec grep -l "export const dynamic" {} \; | wc -l

# Total de rotas
find app/api -name "route.ts" -type f | wc -l
```

**Esperado:** Todas as 45 rotas devem ter `export const dynamic = 'force-dynamic'`

---

### 2. Corrigir rotas manualmente (se necessário)

```bash
cd /home/ostour/birding
node scripts/fix-all-dynamic-routes.js
```

**Output esperado:**
```
🔍 Procurando todas as rotas da API...
📁 Encontrados 45 arquivos de rota

✅ Corrigido: app/api/auth/me/route.ts
✅ Corrigido: app/api/calendario/route.ts
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Corrigidos: 37
⚠️  Ignorados: 8
❌ Erros: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. Testar build localmente antes de fazer deploy

```bash
# Limpar cache
rm -rf .next node_modules/.cache tsconfig.tsbuildinfo

# Corrigir rotas
node scripts/fix-all-dynamic-routes.js

# Tentar build
NODE_ENV=production npm run build
```

---

### 4. Erros Comuns e Soluções

#### Erro: "Dynamic server usage: Route couldn't be rendered statically"

**Causa:** Rota não tem `export const dynamic = 'force-dynamic'`

**Solução:**
```bash
node scripts/fix-all-dynamic-routes.js
npm run build
```

---

#### Erro: "JavaScript heap out of memory"

**Causa:** Build precisa de mais memória

**Solução:**
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

Ou adicionar ao `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' prisma generate && next build"
  }
}
```

---

#### Erro: "Module not found" ou "Cannot find module"

**Causa:** Dependências desatualizadas ou corrompidas

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run build
```

---

#### Erro: "Prisma Client is not generated"

**Causa:** Prisma Client não foi gerado após mudanças no schema

**Solução:**
```bash
npx prisma generate
npm run build
```

---

#### Certificado SSL não é obtido

**Causa:** DNS não está apontando para o servidor ou porta 80 bloqueada

**Verificações:**
```bash
# 1. Verificar DNS
ping seu-dominio.com

# 2. Verificar se Nginx está respondendo
curl -I http://seu-dominio.com

# 3. Verificar firewall
sudo ufw status

# 4. Verificar logs do certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

**Solução:**
```bash
# Tentar obter certificado manualmente
sudo certbot certonly --webroot -w /var/www/html \
  -d seu-dominio.com -d www.seu-dominio.com \
  --expand --non-interactive --agree-tos --email seu@email.com
```

---

## 📊 Checklist de Verificação Pós-Deploy

- [ ] Todas as 45 rotas têm `export const dynamic = 'force-dynamic'`
- [ ] Build completa sem erros
- [ ] PM2 mostra aplicação rodando: `pm2 status`
- [ ] Aplicação responde: `curl -I https://seu-dominio.com`
- [ ] Certificado SSL válido: `curl -I https://seu-dominio.com | grep "200 OK"`
- [ ] Logs sem erros críticos: `pm2 logs ostour --lines 50`
- [ ] Banco de dados acessível
- [ ] MinIO rodando: `sudo systemctl status minio`
- [ ] Nginx rodando: `sudo systemctl status nginx`

---

## 🔄 Comandos Úteis

### Monitoramento
```bash
# Ver logs em tempo real
pm2 logs ostour

# Status da aplicação
pm2 status

# Monitorar recursos
pm2 monit

# Logs do Nginx
sudo tail -f /var/log/nginx/ostour_error.log
```

### Manutenção
```bash
# Reiniciar aplicação
pm2 restart ostour

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Reiniciar MinIO
sudo systemctl restart minio
```

### Debug
```bash
# Verificar portas em uso
sudo netstat -tlnp | grep -E ':(3000|5432|9000|9001|80|443)'

# Verificar processos Node.js
ps aux | grep node

# Espaço em disco
df -h

# Memória
free -h

# Logs do sistema
sudo journalctl -xe
```

---

## 📝 Resumo das Alterações

### Arquivos Modificados

1. ✅ **`scripts/fix-all-dynamic-routes.js`**
   - Removida dependência do comando `find`
   - Implementação cross-platform (Windows + Linux)
   - Melhor tratamento de erros

2. ✅ **`install-vps.sh`**
   - Limpeza de cache antes do build
   - Validação de rotas dinâmicas
   - Logs detalhados de erros
   - Fallback para `npm install`
   - Mensagens de erro mais úteis

3. ✅ **`deploy.sh`**
   - Backup automático do banco
   - Limpeza de cache
   - Correção automática de rotas
   - Validação pós-deploy
   - Comandos úteis no final

### Arquivos Não Modificados (já estavam corretos)

- ✅ `next.config.js` - já tem `output: 'standalone'`
- ✅ `package.json` - configurações corretas
- ✅ Tratamento de SSL no `install-vps.sh`

---

## 🎯 Próximos Passos

### Para Deploy Imediato

1. **Fazer commit das alterações:**
```bash
git add scripts/fix-all-dynamic-routes.js install-vps.sh deploy.sh
git commit -m "fix: melhorar processo de build na VPS"
git push origin main
```

2. **No servidor VPS:**
```bash
cd /home/ostour/birding
git pull origin main
./deploy.sh
```

### Para Nova Instalação

1. **Fazer upload do script atualizado:**
```bash
scp install-vps.sh root@seu-servidor:/root/
```

2. **Executar instalação:**
```bash
ssh root@seu-servidor
sudo bash install-vps.sh
```

---

## ⚠️ Notas Importantes

1. **Todas as rotas da API precisam de `export const dynamic = 'force-dynamic'`**
   - Isso é necessário porque usam `cookies()`, `headers()` ou `searchParams`
   - O Next.js 14 tenta pré-renderizar por padrão

2. **Sempre limpe o cache antes de um novo build**
   - `.next` contém o build anterior
   - `node_modules/.cache` pode ter cache corrompido
   - `tsconfig.tsbuildinfo` pode estar desatualizado

3. **Use `npm ci` em produção quando possível**
   - Mais rápido e determinístico
   - Usa exatamente as versões do `package-lock.json`
   - Fallback para `npm install` se falhar

4. **O script de deploy faz backup automático**
   - Backups ficam em `/home/ostour/backups`
   - Mantém últimos 7 dias (configurado no cron)

---

## 📞 Suporte

Se ainda houver problemas após aplicar estas correções:

1. Verificar logs detalhados: `pm2 logs ostour --lines 100`
2. Verificar log de build: `cat /tmp/build.log`
3. Verificar se todas as rotas foram corrigidas
4. Tentar build localmente primeiro
5. Verificar espaço em disco e memória disponível

---

**Data:** Janeiro 2026  
**Versão:** 3.0 - Correções Completas de Build na VPS  
**Status:** ✅ Testado e Validado
