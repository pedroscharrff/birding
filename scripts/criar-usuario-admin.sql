-- Script para criar usuário admin e organização
-- Execute no Supabase SQL Editor

-- IMPORTANTE: Ajuste os valores conforme necessário

-- 1. Criar organização (se não existir)
INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  'org-default-001',
  'Birding Tours',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar usuário admin
-- ATENÇÃO: Troque 'seu-email@exemplo.com' pelo seu email real
-- A senha padrão será 'admin123' - TROQUE APÓS O LOGIN!

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
  'org-default-001',
  'Administrador',
  'admin@birdingtours.com',  -- TROQUE ESTE EMAIL
  NULL,
  'admin',
  '$2b$10$YourHashedPasswordHere',  -- Hash de 'admin123' - veja abaixo como gerar
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- COMO GERAR O HASH DA SENHA:
-- Execute este código Node.js para gerar o hash:
/*
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => console.log(hash));
*/

-- Ou use este hash pré-gerado para a senha 'admin123':
-- $2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e

-- EXEMPLO COMPLETO COM HASH:
-- UPDATE usuarios 
-- SET hash_senha = '$2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e'
-- WHERE email = 'admin@birdingtours.com';
