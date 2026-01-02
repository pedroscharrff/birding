-- Script para verificar se os dados ainda existem no banco
-- Execute no Supabase SQL Editor

-- 1. Verificar organizações
SELECT COUNT(*) as total_organizacoes FROM organizacoes;
SELECT * FROM organizacoes LIMIT 5;

-- 2. Verificar usuários
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT id, nome, email, role_global FROM usuarios LIMIT 10;

-- 3. Verificar fornecedores
SELECT COUNT(*) as total_fornecedores FROM fornecedores;

-- 4. Verificar OS
SELECT COUNT(*) as total_os FROM os;

-- 5. Verificar estrutura da tabela organizacoes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'organizacoes'
ORDER BY ordinal_position;
