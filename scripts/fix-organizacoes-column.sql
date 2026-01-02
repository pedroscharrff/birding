-- Script para corrigir a coluna createdAt/created_at na tabela organizacoes
-- Execute no Supabase SQL Editor

-- A migration criou a coluna "createdAt" mas o Prisma espera "created_at"
-- Vamos renomear de volta

ALTER TABLE organizacoes 
  RENAME COLUMN "createdAt" TO created_at;

-- Verificar se funcionou
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'organizacoes'
ORDER BY ordinal_position;
