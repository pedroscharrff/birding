# Guia de Contribuição - OS/Tour

Obrigado por considerar contribuir com o OS/Tour! Este documento fornece diretrizes para contribuir com o projeto.

## 🎯 Como Contribuir

### 1. Reportar Bugs

Se encontrar um bug, abra uma issue com:

- **Título descritivo**
- **Descrição clara** do problema
- **Passos para reproduzir**
- **Comportamento esperado vs. atual**
- **Screenshots** (se aplicável)
- **Ambiente** (navegador, OS, versão do Node)

### 2. Sugerir Features

Para sugerir novas funcionalidades:

- Abra uma issue com o prefixo `[Feature Request]`
- Descreva o problema que a feature resolve
- Proponha uma solução
- Liste casos de uso
- Considere alternativas

### 3. Pull Requests

#### Processo

1. **Fork** o repositório
2. **Clone** seu fork: `git clone <seu-fork>`
3. **Crie uma branch**: `git checkout -b feature/minha-feature`
4. **Faça suas alterações**
5. **Commit**: `git commit -m "feat: descrição"`
6. **Push**: `git push origin feature/minha-feature`
7. **Abra um Pull Request**

#### Checklist Antes do PR

- [ ] Código segue o style guide
- [ ] Testes passando (`npm test`)
- [ ] Type checking OK (`npm run type-check`)
- [ ] Lint OK (`npm run lint`)
- [ ] Build OK (`npm run build`)
- [ ] Commits seguem padrão Conventional Commits
- [ ] Branch atualizada com `main`

## 📝 Padrões de Código

### Conventional Commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração
- `perf`: Melhoria de performance
- `test`: Testes
- `chore`: Manutenção

**Exemplos**:
```bash
git commit -m "feat(os): adiciona filtro por destino"
git commit -m "fix(auth): corrige refresh token expirado"
git commit -m "docs: atualiza README com instruções de deploy"
```

### TypeScript

```typescript
// ✅ BOM
interface Usuario {
  id: string
  nome: string
  email: string
}

function criarUsuario(data: Usuario): Promise<Usuario> {
  return prisma.usuario.create({ data })
}

// ❌ RUIM
function criarUsuario(data: any) {
  return prisma.usuario.create({ data })
}
```

### Nomenclatura

```typescript
// Componentes: PascalCase
export function ButtonPrimary() {}

// Funções/variáveis: camelCase
const isAuthenticated = true
function getUserById() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5_000_000

// Tipos/Interfaces: PascalCase
interface UserData {}
type ApiResponse = {}

// Arquivos: kebab-case ou camelCase
// user-service.ts ou userService.ts
```

### React Components

```tsx
// ✅ BOM - Server Component tipado
interface OSCardProps {
  os: OS
  onEdit?: (id: string) => void
}

export function OSCard({ os, onEdit }: OSCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{os.titulo}</CardTitle>
      </CardHeader>
    </Card>
  )
}

// Para Client Components
'use client'

export function OSForm() {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### API Routes

```typescript
// ✅ BOM - Estrutura padrão
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Validação
    const query = schema.parse(params)
    
    // Lógica de negócio
    const data = await service.getData(query)
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
```

## 🧪 Testes

### Estrutura de Testes

```typescript
// os.test.ts
import { describe, it, expect } from 'vitest'
import { createOSSchema } from '@/lib/validators/os'

describe('OS Validator', () => {
  it('deve aceitar dados válidos', () => {
    const validData = {
      titulo: 'Tour Pantanal',
      destino: 'Corumbá',
      dataInicio: '2025-01-15',
      dataFim: '2025-01-20',
      agenteResponsavelId: 'uuid-valido'
    }
    
    expect(() => createOSSchema.parse(validData)).not.toThrow()
  })
  
  it('deve rejeitar título muito curto', () => {
    const invalidData = { titulo: 'AB' }
    
    expect(() => createOSSchema.parse(invalidData)).toThrow()
  })
})
```

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm test -- --watch

# Com UI
npm run test:ui

# Cobertura
npm test -- --coverage
```

## 📁 Estrutura de Arquivos

### Novos Componentes

```
components/
└── ui/
    └── meu-componente/
        ├── index.ts            # Export
        ├── meu-componente.tsx  # Componente
        └── meu-componente.test.tsx
```

### Novas Features

```
features/
└── minha-feature/
    ├── index.ts              # Exports
    ├── components/           # Componentes específicos
    ├── hooks/                # Custom hooks
    ├── schemas.ts            # Validações Zod
    ├── types.ts              # Tipos TypeScript
    └── utils.ts              # Utilitários
```

### Novas API Routes

```
app/api/
└── meu-recurso/
    ├── route.ts              # GET, POST
    └── [id]/
        └── route.ts          # GET, PATCH, DELETE
```

## 🔍 Code Review

### O que Revisamos

- ✅ Funcionalidade correta
- ✅ Testes adequados
- ✅ Performance
- ✅ Segurança
- ✅ Acessibilidade (quando aplicável)
- ✅ Documentação/comentários
- ✅ Code style

### Dicas para Aprovação Rápida

1. **PRs pequenos**: Mudanças focadas são mais fáceis de revisar
2. **Descrição clara**: Explique o "porquê" da mudança
3. **Screenshots**: Para mudanças de UI
4. **Testes**: Inclua testes para novas features
5. **Documentação**: Atualize README/docs se necessário

## 🚀 Deploy

Mudanças no `main` acionam deploy automático:

- **Staging**: Cada PR tem preview deploy
- **Produção**: Merge para `main`

### Hotfix

Para correções urgentes:

1. Branch de `main`: `git checkout -b hotfix/nome`
2. Faça a correção
3. PR com label `hotfix`
4. Aprovação e merge acelerados

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [Zod](https://zod.dev)

## ❓ Dúvidas

- Abra uma **Discussion** no GitHub
- Entre em contato com os maintainers
- Leia a documentação existente

## 📋 Checklist do Contribuidor

Antes de enviar seu PR, verifique:

- [ ] Li e segui o guia de contribuição
- [ ] Código segue os padrões estabelecidos
- [ ] Adicionei/atualizei testes
- [ ] Testes estão passando
- [ ] Type checking OK
- [ ] Lint OK
- [ ] Commits seguem Conventional Commits
- [ ] Atualizei documentação (se necessário)
- [ ] PR tem descrição clara

## 🙏 Agradecimentos

Todo tipo de contribuição é bem-vinda:

- 🐛 Reportar bugs
- 💡 Sugerir features
- 📝 Melhorar documentação
- 🔧 Corrigir bugs
- ✨ Adicionar features
- 🎨 Melhorar UI/UX
- ⚡ Otimizar performance

**Obrigado por contribuir!** 🚀
