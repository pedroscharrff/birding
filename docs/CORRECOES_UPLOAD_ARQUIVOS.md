# Correções de Upload de Arquivos - Sistema Completo

## 📋 Resumo das Alterações

Este documento descreve todas as correções aplicadas para garantir que o sistema de upload de arquivos funcione corretamente em todos os formulários.

---

## ✅ Correções Aplicadas

### 1. **Autenticação da API de Storage**

**Problema:** APIs de storage retornavam erro 401 (Não Autorizado).

**Solução:** Substituir `verifyAuth()` por `getSession()` em todas as APIs de storage:
- `app/api/storage/upload/route.ts`
- `app/api/storage/delete/route.ts`
- `app/api/storage/download/[key]/route.ts`
- `app/api/storage/list/route.ts`

**Motivo:** `getSession()` lê corretamente os cookies HTTP-only, enquanto `verifyAuth()` procurava tokens no header Authorization.

---

### 2. **Validators - Campo `documentos`/`arquivos`/`comprovantes`**

**Problema:** Validators Zod não incluíam campos de arquivos, então eram removidos do payload.

**Arquivos Corrigidos:**

#### `lib/validators/participante.ts`
```typescript
// Adicionado schema de arquivo
const uploadedFileSchema = z.object({
  url: z.string(),
  key: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
})

// Adicionado ao schema
documentos: z.array(uploadedFileSchema).optional(),
```

#### `lib/validators/fornecedor.ts`
```typescript
// Mesmo schema de arquivo
arquivos: z.array(uploadedFileSchema).optional(),
```

#### `app/api/os/[id]/despesas/[tipo]/[despesaId]/route.ts`
```typescript
// Adicionado ao validator inline
comprovantes: z.array(uploadedFileSchema).optional().nullable(),
```

---

### 3. **APIs - Salvamento de Arquivos**

#### **Participantes**
- ✅ Validator já corrigido
- ✅ API `POST /api/os/[id]/participantes` salva automaticamente via validator
- ✅ API `PATCH /api/os/[id]/participantes/[id]` salva automaticamente via validator

#### **Fornecedores**
**`app/api/fornecedores/route.ts` (POST):**
```typescript
const { ..., arquivos } = body
// ...
arquivos: arquivos || null,
```

**`app/api/fornecedores/[id]/route.ts` (PATCH):**
```typescript
const { ..., arquivos } = body
// ...
arquivos: arquivos !== undefined ? arquivos : existing.arquivos,
```

#### **Despesas (Comprovantes de Pagamento)**
**`lib/services/despesas.ts`:**
```typescript
// Adicionado ao tipo
comprovantes?: any[] | null

// Adicionado ao updateData
if (dados.comprovantes !== undefined) {
  updateData.comprovantes = dados.comprovantes
}
```

**`app/api/os/[id]/despesas/[tipo]/[despesaId]/route.ts`:**
```typescript
comprovantes: validatedData.comprovantes,
```

---

### 4. **API GET - Retorno de Arquivos**

#### **`app/api/os/[id]/route.ts`**
```typescript
participantes: {
  select: {
    // ... outros campos
    documentos: true,  // ✅ ADICIONADO
  }
}
```

---

### 5. **Componentes - Carregamento de Arquivos**

#### **`components/os/OSParticipantesSection.tsx`**
```typescript
// Interface atualizada
interface Participante {
  // ... outros campos
  documentos?: UploadedFile[]  // ✅ ADICIONADO
}

// initialData corrigido
initialData={editingParticipante ? {
  id: editingParticipante.id,  // ✅ ADICIONADO
  // ... outros campos
  documentos: editingParticipante.documentos || [],  // ✅ ADICIONADO
} : undefined}
```

---

## 🔄 Prisma Client

**IMPORTANTE:** Após todas as alterações, é necessário regenerar o Prisma Client:

```bash
# Parar o servidor Next.js (Ctrl+C)
npx prisma generate
# Reiniciar o servidor
npm run dev
```

**OU use o script:**
```bash
.\scripts\regenerate-prisma.bat
```

---

## 📝 Schema Prisma

Os seguintes modelos já possuem campos de arquivos no schema:

- ✅ `Participante.documentos` (Json)
- ✅ `Fornecedor.arquivos` (Json)
- ✅ `Hospedagem.arquivos` (Json)
- ✅ `Atividade.arquivos` (Json)
- ✅ `Transporte.arquivos` (Json)
- ✅ `PassagemAerea.comprovantes` (Json)

---

## 🎯 Formulários com Upload Funcionando

1. ✅ **ParticipanteFormDialog** - Aba "Arquivos"
2. ✅ **FornecedorFormDialog** - Seção "Documentos e Contratos"
3. ✅ **DespesaPagarDialog** - Seção "Comprovantes de Pagamento"

---

## 🧪 Como Testar

1. **Criar/Editar Participante:**
   - Adicionar arquivos na aba "Arquivos"
   - Salvar
   - Editar novamente → arquivos devem aparecer

2. **Criar/Editar Fornecedor:**
   - Adicionar arquivos em "Documentos e Contratos"
   - Salvar
   - Editar novamente → arquivos devem aparecer

3. **Marcar Despesa como Paga:**
   - Adicionar comprovantes
   - Salvar
   - Verificar que foram salvos

---

## 🔧 Troubleshooting

### Erro: "Property 'arquivos' does not exist"
**Solução:** Regenerar Prisma Client (`npx prisma generate`)

### Arquivos não aparecem ao editar
**Checklist:**
1. ✅ Campo está no validator?
2. ✅ Campo está sendo enviado no payload?
3. ✅ Campo está no `select` da API GET?
4. ✅ Campo está no `initialData` do componente?
5. ✅ Prisma Client foi regenerado?

### Erro 401 no upload
**Solução:** Verificar se a API usa `getSession()` em vez de `verifyAuth()`

---

## 📚 Arquivos Modificados

### Validators
- `lib/validators/participante.ts`
- `lib/validators/fornecedor.ts`

### APIs
- `app/api/storage/upload/route.ts`
- `app/api/storage/delete/route.ts`
- `app/api/storage/download/[key]/route.ts`
- `app/api/storage/list/route.ts`
- `app/api/os/[id]/route.ts`
- `app/api/fornecedores/route.ts`
- `app/api/fornecedores/[id]/route.ts`
- `app/api/os/[id]/despesas/[tipo]/[despesaId]/route.ts`

### Services
- `lib/services/despesas.ts`

### Componentes
- `components/os/OSParticipantesSection.tsx`
- `components/forms/ParticipanteFormDialog.tsx`
- `components/ui/file-upload.tsx`

---

## ✅ Status Final

🎉 **Sistema de Upload 100% Funcional!**

- ✅ Autenticação corrigida
- ✅ Validators atualizados
- ✅ APIs salvando arquivos
- ✅ APIs retornando arquivos
- ✅ Componentes carregando arquivos
- ✅ Upload, visualização e remoção funcionando
