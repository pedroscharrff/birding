# OS/Tour - Sistema de Operações de Turismo

Plataforma completa para gestão de operações de turismo com criação de Ordens de Serviço (OS), incluindo participantes, fornecedores, hotelaria, guiamento, transporte, alimentação, atividades, despesas, passagens e scoutings.

## 🎯 Visão Geral

O OS/Tour é um sistema web desenvolvido com Next.js 14, Prisma ORM e PostgreSQL (via Supabase), oferecendo:

- **Gestão Completa de OS**: Kanban visual, calendário e timeline
- **Multi-papel**: Admin, Agente, Guia, Motorista, Fornecedor e Cliente
- **Financeiro Interno**: Lançamentos, despesas e relatórios (sem gateway de pagamento)
- **Scoutings**: Registro de visitas técnicas e rotas
- **Auditoria**: Histórico completo de mudanças

## 📋 Funcionalidades Principais

### Gestão de Operações
- ✅ Criação e edição de OS com status Kanban
- ✅ Gestão de participantes (dados pessoais, passaportes, restrições)
- ✅ Fornecedores por categoria (hotelaria, transporte, alimentação, atividades)
- ✅ Hospedagens com check-in/out e regimes
- ✅ Transportes (van, 4x4, executivo, aéreo)
- ✅ Atividades programadas
- ✅ Passagens aéreas (cliente e guia)
- ✅ Designação de guias e motoristas

### Calendário
- 📅 Visualização mensal/semanal/diária
- 📅 Chegadas e saídas automáticas
- 📅 Recursos (guias, motoristas, veículos)
- 📅 Filtros personalizados

### Financeiro
- 💰 Lançamentos (entrada, saída, adiantamento, ajuste)
- 💰 Categorias operacionais
- 💰 Despesas de guias e motoristas
- 💰 Relatórios por OS e período
- 💰 Suporte multi-moeda (BRL, USD, EUR)

### Scoutings
- 🗺️ Registro de visitas técnicas
- 🗺️ Rotas e pontos de interesse
- 🗺️ Anexos e documentos
- 🗺️ Notas de campo

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: TailwindCSS + ShadCN UI
- **Forms**: React Hook Form + Zod
- **Estado**: Zustand
- **Animações**: Framer Motion
- **Kanban**: dnd-kit
- **Calendário**: FullCalendar

### Backend
- **API**: Next.js API Routes (REST)
- **Autenticação**: JWT com cookies HTTP-only
- **Validação**: Zod
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage

### DevOps
- **Lint**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Testes**: Vitest (configurado)
- **Deploy**: Vercel / Railway / Render

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ e npm 9+
- PostgreSQL (ou conta Supabase)
- Git

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd webapp
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ostour?schema=public"

# Supabase (opcional - para storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Configurar Banco de Dados

#### Opção A: Supabase (Recomendado)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a `DATABASE_URL` de Settings > Database > Connection String
4. Use a URL no formato: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`

#### Opção B: PostgreSQL Local

```bash
# Criar banco de dados
createdb ostour

# Atualizar DATABASE_URL no .env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/ostour"
```

### 5. Executar Migrações

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:push

# Ou executar migrações (produção)
npm run db:migrate
```

### 6. (Opcional) Seed de Dados

Crie um arquivo de seed em `db/seeds/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  // Criar organização
  const org = await prisma.organizacao.create({
    data: {
      nome: 'Minha Agência de Turismo',
    },
  })

  // Criar usuário admin
  await prisma.usuario.create({
    data: {
      nome: 'Admin',
      email: 'admin@ostour.com',
      hashSenha: await hashPassword('admin123'),
      roleGlobal: 'admin',
      orgId: org.id,
      ativo: true,
    },
  })

  console.log('✅ Seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Execute:

```bash
npm run db:seed
```

### 7. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🏗️ Estrutura do Projeto

```
webapp/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # Autenticação
│   │   ├── os/           # Ordens de Serviço
│   │   ├── financeiro/   # Lançamentos
│   │   └── calendario/   # Eventos
│   ├── (dashboard)/      # Layout do dashboard
│   │   └── dashboard/    # Páginas principais
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout raiz
│   └── page.tsx          # Página inicial
├── components/
│   ├── ui/               # Componentes ShadCN
│   ├── forms/            # Formulários
│   ├── kanban/           # Board Kanban
│   └── calendar/         # Componentes de calendário
├── features/             # Features por domínio
│   ├── os/               # Lógica de OS
│   ├── auth/             # Lógica de autenticação
│   ├── financeiro/       # Lógica financeira
│   └── calendario/       # Lógica de calendário
├── lib/
│   ├── auth/             # Utilidades de auth (JWT, cookies, session)
│   ├── db/               # Cliente Prisma
│   ├── utils/            # Utilitários gerais
│   └── validators/       # Schemas Zod
├── server/
│   ├── services/         # Serviços de negócio
│   └── repositories/     # Camada de acesso a dados
├── types/                # Tipos TypeScript compartilhados
├── hooks/                # React Hooks customizados
├── contexts/             # React Contexts
├── prisma/
│   └── schema.prisma     # Schema do banco
├── public/               # Assets estáticos
├── .env.example          # Exemplo de variáveis de ambiente
├── next.config.js        # Configuração Next.js
├── tailwind.config.ts    # Configuração Tailwind
├── tsconfig.json         # Configuração TypeScript
└── package.json          # Dependências
```

## 🔐 Autenticação e Permissões

### Papéis (Roles)

| Papel | Descrição | Permissões OS | Permissões Financeiro |
|-------|-----------|---------------|----------------------|
| **Admin** | Acesso total | Todas | Todas + Encerramento |
| **Agente** | Gestão de operações | Criar, Editar, Atribuir | Lançar, Editar |
| **Guia** | Acesso às OS designadas | Ler, Checklist | Despesas Pessoais |
| **Motorista** | Acesso às OS designadas | Ler, Checklist | Despesas Pessoais |
| **Fornecedor** | Acesso restrito | Ler Serviços | - |
| **Cliente** | Portal de consulta | Ler Resumo | - |

### Fluxo de Autenticação

1. Login via `/api/auth/login` com email/senha
2. JWT de acesso (15min) + refresh (7d) em cookies HTTP-only
3. Refresh automático no cliente quando necessário
4. Logout limpa todos os cookies

## 📊 Status do Kanban

```
Planejamento → Cotações → Reservas Pendentes → Reservas Confirmadas → 
Documentação → Pronto para Viagem → Em Andamento → Concluída → Pós-Viagem

                            ↓
                        Cancelada
```

### Regras de Negócio

- ❌ Não permitir mover para "Confirmadas" sem 100% das reservas OK
- ❌ Não permitir mover para "Em Andamento" antes da data de início
- ❌ "Cancelada" bloqueia novos lançamentos (exceto estornos)
- ✅ Histórico completo de mudanças de status

## 🚀 Deploy

### Opção 1: Vercel (Recomendado para Next.js)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard Vercel
# Settings > Environment Variables
```

### Opção 2: Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up

# Configurar variáveis de ambiente
railway variables
```

### Opção 3: Render

1. Conecte seu repositório GitHub
2. Crie um novo Web Service
3. Configurações:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. Adicione variáveis de ambiente

### Variáveis de Ambiente em Produção

Certifique-se de configurar:

```env
DATABASE_URL=<sua-url-producao>
JWT_SECRET=<secret-seguro-gerado>
JWT_REFRESH_SECRET=<outro-secret-seguro>
NEXT_PUBLIC_APP_URL=<sua-url-producao>
NODE_ENV=production
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com UI
npm run test:ui

# Type checking
npm run type-check
```

## 📝 Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm start                # Servidor de produção
npm run lint             # Linter
npm run format           # Formatação de código
npm run type-check       # Verificação de tipos
npm run db:generate      # Gerar cliente Prisma
npm run db:push          # Push schema para DB (dev)
npm run db:migrate       # Executar migrações (dev)
npm run db:migrate:prod  # Executar migrações (prod)
npm run db:studio        # Prisma Studio (GUI)
npm run db:seed          # Seed de dados
npm run db:reset         # Reset completo do DB
```

## 🔧 Desenvolvimento

### Adicionar Nova Rota API

1. Criar arquivo em `app/api/[rota]/route.ts`
2. Implementar handlers GET/POST/PATCH/DELETE
3. Adicionar validação Zod
4. Aplicar autenticação com `requireAuth()`

Exemplo:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const data = await prisma.suaTabela.findMany({
      where: { orgId: session.orgId }
    })
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro' },
      { status: 500 }
    )
  }
}
```

### Adicionar Nova Página

1. Criar arquivo em `app/(dashboard)/dashboard/[pagina]/page.tsx`
2. Adicionar link no `app/(dashboard)/layout.tsx`
3. Implementar UI com componentes ShadCN

### Adicionar Componente UI

```bash
# Componentes já disponíveis:
# - Button
# - Input
# - Card
# - Label
# - Dialog
# - Select
# - Tabs
# - Toast
# - etc.

# Para adicionar novos, consulte:
# https://ui.shadcn.com/docs/components
```

## 🐛 Troubleshooting

### Erro: "Module not found: Can't resolve '@/...'"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Prisma Client not found"

```bash
npm run db:generate
```

### Erro de conexão com banco

```bash
# Verificar DATABASE_URL no .env
# Testar conexão
npm run db:studio
```

### Erro de JWT

```bash
# Verificar JWT_SECRET no .env
# Gerar novo secret seguro:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📚 Recursos Adicionais

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com/docs)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

Desenvolvido para gestão profissional de operações de turismo.

---

**Status do Projeto**: ✅ Estrutura Base Completa

**Próximos Passos Recomendados**:
1. Implementar rotas API restantes (fornecedores, usuários, calendário)
2. Criar componentes Kanban com dnd-kit
3. Integrar FullCalendar
4. Implementar formulários com React Hook Form
5. Adicionar testes unitários e E2E
6. Configurar CI/CD
7. Documentar API com Swagger/OpenAPI

Para dúvidas ou suporte, consulte a documentação ou abra uma issue no repositório.
