-- Verificar o estado atual da tabela organizacoes
-- Execute no Supabase SQL Editor

-- 1. Ver todas as colunas da tabela organizacoes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'organizacoes'
ORDER BY ordinal_position;

-- 2. Ver dados existentes (se houver)
SELECT * FROM organizacoes LIMIT 5;

-- 3. Contar registros
SELECT 
    'organizacoes' as tabela, 
    COUNT(*) as total 
FROM organizacoes
UNION ALL
SELECT 
    'usuarios' as tabela, 
    COUNT(*) as total 
FROM usuarios;
