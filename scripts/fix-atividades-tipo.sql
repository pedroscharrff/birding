-- Script para corrigir registros de atividades sem tipo definido
-- Este script atualiza atividades antigas que não possuem o campo 'tipo' definido

-- Primeiro, vamos verificar quantos registros existem sem tipo ou com tipo NULL
-- SELECT COUNT(*) FROM os_atividades WHERE tipo IS NULL;

-- Atualizar registros sem tipo para 'atividade' (padrão)
-- Registros que começam com "Alimentação:" serão marcados como 'alimentacao'
UPDATE os_atividades 
SET tipo = 'alimentacao' 
WHERE tipo IS NULL 
  AND (nome ILIKE 'Alimentação:%' OR nome ILIKE 'Refeição:%' OR nome ILIKE '%almoço%' OR nome ILIKE '%jantar%' OR nome ILIKE '%café%');

-- Atualizar os demais registros sem tipo para 'atividade'
UPDATE os_atividades 
SET tipo = 'atividade' 
WHERE tipo IS NULL;

-- Verificar o resultado
SELECT tipo, COUNT(*) as total 
FROM os_atividades 
GROUP BY tipo;
