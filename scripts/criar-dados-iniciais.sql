-- Script completo para criar dados iniciais
-- Execute no Supabase SQL Editor APÓS corrigir a coluna

-- 1. PRIMEIRO: Corrigir a coluna createdAt
ALTER TABLE organizacoes 
  RENAME COLUMN "createdAt" TO created_at;

-- 2. Criar organização
INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Birding Tours',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar usuário admin
-- Senha: admin123
-- Hash bcrypt pré-gerado: $2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e

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
  ativo = true;

-- 4. Verificar dados criados
SELECT 'Organizações criadas:' as info;
SELECT id, nome, created_at FROM organizacoes;

SELECT 'Usuários criados:' as info;
SELECT id, nome, email, role_global FROM usuarios;

-- 5. Informações de login
SELECT '
=================================
DADOS DE LOGIN
=================================
Email: admin@birdingtours.com
Senha: admin123

IMPORTANTE: Troque a senha após o primeiro login!
=================================
' as login_info;
