# Correções do Script de Instalação VPS

## Problemas Identificados e Soluções

### 1. ❌ Erro de Certificado SSL

**Problema:**
```
Missing command line flag or config entry for this setting:
You have an existing certificate that contains a portion of the domains you requested
Do you want to expand and replace this existing certificate with the new certificate?
```

**Causa:** O certbot estava tentando adicionar `www.dominio.com` a um certificado existente que só tinha `dominio.com`, mas não tinha a flag `--expand`.

**Solução:**
- Adicionado verificação se o certificado já existe
- Usado flag `--expand` automaticamente quando necessário
- Melhoradas mensagens de erro com comandos de debug

```bash
# Verificar se já existe certificado
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    certbot certonly --webroot -w /var/www/html \
        -d $DOMAIN -d www.$DOMAIN \
        --expand \
        --non-interactive \
        --agree-tos \
        --email $SSL_EMAIL
fi
```

---

### 2. ❌ Erros de Compilação do Next.js

**Problema:**
```
Dynamic server usage: Route /api/alerts couldn't be rendered statically 
because it used `nextUrl.searchParams`
```

**Causa:** Next.js 13+ tenta pré-renderizar rotas estáticas por padrão. Rotas que usam `cookies()`, `headers()` ou `searchParams` precisam ser marcadas como dinâmicas.

**Solução:**

#### A. Configuração do Next.js
Adicionado `output: 'standalone'` no `next.config.js`:

```javascript
const nextConfig = {
  output: 'standalone',
  // ... outras configurações
}
```

#### B. Marcação de Rotas Dinâmicas
Criado script `scripts/fix-all-dynamic-routes.js` que:
- Detecta automaticamente todas as rotas da API
- Identifica corretamente imports multi-linha
- Remove exports dinâmicos mal posicionados
- Adiciona `export const dynamic = 'force-dynamic'` no local correto

```typescript
export const dynamic = 'force-dynamic'
```

**Importante:** O script lida corretamente com imports multi-linha como:
```typescript
import {
  funcao1,
  funcao2
} from '@/lib/modulo'
```

#### C. Integração no Script de Instalação
O script agora executa automaticamente a correção antes do build:

```bash
echo "🔄 Corrigindo rotas dinâmicas da API..."
if [ -f scripts/fix-dynamic-routes.js ]; then
    node scripts/fix-dynamic-routes.js
fi
```

---

### 3. ❌ Erro de Imports Multi-linha

**Problema:**
```
Error: cannot import as reserved word
import { 

export const dynamic = 'force-dynamic'
  getFluxoCaixaCache, 
  setFluxoCaixaCache 
} from '@/lib/cache/financeiro-cache'
```

**Causa:** O script `fix-dynamic-routes.js` estava inserindo `export const dynamic` no meio de imports multi-linha, quebrando a sintaxe.

**Solução:**
Criado novo script `fix-all-dynamic-routes.js` que:
- Detecta corretamente imports multi-linha (que começam com `{` mas não terminam com `}`)
- Rastreia o estado `inMultiLineImport` até encontrar o `}`
- Remove qualquer `export const dynamic` mal posicionado
- Adiciona a declaração no local correto após **todos** os imports

**Arquivos corrigidos manualmente:**
- ✅ `app/api/financeiro/fluxo-caixa/route.ts`
- ✅ `app/api/financeiro/resumo/route.ts`
- ✅ `app/api/os/[id]/financeiro/route.ts`

---

### 4. ✅ Melhorias no Processo de Build

**Adicionado:**
- Validação de cada etapa do build (npm install, prisma generate, migrations, build)
- Mensagens de erro detalhadas com emojis
- Exit codes apropriados para falhas
- Backup automático do `next.config.js` antes de modificações
- Script melhorado que detecta e corrige automaticamente todas as rotas

```bash
if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar aplicação"
    exit 1
fi
```

---

### 4. ✅ Configuração Otimizada do PM2

**Melhorias:**
- Script direto para o binário do Next.js
- Configurações de restart mais robustas
- Limites de memória e uptime mínimo

```javascript
{
  script: './node_modules/next/dist/bin/next',
  args: 'start',
  max_memory_restart: '1G',
  max_restarts: 10,
  min_uptime: '10s'
}
```

---

## Rotas Corrigidas

As seguintes rotas da API foram configuradas como dinâmicas:

- ✅ `/api/alerts` - usa searchParams
- ✅ `/api/auth/me` - usa cookies
- ✅ `/api/auth/logout` - usa cookies
- ✅ `/api/calendario` - usa cookies
- ✅ `/api/config/presets/*` - usa cookies
- ✅ `/api/cotacoes` - usa cookies
- ✅ `/api/dashboard/stats` - usa cookies
- ✅ `/api/debug/*` - usa cookies
- ✅ `/api/financeiro/*` - usa cookies
- ✅ `/api/fornecedores` - usa cookies
- ✅ `/api/notifications` - usa cookies
- ✅ `/api/os` - usa cookies
- ✅ `/api/policies` - usa cookies
- ✅ `/api/storage/list` - usa cookies
- ✅ `/api/usuarios` - usa cookies

---

## Como Usar o Script Corrigido

### 1. Primeira Instalação

```bash
sudo bash install-vps.sh
```

O script irá:
1. ✅ Coletar informações (domínio, email, senhas)
2. ✅ Instalar dependências do sistema
3. ✅ Configurar PostgreSQL e MinIO
4. ✅ Clonar repositório
5. ✅ Configurar Next.js para standalone
6. ✅ Corrigir rotas dinâmicas automaticamente
7. ✅ Buildar aplicação
8. ✅ Configurar Nginx com HTTP
9. ✅ Obter certificado SSL (com --expand se necessário)
10. ✅ Configurar Nginx com HTTPS
11. ✅ Configurar PM2 e backups

### 2. Reinstalação/Atualização

Se você já tem um certificado SSL e está reinstalando:

```bash
# O script detectará automaticamente e usará --expand
sudo bash install-vps.sh
```

### 3. Correção Manual de Rotas (se necessário)

```bash
cd /home/ostour/birding
node scripts/fix-dynamic-routes.js
npm run build
pm2 restart ostour
```

---

## Verificação Pós-Instalação

### 1. Verificar Build

```bash
sudo -u ostour pm2 logs ostour --lines 50
```

**Esperado:** Nenhum erro de "Dynamic server usage"

### 2. Verificar SSL

```bash
certbot certificates
```

**Esperado:** Certificado com ambos os domínios:
- ✅ dominio.com
- ✅ www.dominio.com

### 3. Verificar Aplicação

```bash
curl -I https://seu-dominio.com
```

**Esperado:** Status 200 OK

---

## Troubleshooting

### Build ainda falha com erros de rotas dinâmicas

```bash
# Execute o script de correção manualmente
cd /home/ostour/birding
node scripts/fix-dynamic-routes.js

# Verifique se foi aplicado
grep -r "export const dynamic" app/api/
```

### Certificado SSL não é obtido

```bash
# Verificar DNS
ping seu-dominio.com

# Verificar se Nginx está respondendo
curl -I http://seu-dominio.com

# Tentar manualmente com --expand
certbot certonly --webroot -w /var/www/html \
  -d seu-dominio.com -d www.seu-dominio.com \
  --expand
```

### Aplicação não inicia

```bash
# Ver logs detalhados
sudo -u ostour pm2 logs ostour --lines 100

# Verificar se o build foi concluído
ls -la /home/ostour/birding/.next/

# Reiniciar
sudo -u ostour pm2 restart ostour
```

---

## Arquivos Modificados

1. ✅ `install-vps.sh` - Script principal corrigido
2. ✅ `next.config.js` - Adicionado output: 'standalone'
3. ✅ `scripts/fix-dynamic-routes.js` - Novo script de correção
4. ✅ `app/api/alerts/route.ts` - Adicionado dynamic export
5. ✅ Todas as rotas da API - Serão corrigidas automaticamente

---

## Notas Importantes

- ⚠️ O script agora faz backup do `next.config.js` antes de modificá-lo
- ⚠️ Rotas dinâmicas não podem ser pré-renderizadas (isso é esperado)
- ⚠️ O modo standalone otimiza o tamanho do build
- ✅ Todas as correções são aplicadas automaticamente
- ✅ O script é idempotente (pode ser executado múltiplas vezes)

---

## Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Acesse `https://seu-dominio.com`
2. ✅ Crie o primeiro usuário admin
3. ✅ Configure o MinIO em `https://seu-dominio.com/minio-console/`
4. ✅ Verifique os backups automáticos em `/home/ostour/backups`

---

**Data:** Janeiro 2026  
**Versão:** 2.0 - Corrigido SSL e Build do Next.js
