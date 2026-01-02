# Recuperação de Dados Após Migration

## Situação Atual

A migration `20260102151922_add_cotacoes_system` foi aplicada com sucesso, mas causou perda de dados devido a uma alteração incompatível na coluna `created_at` da tabela `organizacoes`.

## Diagnóstico

### O que aconteceu:

1. A migration tentou alterar `created_at` para `createdAt` sem mapeamento correto
2. O PostgreSQL dropou a coluna antiga e criou uma nova
3. Como a nova coluna era `NOT NULL` sem valor padrão, os dados existentes foram perdidos

### Estado da Migration:

- ✅ Migration aplicada com sucesso (não está em estado de falha)
- ❌ Dados de usuários, organizações e outros registros foram perdidos
- ✅ Estrutura do banco está correta agora

## Soluções Disponíveis

### Opção 1: Restaurar Backup do Supabase (RECOMENDADO)

**Vantagens:**
- Recupera TODOS os dados
- Mais seguro
- Rápido

**Como fazer:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Database** → **Backups**
4. Encontre o backup de **antes das 11:19 de hoje**
5. Clique em **Restore**
6. Aguarde a restauração

**Depois da restauração:**

```bash
# 1. Deletar a migration problemática
rm -rf prisma/migrations/20260102151922_add_cotacoes_system

# 2. O schema já está corrigido, então crie nova migration
npx prisma migrate dev --name add_cotacoes_system_fixed

# 3. Regenerar Prisma Client
npx prisma generate

# 4. Reiniciar servidor
npm run dev
```

### Opção 2: Recriar Dados Manualmente

Se não houver backup disponível, você precisará recriar os dados:

#### Passo 1: Verificar Dados Existentes

Execute no **Supabase SQL Editor**:

```sql
-- Arquivo: scripts/verificar-dados.sql
SELECT COUNT(*) as total_organizacoes FROM organizacoes;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_fornecedores FROM fornecedores;
SELECT COUNT(*) as total_os FROM os;
```

#### Passo 2: Criar Organização e Usuário Admin

**2.1. Gerar Hash da Senha:**

```bash
node scripts/gerar-hash-senha.js
```

Isso vai gerar um hash para a senha `admin123`. Copie o hash gerado.

**2.2. Executar SQL no Supabase:**

```sql
-- Criar organização
INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Birding Tours',
  NOW(),
  NOW()
)
RETURNING id;  -- Copie este ID

-- Criar usuário admin (use o ID da organização acima)
INSERT INTO usuarios (
  id,
  org_id,
  nome,
  email,
  telefone,
  role_global,
  hash_senha,
  ativo,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'COLE-O-ID-DA-ORGANIZACAO-AQUI',
  'Administrador',
  'admin@birdingtours.com',  -- TROQUE PELO SEU EMAIL
  NULL,
  'admin',
  'COLE-O-HASH-GERADO-AQUI',
  true,
  NOW(),
  NOW()
);
```

#### Passo 3: Recriar Fornecedores (se necessário)

```sql
-- Exemplo de fornecedor
INSERT INTO fornecedores (
  id,
  org_id,
  nome_fantasia,
  tipo,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'COLE-O-ID-DA-ORGANIZACAO-AQUI',
  'Hotel Exemplo',
  'hotelaria',
  NOW(),
  NOW()
);
```

## Prevenção Futura

### 1. Sempre Fazer Backup Antes de Migrations

```bash
# Antes de qualquer migration, faça backup manual no Supabase
# Dashboard → Database → Backups → Create backup
```

### 2. Testar Migrations em Ambiente de Desenvolvimento

```bash
# Use um banco de dados de teste primeiro
# Crie um arquivo .env.test com DATABASE_URL diferente
npx prisma migrate dev --preview-feature
```

### 3. Revisar SQL Gerado

Sempre verifique o arquivo `migration.sql` antes de aplicar:

```bash
# Após criar a migration, revise o SQL
cat prisma/migrations/[nome-da-migration]/migration.sql
```

### 4. Usar Migrations Seguras

Evite:
- ❌ Alterar colunas `NOT NULL` sem valor padrão
- ❌ Dropar colunas com dados
- ❌ Renomear colunas sem `@map`

Prefira:
- ✅ Adicionar colunas como `nullable` primeiro
- ✅ Usar `@map` para manter compatibilidade
- ✅ Migrations incrementais pequenas

## Correção Aplicada

O schema foi corrigido em `prisma/schema.prisma`:

```typescript
// ANTES (ERRADO):
model Organizacao {
  createdAt DateTime  // Sem @default e @map
}

// DEPOIS (CORRETO):
model Organizacao {
  createdAt DateTime @default(now()) @map("created_at")
}
```

## Checklist de Recuperação

- [ ] Verificar se há backup disponível no Supabase
- [ ] Se sim: Restaurar backup
- [ ] Se não: Executar script de verificação de dados
- [ ] Criar organização e usuário admin
- [ ] Recriar fornecedores necessários
- [ ] Testar login no sistema
- [ ] Verificar funcionalidades básicas
- [ ] Documentar dados que precisam ser recriados

## Arquivos de Suporte

- `scripts/verificar-dados.sql` - Verificar estado do banco
- `scripts/criar-usuario-admin.sql` - Criar usuário admin
- `scripts/gerar-hash-senha.js` - Gerar hash de senha

## Contato e Suporte

Se precisar de ajuda adicional:
1. Verifique os logs do Supabase
2. Consulte a documentação do Prisma sobre migrations
3. Considere usar `prisma db push` para desenvolvimento (não cria migrations)

## Lições Aprendidas

1. **Sempre revisar migrations antes de aplicar**
2. **Manter backups regulares**
3. **Testar em ambiente de desenvolvimento primeiro**
4. **Usar `@map` para manter compatibilidade com banco existente**
5. **Evitar alterações destrutivas em produção**
