# Sistema de Gerenciamento de Usuários e Permissões

## Visão Geral

Sistema completo para gerenciar usuários, suas funções hierárquicas e permissões granulares de acesso aos módulos do sistema.

## Estrutura de Dados

### Modelo Usuario (Prisma)

```prisma
model Usuario {
  id          String      @id @default(uuid())
  orgId       String      @map("org_id")
  nome        String
  email       String      @unique
  telefone    String?
  roleGlobal  RoleGlobal  @map("role_global")
  hashSenha   String      @map("hash_senha")
  ativo       Boolean     @default(true)
  
  // Campos de Permissões e Hierarquia
  permissoes  Json?       // Objeto com permissões granulares por módulo
  departamento String?    // Departamento/Setor do usuário
  cargo       String?     // Cargo do usuário
  supervisorId String?    @map("supervisor_id") // ID do supervisor direto
  
  // Dados adicionais
  avatar      String?     // URL do avatar
  ultimoAcesso DateTime?  @map("ultimo_acesso")
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  supervisor   Usuario?   @relation("UsuarioSupervisor")
  subordinados Usuario[]  @relation("UsuarioSupervisor")
}
```

### Funções Globais (RoleGlobal)

- **admin**: Administrador do sistema - acesso total
- **agente**: Agente de viagens - gerencia OS e cotações
- **guia**: Guia de turismo - visualiza suas designações
- **motorista**: Motorista - visualiza seus transportes
- **fornecedor**: Fornecedor externo - acesso limitado
- **cliente**: Cliente final - visualiza apenas suas OS

## Sistema de Permissões

### Estrutura de Permissões

```typescript
interface UserPermissions {
  os?: ModulePermissions;
  participantes?: ModulePermissions;
  fornecedores?: ModulePermissions;
  financeiro?: ModulePermissions;
  calendario?: ModulePermissions;
  cotacoes?: ModulePermissions;
  usuarios?: ModulePermissions;
  configuracoes?: ModulePermissions;
  relatorios?: ModulePermissions;
}

interface ModulePermissions {
  create?: boolean;           // Pode criar novos registros
  read?: PermissionLevel;     // Nível de visualização
  update?: PermissionLevel;   // Nível de edição
  delete?: PermissionLevel;   // Nível de exclusão
  export?: boolean;           // Pode exportar dados
}

type PermissionLevel = 'none' | 'own' | 'department' | 'all';
```

### Níveis de Permissão

- **none**: Sem acesso
- **own**: Acesso apenas aos próprios registros
- **department**: Acesso aos registros do departamento
- **all**: Acesso a todos os registros

### Permissões Padrão por Função

#### Administrador (admin)
- Acesso total a todos os módulos
- Pode criar, visualizar, editar, excluir e exportar tudo

#### Agente (agente)
- **OS**: Criar, visualizar todos, editar próprios
- **Participantes**: Criar, visualizar todos, editar próprios
- **Fornecedores**: Visualizar todos (sem edição)
- **Financeiro**: Criar, visualizar próprios, editar próprios
- **Calendário**: Criar, visualizar todos, editar próprios
- **Cotações**: Criar, visualizar todos, editar próprios, exportar
- **Usuários**: Visualizar todos (sem edição)
- **Configurações**: Visualizar (sem edição)
- **Relatórios**: Visualizar próprios, exportar

#### Guia (guia)
- **OS**: Visualizar próprios (designações)
- **Participantes**: Visualizar próprios
- **Fornecedores**: Visualizar todos
- **Financeiro**: Visualizar próprios
- **Calendário**: Visualizar próprios
- Sem acesso aos demais módulos

#### Motorista (motorista)
- **OS**: Visualizar próprios (designações)
- **Participantes**: Visualizar próprios
- **Financeiro**: Visualizar próprios
- **Calendário**: Visualizar próprios
- Sem acesso aos demais módulos

#### Fornecedor (fornecedor)
- **OS**: Visualizar próprios
- **Fornecedores**: Visualizar e editar próprios
- **Financeiro**: Visualizar próprios
- **Cotações**: Visualizar próprios
- Sem acesso aos demais módulos

#### Cliente (cliente)
- **OS**: Visualizar próprios
- **Participantes**: Visualizar próprios
- **Financeiro**: Visualizar próprios
- **Calendário**: Visualizar próprios
- **Cotações**: Visualizar próprios
- Sem acesso aos demais módulos

## Hierarquia Organizacional

### Estrutura Hierárquica

Cada usuário pode ter um supervisor direto (`supervisorId`), criando uma cadeia hierárquica:

```
Administrador
  └── Gerente de Operações
       ├── Agente Sênior 1
       │    ├── Agente Júnior 1
       │    └── Agente Júnior 2
       └── Agente Sênior 2
            └── Agente Júnior 3
```

### Benefícios da Hierarquia

1. **Delegação de Responsabilidades**: Supervisores podem gerenciar subordinados
2. **Visibilidade de Departamento**: Permissões de nível `department` respeitam a hierarquia
3. **Relatórios Consolidados**: Supervisores visualizam dados de toda sua equipe
4. **Aprovações em Cascata**: Workflows podem seguir a hierarquia

## APIs

### Endpoints Disponíveis

#### GET /api/usuarios
Lista todos os usuários da organização

**Query Parameters:**
- `ativo`: `true` | `false` - Filtrar por status
- `roleGlobal`: Filtrar por função
- `departamento`: Filtrar por departamento
- `search`: Buscar por nome ou email

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 99999-9999",
    "roleGlobal": "agente",
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "_count": {
      "osResponsavel": 5
    }
  }
]
```

#### GET /api/usuarios/[id]
Busca um usuário específico

**Response:**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "+55 11 99999-9999",
  "roleGlobal": "agente",
  "ativo": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "_count": {
    "osResponsavel": 5,
    "guiaDesignacoes": 0,
    "motoristaDesignacoes": 0,
    "lancamentosCriados": 10
  }
}
```

#### POST /api/usuarios
Cria um novo usuário

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "+55 11 99999-9999",
  "roleGlobal": "agente",
  "senha": "senha123",
  "departamento": "Operações",
  "cargo": "Agente Sênior",
  "supervisorId": "uuid-do-supervisor",
  "permissoes": { ... } // Opcional, usa padrão da função se não fornecido
}
```

#### PATCH /api/usuarios/[id]
Atualiza um usuário existente

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "+55 11 99999-9999",
  "roleGlobal": "agente",
  "senha": "nova-senha", // Opcional
  "ativo": true,
  "departamento": "Operações",
  "cargo": "Agente Sênior",
  "supervisorId": "uuid-do-supervisor",
  "permissoes": { ... }
}
```

#### DELETE /api/usuarios/[id]
Exclui um usuário

**Restrições:**
- Não pode excluir usuários com OS, guiamentos ou designações associadas
- Recomenda-se desativar ao invés de excluir

## Componentes de UI

### UsuariosTable
Tabela de listagem de usuários com ações inline

**Props:**
```typescript
interface UsuariosTableProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, ativo: boolean) => void;
  onManagePermissions: (usuario: Usuario) => void;
}
```

### UsuarioFormDialog
Formulário modal para criar/editar usuários

**Props:**
```typescript
interface UsuarioFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<void>;
  usuario?: any;
  usuarios?: any[];
}
```

### PermissoesDialog
Interface para gerenciar permissões granulares

**Props:**
```typescript
interface PermissoesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissoes: UserPermissions) => Promise<void>;
  usuario: {
    id: string;
    nome: string;
    roleGlobal: RoleGlobal;
    permissoes?: UserPermissions | null;
  };
}
```

## Página Principal

### /dashboard/usuarios

Página completa de gerenciamento com:

- **Listagem de usuários** com informações principais
- **Busca** por nome ou email
- **Filtros** por função e status
- **Exportação** para CSV
- **Criação** de novos usuários
- **Edição** de usuários existentes
- **Gerenciamento de permissões** granulares
- **Ativação/Desativação** de usuários
- **Exclusão** de usuários (com validações)

## Funcionalidades

### 1. Criação de Usuários
- Formulário completo com validações
- Senha obrigatória (mínimo 6 caracteres)
- Email único no sistema
- Seleção de função e supervisor
- Permissões padrão baseadas na função

### 2. Edição de Usuários
- Atualização de dados pessoais
- Alteração de função e departamento
- Mudança de supervisor
- Redefinição de senha (opcional)

### 3. Gerenciamento de Permissões
- Interface visual para configurar permissões
- Opção de usar permissões padrão da função
- Personalização granular por módulo
- Níveis de acesso configuráveis

### 4. Controle de Status
- Ativação/Desativação rápida
- Usuários inativos não podem fazer login
- Mantém histórico de ações

### 5. Hierarquia Organizacional
- Definição de supervisor direto
- Visualização de subordinados
- Estrutura hierárquica para delegação

### 6. Busca e Filtros
- Busca por nome ou email
- Filtro por função
- Filtro por status (ativo/inativo)
- Filtro por departamento

### 7. Exportação
- Exportar lista de usuários para CSV
- Inclui informações principais
- Útil para relatórios e auditorias

## Segurança

### Autenticação
- Senhas hasheadas com bcrypt
- JWT para autenticação de sessão
- Tokens com expiração

### Autorização
- Verificação de permissões em cada endpoint
- Validação de acesso baseada em função
- Isolamento por organização (orgId)

### Validações
- Email único no sistema
- Senha mínima de 6 caracteres
- Não permite exclusão de usuários com dependências
- Validação de dados em frontend e backend

## Migration

Para aplicar as mudanças no banco de dados:

```bash
npx prisma migrate dev --name add_usuario_permissions
```

Ou aplicar a migration manualmente:

```sql
ALTER TABLE "usuarios" ADD COLUMN "permissoes" JSONB;
ALTER TABLE "usuarios" ADD COLUMN "departamento" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "cargo" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "supervisor_id" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "avatar" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "ultimo_acesso" TIMESTAMP(3);

CREATE INDEX "usuarios_ativo_idx" ON "usuarios"("ativo");
CREATE INDEX "usuarios_supervisor_id_idx" ON "usuarios"("supervisor_id");
CREATE INDEX "usuarios_departamento_idx" ON "usuarios"("departamento");

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey" 
  FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
```

## Próximos Passos

1. **Implementar middleware de permissões**: Criar middleware para validar permissões em todas as rotas
2. **Auditoria de ações**: Registrar todas as ações de usuários no sistema
3. **Notificações**: Enviar emails de boas-vindas e redefinição de senha
4. **2FA**: Implementar autenticação de dois fatores
5. **Sessões ativas**: Gerenciar e revogar sessões ativas
6. **Histórico de alterações**: Rastrear mudanças em dados de usuários
7. **Grupos de usuários**: Criar grupos para facilitar gestão de permissões
8. **Políticas de senha**: Configurar requisitos de complexidade

## Uso do Sistema de Permissões

### Verificar Permissão

```typescript
import { hasPermission } from '@/types/permissions';

// Verificar se usuário pode criar OS
const canCreate = hasPermission(
  user.permissoes,
  'os',
  'create'
);

// Verificar se usuário pode visualizar todos os registros
const canViewAll = hasPermission(
  user.permissoes,
  'os',
  'read',
  'all'
);

// Verificar se usuário pode editar registros do departamento
const canEditDept = hasPermission(
  user.permissoes,
  'os',
  'update',
  'department'
);
```

### Aplicar em Componentes

```typescript
{hasPermission(user.permissoes, 'os', 'create') && (
  <button onClick={handleCreate}>Criar OS</button>
)}
```

### Aplicar em APIs

```typescript
const authResult = await verifyAuth(request);
const user = await prisma.usuario.findUnique({
  where: { id: authResult.payload.userId },
  select: { permissoes: true, roleGlobal: true }
});

if (!hasPermission(user.permissoes, 'os', 'create')) {
  return NextResponse.json(
    { error: 'Sem permissão para criar OS' },
    { status: 403 }
  );
}
```

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação da API: `/API_REFERENCE.md`
- Arquitetura do sistema: `/ARCHITECTURE.md`
- Issues no repositório
