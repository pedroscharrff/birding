-- SOLUÇÃO FINAL - Execute este script completo no Supabase SQL Editor
-- Ele funciona independente do estado atual do banco

-- ============================================
-- PARTE 1: Garantir que a coluna created_at existe
-- ============================================

-- Verificar se a coluna createdAt existe e renomear para created_at
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizacoes' 
        AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE organizacoes RENAME COLUMN "createdAt" TO created_at;
        RAISE NOTICE 'Coluna createdAt renomeada para created_at';
    END IF;
END $$;

-- Se a coluna created_at não existe, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizacoes' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE organizacoes ADD COLUMN created_at TIMESTAMP(3) DEFAULT NOW();
        UPDATE organizacoes SET created_at = NOW() WHERE created_at IS NULL;
        ALTER TABLE organizacoes ALTER COLUMN created_at SET NOT NULL;
        RAISE NOTICE 'Coluna created_at criada';
    END IF;
END $$;

-- ============================================
-- PARTE 2: Criar organização
-- ============================================

INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Birding Tours',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  updated_at = NOW();

-- ============================================
-- PARTE 3: Criar usuário admin
-- ============================================

-- Senha: admin123
-- Hash: $2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e

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
  'user-admin-001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Administrador',
  'admin@birdingtours.com',
  NULL,
  'admin',
  '$2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  hash_senha = EXCLUDED.hash_senha,
  org_id = EXCLUDED.org_id,
  ativo = true,
  updated_at = NOW();

-- ============================================
-- PARTE 4: Verificar resultado
-- ============================================

SELECT '=== ESTRUTURA DA TABELA ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizacoes'
ORDER BY ordinal_position;

SELECT '=== DADOS CRIADOS ===' as info;
SELECT 'Organizações:' as tipo, COUNT(*) as total FROM organizacoes
UNION ALL
SELECT 'Usuários:' as tipo, COUNT(*) as total FROM usuarios;

SELECT '=== DADOS DE LOGIN ===' as info;
SELECT 
    '
    ================================
    DADOS DE LOGIN
    ================================
    Email: admin@birdingtours.com
    Senha: admin123
    
    IMPORTANTE: Troque a senha após o primeiro login!
    ================================
    ' as login_info;

SELECT * FROM organizacoes;
SELECT id, nome, email, role_global, ativo FROM usuarios;
