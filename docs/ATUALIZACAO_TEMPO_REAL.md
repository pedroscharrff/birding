# Sistema de Atualização em Tempo Real

## Problema Resolvido
Itens criados não apareciam automaticamente na interface, exigindo recarregamento manual da página.

## Solução Implementada

### 1. Backend - Invalidação de Cache (Next.js)
Adicionado `revalidatePath` nas rotas da API para invalidar o cache do Next.js após criar/atualizar itens:

**Rotas atualizadas:**
- `/api/os/route.ts` - Criar OS
- `/api/os/[id]/transportes/route.ts` - Criar transporte
- `/api/os/[id]/hospedagens/route.ts` - Criar hospedagem
- `/api/os/[id]/atividades/route.ts` - Criar atividade
- `/api/os/[id]/guias/route.ts` - Adicionar guia
- `/api/fornecedores/route.ts` - Criar fornecedor
- `/api/cotacoes/route.ts` - Criar cotação

**Padrão implementado:**
```typescript
import { revalidatePath } from 'next/cache'

// Após criar/atualizar item
revalidatePath(`/dashboard/os/${osId}`)
revalidatePath('/dashboard/os')
```

### 2. Frontend - Router Refresh
Adicionado `router.refresh()` nos componentes que criam novos itens:

**Componentes atualizados:**
- `CreateOSDialog.tsx` - Criar nova OS

**Padrão implementado:**
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

// Após sucesso na criação
router.refresh()
onSuccess?.()
```

### 3. Hook Customizado
Criado hook `useAutoRefresh` para facilitar implementação:

```typescript
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

const { refresh } = useAutoRefresh()

// Após criar item
refresh(customRefetch) // customRefetch é opcional
```

## Como Usar em Novos Componentes

### Opção 1: Router Refresh (Recomendado)
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

const handleCreate = async () => {
  // ... criar item
  router.refresh() // Atualiza dados do servidor
  onSuccess?.()
}
```

### Opção 2: Hook useAutoRefresh
```typescript
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

const { refresh } = useAutoRefresh()

const handleCreate = async () => {
  // ... criar item
  refresh() // Atualiza automaticamente
  onSuccess?.()
}
```

### Opção 3: Refetch Manual (useApi)
```typescript
const { data, refetch } = useApi('/api/endpoint')

const handleCreate = async () => {
  // ... criar item
  await refetch() // Busca dados novamente
  onSuccess?.()
}
```

## Componentes que Precisam de Atualização

Os seguintes componentes ainda podem ser atualizados para usar `router.refresh()`:

- `OSTransportesSection.tsx` - Adicionar transporte
- `OSHospedagensSection.tsx` - Adicionar hospedagem
- `OSAtividadesSection.tsx` - Adicionar atividade
- `OSGuiasSection.tsx` - Adicionar guia
- `DespesaPagarDialog.tsx` - Marcar despesa como paga
- `PagamentoForm.tsx` - Criar pagamento
- `CreateCotacaoDialog.tsx` - Criar cotação
- `FornecedorFormDialog.tsx` - Criar fornecedor

## Benefícios

1. **Atualização Automática**: Dados aparecem imediatamente após criação
2. **Sem Recarregamento**: Não precisa recarregar a página manualmente
3. **Cache Inteligente**: Next.js gerencia cache automaticamente
4. **Performance**: Apenas os dados necessários são revalidados
5. **Consistência**: Todos os componentes seguem o mesmo padrão

## Notas Técnicas

- `revalidatePath` funciona apenas em Server Components e Route Handlers
- `router.refresh()` funciona em Client Components
- A combinação de ambos garante atualização completa
- O cache do Next.js é invalidado no servidor e o router atualiza no cliente
