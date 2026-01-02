# Implementação de Edição nas OS

## Resumo
Este documento descreve a implementação da funcionalidade de edição para os componentes das Ordens de Serviço (OS), incluindo Participantes, Hospedagens, Transportes e Atividades, com registro completo de auditoria.

## Status de Implementação

### ✅ Backend - APIs Implementadas

#### 1. Participantes
- **Arquivo**: `app/api/os/[id]/participantes/[participanteId]/route.ts`
- **Endpoints**:
  - `PATCH /api/os/[id]/participantes/[participanteId]` - Atualizar participante
  - `DELETE /api/os/[id]/participantes/[participanteId]` - Deletar participante
- **Auditoria**: ✅ Implementada
- **Validação**: ✅ Usando `updateParticipanteSchema`

#### 2. Hospedagens
- **Arquivo**: `app/api/os/[id]/hospedagens/[hospedagemId]/route.ts`
- **Endpoints**:
  - `PATCH /api/os/[id]/hospedagens/[hospedagemId]` - Atualizar hospedagem
  - `DELETE /api/os/[id]/hospedagens/[hospedagemId]` - Deletar hospedagem
- **Auditoria**: ✅ Implementada (adicionada)
- **Validação**: ✅ Usando `updateHospedagemSchema`
- **Features**: Atualiza `hotelNome` automaticamente se fornecedor mudar

#### 3. Transportes
- **Arquivo**: `app/api/os/[id]/transportes/[transporteId]/route.ts` (NOVO)
- **Endpoints**:
  - `PATCH /api/os/[id]/transportes/[transporteId]` - Atualizar transporte
  - `DELETE /api/os/[id]/transportes/[transporteId]` - Deletar transporte
- **Auditoria**: ✅ Implementada
- **Validação**: ✅ Schema inline com Zod

#### 4. Atividades
- **Arquivo**: `app/api/os/[id]/atividades/[atividadeId]/route.ts`
- **Endpoints**:
  - `PATCH /api/os/[id]/atividades/[atividadeId]` - Atualizar atividade
  - `DELETE /api/os/[id]/atividades/[atividadeId]` - Deletar atividade
- **Auditoria**: ✅ Implementada
- **Validação**: ✅ Usando `updateAtividadeSchema`

## Sistema de Auditoria

Todos os endpoints de edição e exclusão registram logs de auditoria com:
- **Ação**: `atualizar` ou `excluir`
- **Dados Antigos**: Estado anterior do registro
- **Dados Novos**: Estado após a atualização (apenas para `atualizar`)
- **Metadados**: IP e User-Agent do requisitante
- **Usuário**: ID do usuário autenticado que fez a operação

### Exemplo de Log de Auditoria
```typescript
await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosAntigos: existingParticipante,
  dadosNovos: participante,
  metadata: {
    ip: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  },
})
```

## Pendente - Frontend (UI)

### Componentes que Precisam de Atualização

#### 1. OSParticipantesSection.tsx
**Localização**: `components/os/OSParticipantesSection.tsx`

**Implementar**:
- Botão "Editar" em cada participante
- Botão "Deletar" em cada participante
- Atualizar `ParticipanteFormDialog` para suportar modo de edição:
  - Adicionar prop `mode: 'create' | 'edit'`
  - Adicionar prop `initialData?: Participante`
  - Preencher formulário com dados existentes no modo edit
  - Alterar chamada de API para PATCH quando em modo edit

**Funções a adicionar**:
```typescript
const handleEditParticipante = async (participanteId: string, formData: ParticipanteFormData) => {
  const res = await fetch(`/api/os/${osId}/participantes/${participanteId}`, {
    method: 'PATCH',
    body: JSON.stringify(formData),
  })
  // ... handle response
}

const handleDeleteParticipante = async (participanteId: string) => {
  if (!confirm('Tem certeza que deseja excluir este participante?')) return
  const res = await fetch(`/api/os/${osId}/participantes/${participanteId}`, {
    method: 'DELETE',
  })
  // ... handle response
}
```

#### 2. OSHospedagensSection.tsx
**Localização**: `components/os/OSHospedagensSection.tsx`

**Implementar**:
- Botão "Editar" em cada hospedagem (similar ao "Duplicar" existente)
- Botão "Deletar" em cada hospedagem
- Adicionar estado para controlar modo de edição:
  ```typescript
  const [editingHospedagem, setEditingHospedagem] = useState<Hospedagem | null>(null)
  ```
- Modificar `handleAddHospedagem` para detectar se está editando
- Adicionar `handleDeleteHospedagem`

#### 3. OSTransportesSection.tsx
**Localização**: `components/os/OSTransportesSection.tsx`

**Implementar**:
- Botão "Editar" em cada transporte
- Botão "Deletar" em cada transporte
- Similar à implementação de Hospedagens
- Estado para controlar edição
- Funções de editar e deletar

#### 4. OSAtividadesSection.tsx
**Localização**: `components/os/OSAtividadesSection.tsx`

**Verificar**:
- Verificar se já existe implementação
- Se não, implementar seguindo o mesmo padrão

## Padrão de Implementação UI

### Estrutura de Botões de Ação
```tsx
<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleEdit(item)}
    title="Editar"
  >
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleDelete(item.id)}
    title="Excluir"
    className="text-red-600 hover:text-red-700"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

### Confirmação de Exclusão
Sempre usar confirmação antes de excluir:
```typescript
if (!confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
  return
}
```

### Feedback ao Usuário
Usar toast para feedback:
```typescript
toast({
  title: 'Sucesso',
  description: 'Item atualizado com sucesso',
})

toast({
  title: 'Erro',
  description: error.message,
  variant: 'destructive',
})
```

## Segurança

Todas as rotas implementam:
1. **Autenticação**: `requireAuth()` em todos os endpoints
2. **Autorização**: Verifica se a OS pertence à organização do usuário
3. **Validação**: Schemas Zod para validar dados de entrada
4. **Auditoria**: Log completo de todas as operações

## Testes Recomendados

### Backend
1. Testar atualização parcial de campos
2. Testar exclusão e verificar cascade (se aplicável)
3. Verificar se logs de auditoria estão sendo criados
4. Testar com usuário de organização diferente (deve falhar)

### Frontend
1. Editar item e verificar atualização na UI
2. Excluir item e verificar remoção da UI
3. Cancelar edição e verificar se dados não mudam
4. Testar validação de formulário em modo edit
5. Verificar feedback de sucesso/erro

## Próximos Passos

1. **Atualizar componentes UI** com botões de editar/deletar
2. **Adicionar modo de edição** aos diálogos de formulário
3. **Implementar funções** de editar e deletar nos componentes
4. **Testar fluxo completo** de edição e exclusão
5. **Verificar auditoria** no componente de histórico da OS

## Arquivos Modificados

```
✅ app/api/os/[id]/participantes/[participanteId]/route.ts (já existia, auditoria OK)
✅ app/api/os/[id]/hospedagens/[hospedagemId]/route.ts (auditoria adicionada)
✅ app/api/os/[id]/transportes/[transporteId]/route.ts (NOVO)
✅ app/api/os/[id]/atividades/[atividadeId]/route.ts (já existia, auditoria OK)
```

## Arquivos a Modificar

```
⏳ components/os/OSParticipantesSection.tsx
⏳ components/os/OSHospedagensSection.tsx
⏳ components/os/OSTransportesSection.tsx
⏳ components/os/OSAtividadesSection.tsx (verificar)
⏳ components/forms/ParticipanteFormDialog.tsx (adicionar modo edit)
```

## Observações

- Todos os endpoints usam PATCH para atualização parcial (não PUT)
- Dados antigos são sempre capturados antes da modificação para auditoria
- Erros de auditoria não impedem a operação principal
- IPs e User-Agents são capturados para rastreabilidade
