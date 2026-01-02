# Migrations - Padrões e Boas Práticas

Este documento define os padrões a serem seguidos em todas as migrations do projeto.

## 📋 Estrutura de Migration

### Nomenclatura

```
YYYYMMDD_nome_descritivo/
  migration.sql
```

Exemplo:
- `20250131_performance_optimization/`
- `20250201_add_user_preferences/`
- `20250215_fix_cascade_relations/`

### Template Base

```sql
-- ============================================
-- [TÍTULO DA MIGRATION]
-- Data: YYYY-MM-DD
-- ============================================
-- Descrição breve do que a migration faz
-- e por que ela é necessária.

-- ============================================
-- 1. SEÇÃO PRINCIPAL
-- ============================================

-- Comando SQL 1
CREATE TABLE ...;

-- Comando SQL 2
ALTER TABLE ...;

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE nome_tabela IS 'Descrição da tabela';
COMMENT ON COLUMN nome_tabela.coluna IS 'Descrição da coluna';

-- ============================================
-- ANÁLISE E ESTATÍSTICAS
-- ============================================

ANALYZE nome_tabela;
```

---

## 🎯 Padrões Obrigatórios

### 1. Índices

#### Nomenclatura de Índices

```sql
-- Formato: tabela_colunas_idx
CREATE INDEX "os_org_status_idx" ON "os"("org_id", "status");

-- Para índices únicos: tabela_colunas_unique
CREATE UNIQUE INDEX "usuarios_email_unique" ON "usuarios"("email");

-- Para índices de texto: tabela_coluna_trgm_idx
CREATE INDEX "os_titulo_trgm_idx" ON "os" USING gin ("titulo" gin_trgm_ops);
```

#### Sempre usar IF NOT EXISTS

```sql
-- ✅ CORRETO
CREATE INDEX IF NOT EXISTS "os_org_status_idx" ON "os"("org_id", "status");

-- ❌ ERRADO (pode falhar se índice já existir)
CREATE INDEX "os_org_status_idx" ON "os"("org_id", "status");
```

#### Ordem das Colunas em Índices Compostos

1. **Filtros de igualdade primeiro** (WHERE coluna = valor)
2. **Filtros de range depois** (WHERE coluna >= valor)
3. **Ordenação por último** (ORDER BY coluna)

```sql
-- ✅ CORRETO
CREATE INDEX "os_org_status_data_idx"
ON "os"("org_id", "status", "data_inicio" DESC);

-- Para query: WHERE org_id = X AND status = Y ORDER BY data_inicio DESC

-- ❌ ERRADO (ordem subótima)
CREATE INDEX "os_data_status_org_idx"
ON "os"("data_inicio" DESC, "status", "org_id");
```

### 2. Materialized Views

#### Template

```sql
-- Criar view
CREATE MATERIALIZED VIEW IF NOT EXISTS "mv_nome" AS
SELECT
  coluna1,
  COUNT(*) as total,
  SUM(coluna2) as soma
FROM tabela
GROUP BY coluna1;

-- Índice único obrigatório (permite REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX IF NOT EXISTS "mv_nome_pk_idx" ON "mv_nome"(coluna1);

-- Índices adicionais para queries
CREATE INDEX IF NOT EXISTS "mv_nome_outros_idx" ON "mv_nome"(coluna2);

-- Comentários
COMMENT ON MATERIALIZED VIEW "mv_nome" IS
'Descrição da view e quando deve ser atualizada';
```

#### Função de Refresh

```sql
CREATE OR REPLACE FUNCTION refresh_categoria_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_view1";
  REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_view2";
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_categoria_stats() IS
'Atualiza views da categoria X - executar após mudanças nos dados';
```

### 3. Extensões PostgreSQL

```sql
-- Sempre usar IF NOT EXISTS
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Alterações de Estrutura

#### Adicionar Colunas

```sql
-- Com valor padrão para linhas existentes
ALTER TABLE "tabela"
ADD COLUMN IF NOT EXISTS "nova_coluna" TEXT DEFAULT 'valor_padrao';

-- Depois remover default se não for necessário para novas linhas
ALTER TABLE "tabela"
ALTER COLUMN "nova_coluna" DROP DEFAULT;
```

#### Renomear Colunas

```sql
-- Sempre verificar se coluna existe antes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tabela' AND column_name = 'nome_antigo'
  ) THEN
    ALTER TABLE "tabela" RENAME COLUMN "nome_antigo" TO "nome_novo";
  END IF;
END $$;
```

#### Alterar Tipo de Coluna

```sql
-- Com conversão explícita
ALTER TABLE "tabela"
ALTER COLUMN "coluna" TYPE INTEGER USING "coluna"::INTEGER;
```

### 5. Constraints

```sql
-- Foreign Keys com ON DELETE e ON UPDATE
ALTER TABLE "tabela_filha"
ADD CONSTRAINT "fk_tabela_filha_pai"
FOREIGN KEY ("pai_id")
REFERENCES "tabela_pai"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Check Constraints
ALTER TABLE "produtos"
ADD CONSTRAINT "check_preco_positivo"
CHECK (preco > 0);

-- Unique Constraints
ALTER TABLE "usuarios"
ADD CONSTRAINT "unique_usuario_email"
UNIQUE ("email");
```

---

## 🔄 Padrão para Rollback

Sempre incluir instruções de rollback comentadas:

```sql
-- ============================================
-- ROLLBACK (se necessário)
-- ============================================
-- Execute estes comandos para reverter a migration:
--
-- DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;
-- DROP INDEX IF EXISTS os_org_status_data_idx;
-- ALTER TABLE tabela DROP COLUMN IF EXISTS coluna;
```

---

## 📊 Padrão para Performance

### Após Modificações Estruturais

```sql
-- Atualizar estatísticas do query planner
ANALYZE tabela1;
ANALYZE tabela2;
ANALYZE tabela3;

-- Ou para todas as tabelas
VACUUM ANALYZE;
```

### Monitoramento de Índices

Sempre incluir queries úteis comentadas:

```sql
-- ============================================
-- QUERIES DE MONITORAMENTO
-- ============================================

-- Verificar uso dos índices criados:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as "Vezes Usado",
--   idx_tup_read as "Tuplas Lidas"
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Verificar tamanho dos índices:
-- SELECT
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as "Tamanho"
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public';
```

---

## 🎨 Exemplo Completo

```sql
-- ============================================
-- ADICIONAR SISTEMA DE NOTIFICAÇÕES
-- Data: 2025-02-01
-- ============================================
-- Adiciona tabela de notificações com índices
-- otimizados e trigger para atualização automática.

-- ============================================
-- 1. CRIAR TABELA
-- ============================================

CREATE TABLE IF NOT EXISTS "notificacoes" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "usuario_id" UUID NOT NULL,
  "tipo" VARCHAR(50) NOT NULL,
  "titulo" TEXT NOT NULL,
  "mensagem" TEXT,
  "lida" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "read_at" TIMESTAMP,

  CONSTRAINT "fk_notificacoes_usuario"
    FOREIGN KEY ("usuario_id")
    REFERENCES "usuarios"("id")
    ON DELETE CASCADE
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

-- Listagem de notificações (principal query)
CREATE INDEX IF NOT EXISTS "notificacoes_usuario_lida_created_idx"
ON "notificacoes"("usuario_id", "lida", "created_at" DESC);

-- Busca por tipo
CREATE INDEX IF NOT EXISTS "notificacoes_tipo_idx"
ON "notificacoes"("tipo");

-- Busca por texto
CREATE INDEX IF NOT EXISTS "notificacoes_titulo_trgm_idx"
ON "notificacoes" USING gin ("titulo" gin_trgm_ops);

-- ============================================
-- 3. CRIAR TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lida = TRUE AND OLD.lida = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_read_at
BEFORE UPDATE ON "notificacoes"
FOR EACH ROW
EXECUTE FUNCTION update_read_at();

-- ============================================
-- 4. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE "notificacoes" IS
'Sistema de notificações para usuários';

COMMENT ON COLUMN "notificacoes"."tipo" IS
'Tipo da notificação: os_criada, participante_adicionado, etc';

COMMENT ON COLUMN "notificacoes"."read_at" IS
'Preenchido automaticamente via trigger quando lida=true';

-- ============================================
-- 5. ESTATÍSTICAS
-- ============================================

ANALYZE "notificacoes";

-- ============================================
-- ROLLBACK
-- ============================================
-- Para reverter:
-- DROP TRIGGER IF EXISTS trigger_update_read_at ON "notificacoes";
-- DROP FUNCTION IF EXISTS update_read_at();
-- DROP TABLE IF EXISTS "notificacoes" CASCADE;
```

---

## ✅ Checklist de Migration

Antes de criar uma migration, verifique:

- [ ] Nomenclatura segue padrão `YYYYMMDD_nome_descritivo`
- [ ] Todos os comandos usam `IF NOT EXISTS` ou `IF EXISTS`
- [ ] Índices compostos têm ordem correta (filtros → ranges → ordenação)
- [ ] Views materializadas têm índice único (para REFRESH CONCURRENTLY)
- [ ] Foreign keys têm ON DELETE e ON UPDATE definidos
- [ ] Comentários explicativos adicionados
- [ ] ANALYZE executado para tabelas modificadas
- [ ] Instruções de rollback incluídas (comentadas)
- [ ] Migration testada localmente
- [ ] Documentação atualizada se necessário

---

## 🚨 O Que NUNCA Fazer

1. **❌ Modificar migration já aplicada em produção**
   - Crie uma nova migration para correções

2. **❌ Deletar dados sem backup**
   ```sql
   -- ❌ NUNCA faça isso sem backup
   DELETE FROM tabela;
   ```

3. **❌ Criar índices sem IF NOT EXISTS**
   - Pode falhar em ambientes com seed de desenvolvimento

4. **❌ Usar SELECT * em materialized views**
   - Sempre especifique colunas necessárias

5. **❌ Esquecer de adicionar índice único em materialized views**
   - Necessário para REFRESH CONCURRENTLY

6. **❌ Criar índices duplicados**
   ```sql
   -- Se já existe: CREATE INDEX "os_org_id_idx" ON "os"("org_id")
   -- ❌ Não crie: CREATE INDEX "os_organizacao_idx" ON "os"("org_id")
   ```

---

## 📚 Referências

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Index Best Practices](https://www.postgresql.org/docs/current/indexes-types.html)
- [Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)

---

**Mantenha este padrão em todas as migrations futuras!**
