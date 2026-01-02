# Exemplos de Integração do Sistema de Auditoria

Este documento contém exemplos práticos de como integrar o sistema de auditoria nas APIs existentes.

---

## Padrão Geral de Integração

### 1. Para operações CREATE

```typescript
import { logAuditoria } from '@/lib/services/auditoria'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()

    // ... validação ...

    // CRIAR REGISTRO
    const registro = await prisma.ENTIDADE.create({
      data: validatedData
    })

    // ✅ LOG DE AUDITORIA
    await logAuditoria({
      osId,
      usuarioId: session.userId,
      acao: 'criar',
      entidade: 'NOME_ENTIDADE', // Ex: 'participante', 'atividade'
      entidadeId: registro.id,
      dadosNovos: registro,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    })

    return NextResponse.json({ success: true, data: registro })
  } catch (error: any) {
    // ... tratamento de erro ...
  }
}
```

---

### 2. Para operações UPDATE/PATCH

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; entidadeId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, entidadeId } = params
    const body = await request.json()

    // ... validação ...

    // ✅ BUSCAR DADOS ANTIGOS (antes de atualizar)
    const dadosAntigos = await prisma.ENTIDADE.findUnique({
      where: { id: entidadeId }
    })

    if (!dadosAntigos) {
      return NextResponse.json(
        { success: false, error: 'Registro não encontrado' },
        { status: 404 }
      )
    }

    // ATUALIZAR REGISTRO
    const registro = await prisma.ENTIDADE.update({
      where: { id: entidadeId },
      data: validatedData
    })

    // ✅ LOG DE AUDITORIA (com diff automático)
    await logAuditoria({
      osId,
      usuarioId: session.userId,
      acao: 'atualizar',
      entidade: 'NOME_ENTIDADE',
      entidadeId: registro.id,
      dadosAntigos,
      dadosNovos: registro,
      // descricao e campos são gerados automaticamente!
    })

    return NextResponse.json({ success: true, data: registro })
  } catch (error: any) {
    // ... tratamento de erro ...
  }
}
```

---

### 3. Para operações DELETE

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entidadeId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, entidadeId } = params

    // ✅ BUSCAR DADOS ANTES DE DELETAR
    const dadosAntigos = await prisma.ENTIDADE.findUnique({
      where: { id: entidadeId }
    })

    if (!dadosAntigos) {
      return NextResponse.json(
        { success: false, error: 'Registro não encontrado' },
        { status: 404 }
      )
    }

    // DELETAR REGISTRO
    await prisma.ENTIDADE.delete({
      where: { id: entidadeId }
    })

    // ✅ LOG DE AUDITORIA
    await logAuditoria({
      osId,
      usuarioId: session.userId,
      acao: 'excluir',
      entidade: 'NOME_ENTIDADE',
      entidadeId,
      dadosAntigos,
      descricao: `Removeu ${NOME_ENTIDADE}: ${dadosAntigos.nome || dadosAntigos.titulo || entidadeId}`
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // ... tratamento de erro ...
  }
}
```

---

## Exemplos Específicos por Entidade

### Participantes

**POST /api/os/[id]/participantes**
```typescript
const participante = await prisma.participante.create({ data: validatedData })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosNovos: participante,
})
```

**PATCH /api/os/[id]/participantes/[participanteId]**
```typescript
const dadosAntigos = await prisma.participante.findUnique({ where: { id: participanteId } })
const participante = await prisma.participante.update({ ... })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosAntigos,
  dadosNovos: participante,
})
```

**DELETE /api/os/[id]/participantes/[participanteId]**
```typescript
const dadosAntigos = await prisma.participante.findUnique({ where: { id: participanteId } })
await prisma.participante.delete({ where: { id: participanteId } })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'excluir',
  entidade: 'participante',
  entidadeId: participanteId,
  dadosAntigos,
})
```

---

### Atividades

**POST /api/os/[id]/atividades**
```typescript
const atividade = await prisma.atividade.create({ data: validatedData })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'atividade',
  entidadeId: atividade.id,
  dadosNovos: atividade,
})
```

**PATCH /api/os/[id]/atividades/[atividadeId]**
```typescript
const dadosAntigos = await prisma.atividade.findUnique({ where: { id: atividadeId } })
const atividade = await prisma.atividade.update({ ... })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'atividade',
  entidadeId: atividade.id,
  dadosAntigos,
  dadosNovos: atividade,
})
```

**DELETE /api/os/[id]/atividades/[atividadeId]**
```typescript
const dadosAntigos = await prisma.atividade.findUnique({ where: { id: atividadeId } })
await prisma.atividade.delete({ where: { id: atividadeId } })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'excluir',
  entidade: 'atividade',
  entidadeId: atividadeId,
  dadosAntigos,
})
```

---

### Hospedagens

**POST /api/os/[id]/hospedagens**
```typescript
const hospedagem = await prisma.hospedagem.create({ data: validatedData })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'hospedagem',
  entidadeId: hospedagem.id,
  dadosNovos: hospedagem,
})
```

**PATCH /api/os/[id]/hospedagens/[hospedagemId]**
```typescript
const dadosAntigos = await prisma.hospedagem.findUnique({ where: { id: hospedagemId } })
const hospedagem = await prisma.hospedagem.update({ ... })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'hospedagem',
  entidadeId: hospedagem.id,
  dadosAntigos,
  dadosNovos: hospedagem,
})
```

---

### Transportes

**POST /api/os/[id]/transportes**
```typescript
const transporte = await prisma.transporte.create({ data: validatedData })

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'transporte',
  entidadeId: transporte.id,
  dadosNovos: transporte,
})
```

---

### OS Principal

**POST /api/os** (criar OS)
```typescript
const os = await prisma.oS.create({ data: validatedData })

// Criar histórico de status (já existe)
await prisma.historicoStatus.create({ ... })

// ✅ Adicionar log de auditoria
await logAuditoria({
  osId: os.id,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'os',
  entidadeId: os.id,
  dadosNovos: os,
})
```

**PATCH /api/os/[id]** (atualizar OS)
```typescript
const dadosAntigos = await prisma.oS.findUnique({ where: { id: osId } })
const os = await prisma.oS.update({ ... })

// Se status mudou, criar histórico
if (dadosAntigos.status !== os.status) {
  await prisma.historicoStatus.create({ ... })

  // Log específico de mudança de status
  await logAuditoria({
    osId: os.id,
    usuarioId: session.userId,
    acao: 'status_alterado',
    entidade: 'os',
    entidadeId: os.id,
    dadosAntigos: { status: dadosAntigos.status },
    dadosNovos: { status: os.status },
    descricao: `Status alterado de "${dadosAntigos.status}" para "${os.status}"`
  })
} else {
  // Log normal de atualização
  await logAuditoria({
    osId: os.id,
    usuarioId: session.userId,
    acao: 'atualizar',
    entidade: 'os',
    entidadeId: os.id,
    dadosAntigos,
    dadosNovos: os,
  })
}
```

---

## Tratamento de Erros

### Não bloquear operação se auditoria falhar

```typescript
try {
  const registro = await prisma.ENTIDADE.create({ ... })

  // Auditoria em try-catch separado
  try {
    await logAuditoria({ ... })
  } catch (auditError) {
    console.error('[Auditoria] Erro ao registrar log:', auditError)
    // Não falha a operação principal
  }

  return NextResponse.json({ success: true, data: registro })
} catch (error) {
  // Trata erro da operação principal
}
```

### Ou com Promise.allSettled (paralelo)

```typescript
const [createResult] = await Promise.allSettled([
  prisma.ENTIDADE.create({ ... }),
  logAuditoria({ ... })
])

if (createResult.status === 'rejected') {
  throw createResult.reason
}

return NextResponse.json({ success: true, data: createResult.value })
```

---

## Wrapper Helper (opcional)

Para simplificar, você pode criar um wrapper:

```typescript
// lib/utils/auditoria-wrapper.ts
import { logAuditoria } from '@/lib/services/auditoria'

export async function withAuditoria<T>(
  operation: () => Promise<T>,
  auditParams: Omit<LogAuditoriaParams, 'dadosNovos'> & {
    getResult?: (result: T) => any
  }
): Promise<T> {
  const result = await operation()

  try {
    await logAuditoria({
      ...auditParams,
      dadosNovos: auditParams.getResult ? auditParams.getResult(result) : result,
    })
  } catch (error) {
    console.error('[Auditoria] Erro:', error)
  }

  return result
}

// Uso:
const participante = await withAuditoria(
  () => prisma.participante.create({ data: validatedData }),
  {
    osId,
    usuarioId: session.userId,
    acao: 'criar',
    entidade: 'participante',
  }
)
```

---

## Checklist de Integração

Para cada endpoint:

- [ ] Importar `logAuditoria` de `@/lib/services/auditoria`
- [ ] Para UPDATE/DELETE: buscar `dadosAntigos` antes da operação
- [ ] Após operação bem-sucedida: chamar `logAuditoria`
- [ ] Definir `acao` correta: 'criar', 'atualizar', 'excluir'
- [ ] Definir `entidade` correta conforme enum
- [ ] Passar `entidadeId` do registro afetado
- [ ] Para UPDATE: passar tanto `dadosAntigos` quanto `dadosNovos`
- [ ] Opcional: adicionar `metadata` (IP, User-Agent)
- [ ] Wrap em try-catch para não bloquear operação principal

---

## Teste Rápido

Depois de integrar, teste com:

```typescript
// Em qualquer endpoint
const { data, total } = await buscarAuditorias({
  osId: 'uuid-da-os',
  limit: 10
})

console.log('Últimos 10 logs:', data)
```

---

## Próximos Passos

1. ✅ Integrar em cada endpoint seguindo os exemplos acima
2. ✅ Testar cada operação (criar, atualizar, deletar)
3. ✅ Verificar logs no banco: `SELECT * FROM auditoria_os ORDER BY created_at DESC LIMIT 10;`
4. ✅ Verificar cache Redis (se configurado)
5. ✅ Criar interface de visualização (Fase 3)
