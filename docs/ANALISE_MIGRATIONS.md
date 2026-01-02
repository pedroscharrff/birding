# Análise Completa das Migrations

## Histórico de Migrations

### 1. `20251031025131_add_alergias_predefinidas` (Migration Inicial)

**Criou a estrutura base completa:**

#### Tabela `organizacoes`:
```sql
CREATE TABLE "organizacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- ✅ CORRETO
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);
```

#### Tabela `os` (estado inicial):
```sql
CREATE TABLE "os" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'planejamento',
    "agente_responsavel_id" TEXT NOT NULL,
    "descricao" TEXT,
    "checklist" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "os_pkey" PRIMARY KEY ("id")
);
```

**Observação:** Tabela OS **NÃO** tinha colunas financeiras inicialmente.

#### Tabelas de itens (estado inicial):
- `os_atividades` - SEM colunas de pagamento
- `os_hospedagens` - SEM colunas de pagamento
- `os_transportes` - SEM colunas de pagamento
- `os_passagens_aereas` - SEM colunas de pagamento

---

### 2. `20251031031257_add_presets_usage_and_templates`

**Adicionou:**
- Tabela `preset_templates`
- Tabela `preset_template_items`
- Colunas `uso_count` e `ultimo_uso` em `preset_items`

**Não afetou:** `organizacoes` ou `os`

---

### 3. `20251031130313_new_tarifas_fornecedores`

**Criou:**
- Tabela `fornecedor_tarifas`

**Não afetou:** `organizacoes` ou `os`

---

### 4. `20251031160616_add_hospedagem_fields`

**Adicionou em `os_hospedagens`:**
- `observacoes` TEXT
- `tarifa_id` TEXT
- `tipo_quarto` TEXT

**Não afetou:** `organizacoes` ou `os`

---

### 5. `20251031162024_add_auditoria_system`

**Criou:**
- Enum `AcaoAuditoria`
- Enum `EntidadeAuditoria`
- Tabela `auditoria_os`

**Não afetou:** `organizacoes` ou `os`

---

### 6. `20260102151922_add_cotacoes_system` ⚠️ PROBLEMÁTICA

**O que DEVERIA ter feito:**
1. Adicionar colunas financeiras em `os`
2. Adicionar colunas de pagamento nas tabelas de itens
3. Criar tabelas de cotações
4. Criar tabelas de políticas e pagamentos

**O que FEZ DE ERRADO:**
```sql
-- ❌ ERRO: Tentou dropar e recriar coluna
ALTER TABLE "organizacoes" DROP COLUMN "created_at",
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL;
```

Isso causou perda de dados porque:
- Dropou a coluna `created_at` existente (com dados)
- Tentou criar `createdAt` como `NOT NULL` sem valor padrão
- Não tinha `@map("created_at")` no schema

---

## Estado Esperado do Banco (Após Todas as Migrations)

### Tabela `organizacoes`:
```sql
"id" TEXT NOT NULL,
"nome" TEXT NOT NULL,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- ✅ Deve ser created_at
"updated_at" TIMESTAMP(3) NOT NULL
```

### Tabela `os` (com colunas financeiras):
```sql
-- Colunas originais
"id", "org_id", "titulo", "destino", "data_inicio", "data_fim", 
"status", "agente_responsavel_id", "descricao", "checklist",
"created_at", "updated_at"

-- Colunas adicionadas pela migration 6
"valor_venda" DECIMAL(12,2),
"moeda_venda" "Moeda" NOT NULL DEFAULT 'BRL',
"valor_recebido" DECIMAL(12,2) DEFAULT 0,
"custo_estimado" DECIMAL(12,2),
"custo_real" DECIMAL(12,2),
"margem_estimada" DECIMAL(5,2),
"obs_financeiras" TEXT
```

### Tabelas de itens (com colunas de pagamento):

**`os_atividades`, `os_hospedagens`, `os_transportes`, `os_passagens_aereas`:**
```sql
-- Colunas adicionadas pela migration 6
"status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
"data_pagamento" DATE,
"forma_pagamento" TEXT,
"referencia_pagamento" TEXT
```

### Novas tabelas criadas pela migration 6:
- `os_pagamentos`
- `organizacao_policies`
- `os_policy_snapshots`
- `cotacoes`
- `cotacao_itens`

### Novos enums criados pela migration 6:
- `StatusPagamento`
- `StatusCotacao`
- `CategoriaCotacaoItem`

---

## Problema Identificado

A migration 6 foi **parcialmente aplicada**:

✅ **Aplicado com sucesso:**
- Enums criados
- Tabelas novas criadas
- Alterações em enums existentes

❌ **NÃO aplicado ou aplicado incorretamente:**
- Coluna `created_at` em `organizacoes` foi alterada para `createdAt` (ERRO)
- Colunas financeiras em `os` podem não ter sido criadas
- Colunas de pagamento nas tabelas de itens podem não ter sido criadas

---

## Solução Correta

Baseado na análise das migrations, o script de correção deve:

1. **Corrigir `organizacoes.createdAt` → `created_at`**
2. **Adicionar colunas financeiras em `os`** (se não existirem)
3. **Adicionar colunas de pagamento nas tabelas de itens** (se não existirem)
4. **Criar usuário admin**

---

## Verificação Necessária

Antes de aplicar correção, verificar:
- Qual coluna existe em `organizacoes`: `created_at` ou `createdAt`?
- Quais colunas existem em `os`?
- Quais colunas existem em `os_atividades`, etc?

Isso evita erros de "coluna já existe" ou "coluna não existe".
