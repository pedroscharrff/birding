-- Script para verificar o estado atual das atividades no banco

-- 1. Verificar se a coluna tipo existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'os_atividades' AND column_name = 'tipo';

-- 2. Contar atividades por tipo
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM os_atividades
GROUP BY tipo
ORDER BY tipo;

-- 3. Listar algumas atividades para verificar os dados
SELECT 
  id,
  nome,
  tipo,
  created_at
FROM os_atividades
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há atividades sem tipo (NULL)
SELECT COUNT(*) as sem_tipo
FROM os_atividades
WHERE tipo IS NULL;
