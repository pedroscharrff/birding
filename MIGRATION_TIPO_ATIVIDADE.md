# Migration: Separar Atividades e Alimentação

## Problema
Atividades e alimentação estavam sendo salvas na mesma tabela sem diferenciação, causando confusão na interface.

## Solução
Adicionado campo `tipo` ao modelo `Atividade` com enum `TipoAtividade` ('atividade' | 'alimentacao').

## Arquivos Alterados

### 1. Schema Prisma (`prisma/schema.prisma`)
- ✅ Adicionado enum `TipoAtividade`
- ✅ Adicionado campo `tipo` ao modelo `Atividade`
- ✅ Adicionados índices para otimizar queries

### 2. Validator (`lib/validators/atividade.ts`)
- ✅ Adicionado campo `tipo` ao schema de validação

### 3. Componentes Frontend
- ✅ `components/os/OSAlimentacaoSection.tsx` - Envia `tipo: 'alimentacao'`
- ✅ `components/os/OSAtividadesSection.tsx` - Envia `tipo: 'atividade'`
- ✅ `app/(dashboard)/dashboard/os/[id]/page.tsx` - Filtra por tipo ao invés de nome

### 4. Migration SQL
- ✅ Criada migration em `prisma/migrations/20260115_add_tipo_atividade/migration.sql`

## Passos para Aplicar no Servidor

### 1. Fazer backup do banco de dados
```bash
pg_dump -h db.dduqhlshnenatajmyadb.supabase.co -U postgres -d postgres > backup_antes_tipo_atividade.sql
```

### 2. Aplicar a migration manualmente
```bash
cd /home/ostour/birding

# Aplicar a migration SQL diretamente no banco
psql $DATABASE_URL -f prisma/migrations/20260115_add_tipo_atividade/migration.sql

# OU usar o Prisma (se não houver conflitos)
npx prisma migrate deploy
```

### 3. Regenerar o Prisma Client
```bash
npx prisma generate
```

### 4. Rebuild da aplicação
```bash
npm run build
```

### 5. Restart do servidor
```bash
pm2 restart ostour
```

## Verificação

Após aplicar as mudanças:

1. **Atividades existentes**: Todas receberão `tipo = 'atividade'` por padrão
2. **Novas alimentações**: Serão criadas com `tipo = 'alimentacao'`
3. **Novas atividades**: Serão criadas com `tipo = 'atividade'`
4. **Interface**: Cada aba mostrará apenas seus respectivos itens

## Rollback (se necessário)

Se algo der errado, você pode reverter:

```sql
-- Remover índices
DROP INDEX IF EXISTS "os_atividades_tipo_idx";
DROP INDEX IF EXISTS "os_atividades_os_id_tipo_idx";

-- Remover coluna
ALTER TABLE "os_atividades" DROP COLUMN "tipo";

-- Remover enum
DROP TYPE "TipoAtividade";
```

Depois restaurar o backup:
```bash
psql $DATABASE_URL < backup_antes_tipo_atividade.sql
```

## Notas Importantes

- ⚠️ **Dados existentes**: Todas as atividades existentes receberão `tipo = 'atividade'` por padrão
- ⚠️ Se houver alimentações já cadastradas que você quer marcar como tal, será necessário um script de atualização manual
- ✅ A partir de agora, todas as novas entradas serão corretamente categorizadas
