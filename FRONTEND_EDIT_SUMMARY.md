# Resumo da Implementação Frontend - Edição de OS

## Status de Implementação

### ✅ Completamente Implementado

#### 1. ParticipanteFormDialog
**Arquivo**: `components/forms/ParticipanteFormDialog.tsx`

**Mudanças**:
- Adicionado prop `mode?: 'create' | 'edit'`
- Adicionado prop `initialData?: Partial<ParticipanteFormData>`
- Lógica para carregar dados iniciais em modo edit
- Título dinâmico baseado no modo
- Botão de submit dinâmico

#### 2. OSParticipantesSection
**Arquivo**: `components/os/OSParticipantesSection.tsx`

**Mudanças**:
- ✅ Importado `Edit2` e `Trash2` de lucide-react
- ✅ Adicionado estado `editingParticipante`
- ✅ Implementado `handleEditParticipante()`
- ✅ Implementado `handleDeleteParticipante()`
- ✅ Implementado `handleOpenDialog()` para controlar modo
- ✅ Implementado `handleSubmit()` que redireciona para edit ou create
- ✅ Botões de Editar e Deletar adicionados na UI
- ✅ Diálogo atualizado com modo e initialData

**Features**:
- Confirmação antes de deletar
- Toast de sucesso/erro
- Atualização otimista da UI
- Auditoria automática no backend

#### 3. OSHospedagensSection
**Arquivo**: `components/os/OSHospedagensSection.tsx`

**Mudanças**:
- ✅ Importado `Edit2` e `Trash2` de lucide-react
- ✅ Adicionado estado `editingHospedagem`
- ✅ Implementado `handleEditHospedagem()`
- ✅ Implementado `handleDeleteHospedagem()`
- ✅ Modificado `handleAddHospedagem()` para suportar edit e create
- ✅ Botões de Editar e Deletar adicionados na UI
- ✅ Título e botões do diálogo dinâmicos

**Features**:
- Usa mesmo formulário para criar e editar
- Detecta modo através de `editingHospedagem`
- Confirmação antes de deletar
- Auditoria automática no backend

### ⏳ Pendente de Implementação

#### 4. OSTransportesSection
**Arquivo**: `components/os/OSTransportesSection.tsx`

**API Backend**: ✅ Pronto em `app/api/os/[id]/transportes/[transporteId]/route.ts`

**Mudanças Necessárias** (seguir padrão de Hospedagens):

```typescript
// 1. Adicionar imports
import { Edit2, Trash2 } from 'lucide-react'

// 2. Adicionar estado
const [editingTransporte, setEditingTransporte] = useState<Transporte | null>(null)

// 3. Modificar handleAddTransporte para suportar PATCH
const handleAddTransporte = async () => {
  // ... validação ...

  const url = editingTransporte
    ? `/api/os/${osId}/transportes/${editingTransporte.id}`
    : `/api/os/${osId}/transportes`
  const method = editingTransporte ? 'PATCH' : 'POST'

  const res = await fetch(url, { method, ... })

  // ... resto do código ...

  setEditingTransporte(null) // resetar após sucesso
}

// 4. Adicionar handleEditTransporte
const handleEditTransporte = (transporte: Transporte) => {
  setEditingTransporte(transporte)
  setFormData({
    tipo: transporte.tipo,
    fornecedorId: transporte.fornecedor?.id || '',
    origem: transporte.origem || '',
    destino: transporte.destino || '',
    dataPartida: transporte.dataPartida ? transporte.dataPartida.split('T')[0] : '',
    dataChegada: transporte.dataChegada ? transporte.dataChegada.split('T')[0] : '',
    custo: transporte.custo?.toString() || '',
    moeda: transporte.moeda,
    tarifaId: '',
  })
  setIsDialogOpen(true)
}

// 5. Adicionar handleDeleteTransporte
const handleDeleteTransporte = async (transporteId: string) => {
  if (!confirm('Tem certeza que deseja excluir este transporte? Esta ação não pode ser desfeita.')) {
    return
  }

  try {
    const res = await fetch(`/api/os/${osId}/transportes/${transporteId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erro ao deletar transporte')
    }

    toast({
      title: 'Sucesso',
      description: 'Transporte deletado com sucesso',
    })

    onUpdate()
  } catch (error: any) {
    toast({
      title: 'Erro',
      description: error.message || 'Erro ao deletar transporte',
      variant: 'destructive',
    })
  }
}

// 6. Adicionar botões na UI (no map de transportes)
<div className="flex gap-2">
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleEditTransporte(transporte)}
    title="Editar transporte"
  >
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleDeleteTransporte(transporte.id)}
    title="Excluir transporte"
    className="text-red-600 hover:text-red-700 hover:bg-red-50"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>

// 7. Atualizar título do diálogo
<h2>{editingTransporte ? 'Editar Transporte' : 'Adicionar Transporte'}</h2>

// 8. Atualizar botão de submit
<Button onClick={handleAddTransporte} disabled={loading}>
  {loading
    ? `${editingTransporte ? 'Atualizando' : 'Adicionando'}...`
    : editingTransporte
    ? 'Atualizar Transporte'
    : 'Adicionar Transporte'}
</Button>

// 9. Limpar estado ao fechar diálogo
onClick={() => {
  setIsDialogOpen(false)
  resetForm()
  setEditingTransporte(null)
}}
```

#### 5. OSAtividadesSection
**Arquivo**: `components/os/OSAtividadesSection.tsx`

**API Backend**: ✅ Pronto em `app/api/os/[id]/atividades/[atividadeId]/route.ts`

**Mudanças Necessárias** (seguir mesmo padrão):

```typescript
// Mesmas mudanças que Transportes, ajustando para o modelo de Atividade
// 1. Adicionar imports (Edit2, Trash2)
// 2. Adicionar estado editingAtividade
// 3. Modificar handleAddAtividade
// 4. Adicionar handleEditAtividade
// 5. Adicionar handleDeleteAtividade
// 6. Adicionar botões na UI
// 7-9. Atualizar diálogo
```

## Padrão de Implementação Estabelecido

### 1. Estado
```typescript
const [editingItem, setEditingItem] = useState<Item | null>(null)
```

### 2. Handler de Edição
```typescript
const handleEditItem = (item: Item) => {
  setEditingItem(item)
  setFormData({ /* preencher com dados do item */ })
  setIsDialogOpen(true)
}
```

### 3. Handler de Exclusão
```typescript
const handleDeleteItem = async (itemId: string) => {
  if (!confirm('Tem certeza...')) return

  try {
    const res = await fetch(`/api/os/${osId}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    // ... handle response ...

    toast({ title: 'Sucesso', description: '...' })
    onUpdate()
  } catch (error) {
    toast({ title: 'Erro', variant: 'destructive' })
  }
}
```

### 4. Modificar Handler de Adicionar/Atualizar
```typescript
const handleAddItem = async () => {
  // ... validação ...

  const url = editingItem
    ? `/api/os/${osId}/items/${editingItem.id}`
    : `/api/os/${osId}/items`
  const method = editingItem ? 'PATCH' : 'POST'

  // ... fetch e tratamento ...

  setEditingItem(null) // sempre resetar
}
```

### 5. Botões na UI
```typescript
<div className="flex gap-2">
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleEditItem(item)}
    title="Editar"
  >
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleDeleteItem(item.id)}
    title="Excluir"
    className="text-red-600 hover:text-red-700 hover:bg-red-50"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

### 6. Diálogo Dinâmico
```typescript
<h2>{editingItem ? 'Editar Item' : 'Adicionar Item'}</h2>

<Button onClick={handleAddItem} disabled={loading}>
  {loading
    ? `${editingItem ? 'Atualizando' : 'Adicionando'}...`
    : editingItem
    ? 'Atualizar Item'
    : 'Adicionar Item'}
</Button>

<Button onClick={() => {
  setIsDialogOpen(false)
  resetForm()
  setEditingItem(null)
}}>
  Cancelar
</Button>
```

## Sistema de Auditoria

Todos os endpoints de backend já registram automaticamente:
- ✅ Ação (atualizar/excluir)
- ✅ Dados antigos
- ✅ Dados novos (quando aplicável)
- ✅ Usuário que fez a operação
- ✅ IP e User-Agent
- ✅ Timestamp

Os logs podem ser visualizados no componente de auditoria da OS.

## Testes Recomendados

Para cada componente implementado:

1. ✅ Criar novo item
2. ✅ Editar item existente
3. ✅ Cancelar edição (verificar se não salva)
4. ✅ Deletar item
5. ✅ Cancelar deleção (no confirm)
6. ✅ Verificar toasts de sucesso/erro
7. ✅ Verificar atualização da lista após operações
8. ✅ Verificar logs de auditoria

## Arquivos Implementados

### Backend (Completo ✅)
- `app/api/os/[id]/participantes/[participanteId]/route.ts`
- `app/api/os/[id]/hospedagens/[hospedagemId]/route.ts`
- `app/api/os/[id]/transportes/[transporteId]/route.ts`
- `app/api/os/[id]/atividades/[atividadeId]/route.ts`

### Frontend (Parcial ⏳)
- ✅ `components/forms/ParticipanteFormDialog.tsx`
- ✅ `components/os/OSParticipantesSection.tsx`
- ✅ `components/os/OSHospedagensSection.tsx`
- ⏳ `components/os/OSTransportesSection.tsx` (pendente)
- ⏳ `components/os/OSAtividadesSection.tsx` (pendente)

## Próximos Passos

1. Aplicar o padrão estabelecido em `OSTransportesSection.tsx`
2. Aplicar o padrão estabelecido em `OSAtividadesSection.tsx`
3. Testar todos os fluxos
4. Verificar auditoria está funcionando
