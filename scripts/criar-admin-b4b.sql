-- Script para criar o usuário Super Admin B4B
-- Execute diretamente no Supabase SQL Editor

-- Hash bcrypt da senha 'S3lab2024$' gerado com bcryptjs custo 10
-- Hash: $2a$10$qVJOx5vKfdF/KskZKF7woeGCcsaub74s.QG6.p57pTrE1qR6bCeA6

-- Primeiro, garantir que existe uma organização
INSERT INTO organizacoes (id, nome, created_at, updated_at)
SELECT gen_random_uuid(), 'Birding Tours', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizacoes LIMIT 1);

-- Criar o super admin
INSERT INTO usuarios (id, org_id, nome, email, hash_senha, role_global, ativo, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM organizacoes LIMIT 1),
  'Super Admin B4B',
  'admin@b4b.agency',
  '$2a$10$qVJOx5vKfdF/KskZKF7woeGCcsaub74s.QG6.p57pTrE1qR6bCeA6',
  'admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@b4b.agency');

-- Se já existir, atualizar nome e role
UPDATE usuarios
SET
  nome = 'Super Admin B4B',
  role_global = 'admin',
  ativo = true,
  hash_senha = '$2a$10$qVJOx5vKfdF/KskZKF7woeGCcsaub74s.QG6.p57pTrE1qR6bCeA6'
WHERE email = 'admin@b4b.agency';
