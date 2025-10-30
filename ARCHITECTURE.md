# Arquitetura do Sistema - OS/Tour

## 📐 Visão Geral

O OS/Tour segue uma arquitetura **monolítica modular** com Next.js 14, separando claramente as responsabilidades entre frontend, backend e banco de dados.

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
├─────────────────────────────────────────────────────────┤
│  Frontend (React)      │      Backend (API Routes)      │
│  - Pages/Layouts       │      - REST Endpoints          │
│  - Components          │      - Business Logic          │
│  - Client State        │      - Authentication          │
│  - Forms & Validation  │      - Data Validation         │
└────────────┬───────────┴──────────────┬─────────────────┘
             │                          │
             │                          ▼
             │                   ┌──────────────┐
             │                   │   Prisma     │
             │                   │   ORM        │
             │                   └──────┬───────┘
             │                          │
             ▼                          ▼
      ┌─────────────┐          ┌───────────────┐
      │  Supabase   │          │  PostgreSQL   │
      │  Storage    │          │   Database    │
      └─────────────┘          └───────────────┘
```

## 🏗️ Camadas da Aplicação

### 1. Apresentação (Frontend)

**Localização**: `app/`, `components/`

**Responsabilidades**:
- Renderização de UI
- Interação do usuário
- Validação de formulários (client-side)
- Gerenciamento de estado local

**Tecnologias**:
- Next.js App Router (Server/Client Components)
- React 18 (Server Components + Hooks)
- TailwindCSS + ShadCN UI
- Zustand (estado global)
- React Hook Form + Zod

**Estrutura**:
```
app/
├── (dashboard)/          # Grupo de rotas autenticadas
│   ├── layout.tsx        # Layout compartilhado
│   └── dashboard/        # Páginas do dashboard
├── page.tsx              # Landing page
├── layout.tsx            # Root layout
└── globals.css           # Estilos globais

components/
├── ui/                   # Componentes primitivos (ShadCN)
├── forms/                # Formulários reutilizáveis
├── kanban/               # Componentes do Kanban
├── calendar/             # Componentes do calendário
└── layout/               # Header, Sidebar, etc.
```

### 2. Aplicação (Backend)

**Localização**: `app/api/`, `server/`, `lib/`

**Responsabilidades**:
- Endpoints REST
- Lógica de negócio
- Autenticação e autorização
- Validação de dados (server-side)
- Acesso ao banco de dados

**Tecnologias**:
- Next.js API Routes
- JWT (jose library)
- Zod (validação)
- Bcrypt (hashing de senhas)

**Estrutura**:
```
app/api/
├── auth/                 # Autenticação
│   ├── login/
│   ├── logout/
│   └── me/
├── os/                   # Ordens de Serviço
│   ├── route.ts          # GET/POST
│   └── [id]/
│       ├── route.ts      # GET/PATCH/DELETE
│       └── participantes/
├── financeiro/           # Lançamentos
└── calendario/           # Eventos

lib/
├── auth/                 # Utils de autenticação
│   ├── jwt.ts
│   ├── cookies.ts
│   ├── session.ts
│   └── password.ts
├── db/                   # Cliente Prisma
├── utils/                # Utilitários gerais
└── validators/           # Schemas Zod

server/
├── services/             # Lógica de negócio
└── repositories/         # Acesso a dados
```

### 3. Domínio (Business Logic)

**Localização**: `features/`, `server/services/`

**Responsabilidades**:
- Regras de negócio
- Validações complexas
- Transformações de dados
- Workflows

**Estrutura por Domínio**:
```
features/
├── os/
│   ├── schemas.ts        # Validações Zod
│   ├── types.ts          # Tipos TypeScript
│   ├── hooks.ts          # React Hooks
│   └── utils.ts          # Utilitários
├── auth/
├── financeiro/
├── fornecedores/
└── calendario/

server/services/
├── osService.ts          # Lógica de OS
├── financeiroService.ts  # Lógica financeira
└── calendarioService.ts  # Lógica de calendário
```

### 4. Persistência (Banco de Dados)

**Localização**: `prisma/`, `server/repositories/`

**Responsabilidades**:
- Schema do banco
- Migrações
- Queries complexas
- Repositórios de dados

**Tecnologias**:
- Prisma ORM
- PostgreSQL (Supabase)

**Estrutura**:
```
prisma/
├── schema.prisma         # Modelo do banco
└── migrations/           # Histórico de migrações

server/repositories/
├── osRepository.ts       # Acesso a dados de OS
├── userRepository.ts     # Acesso a dados de usuários
└── financeiroRepository.ts
```

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
┌──────────┐     1. POST /api/auth/login      ┌─────────────┐
│ Cliente  │ ──────────────────────────────▶  │  API Route  │
│          │    { email, password }            │             │
└──────────┘                                   └──────┬──────┘
     ▲                                                │
     │                                                │ 2. Verifica credenciais
     │                                                ▼
     │                                         ┌─────────────┐
     │                                         │  Database   │
     │                                         │  (Prisma)   │
     │                                         └──────┬──────┘
     │                                                │
     │                                                │ 3. Gera tokens JWT
     │                                                ▼
     │                                         ┌─────────────┐
     │   5. Set-Cookie (HTTP-only)             │   JWT       │
     │ ◀─────────────────────────────────────  │   Tokens    │
     │                                          └─────────────┘
     │
     │   6. Requests subsequentes com cookie
     ▼
┌──────────────────────────────────────────────────────────┐
│  Middleware / getSession()                               │
│  - Verifica cookie                                       │
│  - Valida JWT                                            │
│  - Extrai userId, roleGlobal, orgId                      │
└──────────────────────────────────────────────────────────┘
```

### Hierarquia de Permissões

```
Admin
  └─ Acesso total (todas as operações)

Agente
  └─ Criar/editar OS
  └─ Gerenciar participantes e fornecedores
  └─ Lançamentos financeiros

Guia
  └─ Ler OS designadas
  └─ Atualizar checklist
  └─ Lançar despesas pessoais

Motorista
  └─ Ler OS designadas
  └─ Atualizar checklist de transporte
  └─ Lançar despesas pessoais

Fornecedor
  └─ Ler serviços designados (opcional)

Cliente
  └─ Ler resumo da própria OS (opcional)
```

## 📊 Modelo de Dados

### Entidades Principais

```
Organizacao (1) ──┬── (N) Usuario
                  ├── (N) Fornecedor
                  ├── (N) OS
                  └── (N) LancamentoFinanceiro

OS (1) ──┬── (N) Participante
         ├── (N) OSFornecedor
         ├── (N) Atividade
         ├── (N) Hospedagem
         ├── (N) Transporte
         ├── (N) PassagemAerea
         ├── (N) GuiaDesignacao
         ├── (N) MotoristaDesignacao
         ├── (N) Scouting
         ├── (N) LancamentoFinanceiro
         ├── (N) Anotacao
         ├── (N) HistoricoStatus
         └── (N) EventoCalendario

Usuario (1) ──┬── (N) OS (como responsável)
              ├── (N) GuiaDesignacao
              ├── (N) MotoristaDesignacao
              └── (N) LancamentoFinanceiro (como referência)

Fornecedor (1) ──┬── (N) OSFornecedor
                 ├── (N) Atividade
                 ├── (N) Hospedagem
                 ├── (N) Transporte
                 └── (N) LancamentoFinanceiro
```

### Enums Principais

```typescript
StatusOS:
  planejamento → cotacoes → reservas_pendentes → 
  reservas_confirmadas → documentacao → pronto_para_viagem →
  em_andamento → concluida → pos_viagem
  (ou cancelada)

RoleGlobal:
  admin | agente | guia | motorista | fornecedor | cliente

TipoLancamento:
  entrada | saida | adiantamento | ajuste

CategoriaLancamento:
  hospedagem | guiamento | transporte | alimentacao |
  atividade | taxa | passagem_aerea | despesa_guia |
  despesa_motorista | outros
```

## 🔄 Fluxos de Dados

### Criação de OS

```
1. Cliente submete formulário
   └─▶ Form validation (Zod client-side)

2. POST /api/os
   ├─▶ requireAuth() - verifica autenticação
   ├─▶ Zod validation (server-side)
   ├─▶ Prisma.os.create()
   └─▶ Prisma.historicoStatus.create()

3. Retorna OS criada com status 201

4. Cliente atualiza UI (revalidation)
```

### Atualização de Status (Kanban)

```
1. Drag & Drop no Kanban
   └─▶ OnDragEnd event

2. PATCH /api/os/[id]
   ├─▶ requireAuth()
   ├─▶ Validar transição de status
   ├─▶ Verificar regras de negócio
   ├─▶ Prisma.os.update()
   └─▶ Prisma.historicoStatus.create()

3. Retorna OS atualizada

4. Cliente atualiza Kanban board
```

### Consulta com Filtros

```
1. Cliente altera filtros
   └─▶ Update URL params (querystring)

2. GET /api/os?status=X&agente=Y&periodo=Z
   ├─▶ requireAuth()
   ├─▶ Parse e validate query params
   ├─▶ Build Prisma where clause
   ├─▶ Prisma.os.findMany()
   └─▶ Prisma.os.count() (pagination)

3. Retorna lista paginada

4. Cliente renderiza resultados
```

## 🎨 Padrões de Design

### 1. Repository Pattern

Abstrai acesso a dados:

```typescript
// server/repositories/osRepository.ts
export class OSRepository {
  async findById(id: string, orgId: string) {
    return prisma.os.findFirst({
      where: { id, orgId },
      include: { /* ... */ }
    })
  }
  
  async create(data: CreateOSInput, orgId: string) {
    return prisma.os.create({ /* ... */ })
  }
}
```

### 2. Service Layer

Lógica de negócio:

```typescript
// server/services/osService.ts
export class OSService {
  async createOS(data: CreateOSInput, userId: string) {
    // Validações
    // Regras de negócio
    // Chamadas ao repository
    // Efeitos colaterais (emails, notificações)
  }
}
```

### 3. API Response Pattern

Respostas consistentes:

```typescript
// Sucesso
{
  success: true,
  data: { /* ... */ },
  message?: "Operação realizada"
}

// Erro
{
  success: false,
  error: "Mensagem de erro",
  details?: { /* validação */ }
}

// Paginação
{
  success: true,
  data: [ /* items */ ],
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
}
```

### 4. Feature-based Structure

Organização por domínio:

```
features/os/
├── components/       # Componentes específicos
├── hooks/            # Custom hooks
├── schemas.ts        # Validações
├── types.ts          # Tipos
└── utils.ts          # Utilitários
```

## 🔌 Integrações Externas

### Supabase Storage

```typescript
// Upload de documentos/anexos
const { data, error } = await supabase
  .storage
  .from('documentos')
  .upload(`os/${osId}/${filename}`, file)
```

### (Futuro) Email

```typescript
// Notificações por email
await sendEmail({
  to: usuario.email,
  subject: 'OS Confirmada',
  template: 'os-confirmada',
  data: { os }
})
```

## 📈 Escalabilidade

### Otimizações Atuais

- Server Components (RSC) para reduzir bundle
- Lazy loading de componentes pesados
- Prisma connection pooling
- Next.js Image Optimization

### Melhorias Futuras

1. **Caching**:
   - React Query / SWR
   - Redis para sessões
   - Next.js ISR/SSG

2. **Background Jobs**:
   - Cron jobs para relatórios
   - Queue para emails
   - Inngest/BullMQ

3. **Microservices** (se necessário):
   - Separar financeiro
   - API Gateway
   - Event-driven architecture

## 🧪 Testabilidade

### Estratégia de Testes

```
Pirâmide de Testes:
       /\
      /UI\          ← E2E (Playwright) - Fluxos críticos
     /────\
    / Inte\         ← Integration - API Routes
   /gration\
  /──────────\
 /   Unit     \     ← Unit - Services, Utils, Validators
/______________\
```

### Cobertura Recomendada

- **Unit**: 80%+ (validators, services, utils)
- **Integration**: 60%+ (API routes)
- **E2E**: Fluxos críticos (login, criar OS, financeiro)

## 🔒 Segurança

### Práticas Implementadas

- ✅ JWT em cookies HTTP-only
- ✅ Senha com bcrypt
- ✅ Validação server-side (Zod)
- ✅ SQL Injection protection (Prisma)
- ✅ XSS protection (React auto-escape)
- ✅ CSRF protection (SameSite cookies)

### Melhorias Recomendadas

- [ ] Rate limiting (API routes)
- [ ] CAPTCHA (login/registro)
- [ ] 2FA (autenticação)
- [ ] Audit log (ações sensíveis)
- [ ] Content Security Policy (CSP)

---

**Última atualização**: 2025-01-14  
**Versão**: 1.0.0
