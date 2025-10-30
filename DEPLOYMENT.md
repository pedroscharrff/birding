# Guia de Deployment - OS/Tour

## 🚀 Opções de Deploy

### 1. Vercel (Recomendado - Mais Fácil)

**Vantagens**:
- Deploy automático via GitHub
- Gratuito para hobby projects
- Otimizado para Next.js
- Domain e SSL automáticos
- Preview deployments

**Passos**:

1. **Criar conta**: https://vercel.com

2. **Conectar GitHub**:
   - Clique em "New Project"
   - Importe seu repositório
   - Vercel detecta Next.js automaticamente

3. **Configurar Variáveis de Ambiente**:
   ```
   Settings > Environment Variables
   ```
   
   Adicione:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   NODE_ENV=production
   
   # Opcional: Supabase
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   ```

4. **Deploy**:
   - Clique em "Deploy"
   - Aguarde build (~2-3 minutos)
   - Acesse URL fornecida

5. **Executar Migrações**:
   ```bash
   # Localmente
   DATABASE_URL="<url-producao>" npm run db:migrate:prod
   ```

**CLI (Alternativa)**:
```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

---

### 2. Railway (Recomendado - Com Database Incluído)

**Vantagens**:
- PostgreSQL incluído gratuitamente
- $5 crédito mensal grátis
- Deploy simples
- Logs em tempo real

**Passos**:

1. **Criar conta**: https://railway.app

2. **Novo Projeto**:
   - "New Project" > "Deploy from GitHub repo"
   - Selecione seu repositório

3. **Adicionar PostgreSQL**:
   - "New" > "Database" > "Add PostgreSQL"
   - Railway cria DATABASE_URL automaticamente

4. **Configurar Variáveis**:
   ```bash
   # Railway detecta DATABASE_URL automaticamente
   # Adicione apenas:
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   NEXT_PUBLIC_APP_URL=https://seu-app.railway.app
   NODE_ENV=production
   ```

5. **Deploy**:
   - Railway faz deploy automático
   - Clique em "View Logs" para acompanhar

6. **Executar Migrações**:
   ```bash
   # Via Railway CLI
   railway run npm run db:migrate:prod
   ```

**CLI**:
```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

---

### 3. Render

**Vantagens**:
- Gratuito (com limitações)
- PostgreSQL incluído
- Simples de configurar

**Passos**:

1. **Criar conta**: https://render.com

2. **Novo Web Service**:
   - "New" > "Web Service"
   - Conecte repositório GitHub

3. **Configurações**:
   ```
   Name: ostour
   Environment: Node
   Build Command: npm run build
   Start Command: npm start
   ```

4. **Adicionar PostgreSQL**:
   - "New" > "PostgreSQL"
   - Copie Internal Database URL

5. **Variáveis de Ambiente**:
   ```env
   DATABASE_URL=<internal-database-url>
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   NEXT_PUBLIC_APP_URL=https://seu-app.onrender.com
   NODE_ENV=production
   ```

6. **Deploy**:
   - Clique "Create Web Service"
   - Aguarde primeiro deploy (~5-10 min)

7. **Migrações**:
   ```bash
   # Via dashboard: Shell
   npm run db:migrate:prod
   ```

---

### 4. DigitalOcean App Platform

**Vantagens**:
- Infraestrutura robusta
- Escalável
- Database managed

**Passos**:

1. Criar conta DigitalOcean
2. "Create" > "Apps"
3. Conectar GitHub
4. Detecta Next.js automaticamente
5. Adicionar Managed PostgreSQL
6. Configurar variáveis de ambiente
7. Deploy

**Custo**: ~$12/mês (app + db)

---

### 5. AWS / GCP / Azure

Para projetos enterprise, considere:
- **AWS**: Amplify + RDS
- **GCP**: Cloud Run + Cloud SQL
- **Azure**: App Service + Azure Database

---

## 🗄️ Opções de Banco de Dados

### Supabase (Recomendado)

**Gratuito**:
- 500MB database
- 1GB bandwidth
- 50K auth users

**Setup**:
1. Criar projeto: https://supabase.com
2. Copiar `DATABASE_URL` de Settings > Database
3. Adicionar ao `.env`

### Railway PostgreSQL

**Incluído**:
- Criado automaticamente ao fazer deploy
- Backup automático
- $5 crédito mensal

### Render PostgreSQL

**Gratuito (limitado)**:
- Expira após 90 dias
- 256MB RAM
- 1GB storage

Para produção séria, upgrade para plano pago.

### Neon

**Serverless PostgreSQL**:
- Tier gratuito generoso
- Cold start rápido
- Branch database para dev

https://neon.tech

---

## ⚙️ Checklist Pré-Deploy

Antes de fazer deploy em produção:

### 1. Segurança

- [ ] JWT_SECRET gerado com `crypto.randomBytes(32).toString('base64')`
- [ ] JWT_REFRESH_SECRET diferente do JWT_SECRET
- [ ] DATABASE_URL não exposta no frontend
- [ ] NODE_ENV=production
- [ ] Cookies com `secure: true` em produção

### 2. Database

- [ ] Migrações executadas: `npm run db:migrate:prod`
- [ ] Seed de dados inicial (se necessário)
- [ ] Backup configurado
- [ ] Connection pooling habilitado

### 3. Performance

- [ ] Build otimizado: `npm run build`
- [ ] Imagens otimizadas
- [ ] Bundle analisado (sem libs desnecessárias)

### 4. Monitoring

- [ ] Logs configurados
- [ ] Error tracking (Sentry opcional)
- [ ] Uptime monitoring

### 5. DNS e SSL

- [ ] Domínio customizado configurado (opcional)
- [ ] SSL certificate (automático na maioria das plataformas)
- [ ] WWW redirect configurado

---

## 🔐 Gerando Secrets Seguros

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Adicione aos environment variables da plataforma escolhida.

---

## 📊 Monitoramento Pós-Deploy

### Logs

**Vercel**:
```bash
vercel logs <deployment-url>
```

**Railway**:
```bash
railway logs
```

**Render**:
Via dashboard > Logs

### Database

**Prisma Studio** (local):
```bash
DATABASE_URL="<production-url>" npm run db:studio
```

⚠️ **Cuidado**: Evite rodar Studio em produção. Use apenas para debug.

### Performance

- Vercel Analytics (built-in)
- Google Analytics
- LogRocket / FullStory (opcional)

---

## 🆘 Troubleshooting

### Build Failed

```bash
# Localmente, teste o build:
npm run build

# Verifique erros de type checking:
npm run type-check
```

### Database Connection Error

```bash
# Teste conexão:
DATABASE_URL="<production-url>" npx prisma db pull

# Verifique IP whitelist (se aplicável)
# Supabase/Neon: permitir todos os IPs ou IPs da plataforma
```

### Environment Variables

```bash
# Certifique-se de que todas as vars estão definidas:
echo $DATABASE_URL
echo $JWT_SECRET
echo $NEXT_PUBLIC_APP_URL

# Reinicie serviço após adicionar vars
```

### Migrations

```bash
# Se migrações falharem, force schema:
DATABASE_URL="<production-url>" npm run db:push

# ⚠️ Use com cuidado em produção!
```

---

## 📈 Escalabilidade

Quando seu app crescer:

1. **Database Connection Pooling**:
   - Supabase Pooler (pgBouncer)
   - PgBouncer standalone
   - Prisma Data Proxy

2. **Caching**:
   - Next.js ISR
   - Redis para sessions
   - CDN para assets

3. **Background Jobs**:
   - Vercel Cron Jobs
   - Inngest / Trigger.dev
   - Bull / BullMQ

4. **File Storage**:
   - Supabase Storage
   - AWS S3
   - Cloudinary

---

## 🎯 Recomendação Final

Para começar rápido e grátis:

**Desenvolvimento/MVP**: Vercel + Supabase  
**Produção pequena**: Railway (all-in-one)  
**Produção média**: Vercel + Neon/Supabase  
**Produção grande**: AWS/GCP + RDS/Cloud SQL

Boa sorte! 🚀
