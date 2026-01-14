# Correção de Erros de Autenticação

## Problema Identificado

Nos logs de produção foram identificados erros intermitentes de autenticação:

```
List OS error: Error: Não autenticado
```

## Causa Raiz

O problema estava relacionado à configuração de cookies em produção:

1. **Access token expirando muito rápido** (15 minutos)
2. **Configuração rígida do `secure` flag** sem flexibilidade para ambientes sem HTTPS
3. **Falta de logs detalhados** para diagnosticar falhas

## Correções Implementadas

### 1. Configuração Flexível de Cookies (`lib/auth/cookies.ts`)

**Antes:**
```typescript
secure: process.env.NODE_ENV === 'production',
maxAge: 60 * 15, // 15 minutos
```

**Depois:**
```typescript
const isSecure = process.env.FORCE_SECURE_COOKIES === 'true' || 
                 (process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true')

secure: isSecure,
maxAge: 60 * 30, // 30 minutos
```

### 2. Logs Detalhados de Autenticação (`lib/auth/session.ts`)

Adicionados logs para rastrear:
- Presença de tokens
- Falhas de verificação
- Tentativas de refresh
- Contexto do usuário autenticado

### 3. Variáveis de Ambiente

Adicione ao `.env` do servidor de produção:

```bash
# Autenticação
NODE_ENV=production

# Forçar cookies seguros (apenas se HTTPS estiver configurado)
# FORCE_SECURE_COOKIES=true

# Desabilitar cookies seguros temporariamente (apenas para debug)
# DISABLE_SECURE_COOKIES=true

# Redis (opcional, mas recomendado para produção)
REDIS_URL=redis://localhost:6379
```

## Configuração no Servidor VPS

### Opção 1: Com HTTPS (Recomendado)

Se você tem certificado SSL configurado:

```bash
# .env
NODE_ENV=production
# secure cookies serão ativados automaticamente
```

### Opção 2: Sem HTTPS (Temporário)

Se ainda não tem HTTPS configurado:

```bash
# .env
NODE_ENV=production
DISABLE_SECURE_COOKIES=true
```

⚠️ **Atenção:** Esta configuração deve ser usada apenas temporariamente. Configure HTTPS o quanto antes.

## Configuração Redis (Opcional)

O sistema funciona sem Redis usando cache em memória, mas para produção é recomendado:

```bash
# Instalar Redis
sudo apt update
sudo apt install redis-server

# Iniciar Redis
sudo systemctl start redis
sudo systemctl enable redis

# Adicionar ao .env
REDIS_URL=redis://localhost:6379
```

## Verificação

Após aplicar as correções, monitore os logs:

```bash
pm2 logs ostour --lines 50
```

Você deve ver logs como:
```
[AUTH][getSession] access token present? true
[AUTH][requireAuth] authenticated: { userId: '...', orgId: '...' }
```

Se ainda houver erros, os logs detalhados ajudarão a identificar a causa exata.

## Próximos Passos

1. ✅ Aplicar correções no código
2. 🔄 Fazer rebuild da aplicação: `npm run build`
3. 🔄 Reiniciar PM2: `pm2 restart ostour`
4. 📊 Monitorar logs por 24h
5. 🔒 Configurar HTTPS se ainda não tiver (Let's Encrypt + Certbot)
