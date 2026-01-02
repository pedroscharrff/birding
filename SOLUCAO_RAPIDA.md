# 🚨 SOLUÇÃO RÁPIDA - Corrigir Erro de Login

## Problema

O Prisma está tentando acessar `organizacoes.createdAt` mas a coluna no banco é `created_at`.

## Solução em 2 Passos

### Passo 1: Corrigir a Coluna no Banco

Acesse o **Supabase SQL Editor** e execute:

```sql
ALTER TABLE organizacoes 
  RENAME COLUMN "createdAt" TO created_at;
```

### Passo 2: Criar Dados Iniciais

No mesmo **Supabase SQL Editor**, execute o arquivo completo:

**Arquivo:** `scripts/criar-dados-iniciais.sql`

Ou copie e cole este SQL:

```sql
-- 1. Criar organização
INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Birding Tours',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar usuário admin
INSERT INTO usuarios (
  id,
  org_id,
  nome,
  email,
  role_global,
  hash_senha,
  ativo,
  created_at,
  updated_at
)
VALUES (
  'user-admin-001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Administrador',
  'admin@birdingtours.com',
  'admin',
  '$2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  hash_senha = EXCLUDED.hash_senha,
  org_id = EXCLUDED.org_id,
  ativo = true;
```

### Passo 3: Fazer Login

```
Email: admin@birdingtours.com
Senha: admin123
```

**⚠️ IMPORTANTE:** Troque a senha após o primeiro login!

---

## Se Ainda Não Funcionar

Execute este comando para regenerar o Prisma Client:

```bash
npx prisma generate
```

E reinicie o servidor:

```bash
npm run dev
```

---

## Resumo do Que Aconteceu

1. A migration alterou `created_at` → `createdAt` no banco
2. Mas o schema Prisma usa `@map("created_at")`
3. Isso criou incompatibilidade
4. A solução é renomear de volta para `created_at`

---

## Arquivos de Referência

- `scripts/fix-organizacoes-column.sql` - Corrige apenas a coluna
- `scripts/criar-dados-iniciais.sql` - Script completo com dados
- `docs/RECUPERACAO_DADOS.md` - Documentação completa
