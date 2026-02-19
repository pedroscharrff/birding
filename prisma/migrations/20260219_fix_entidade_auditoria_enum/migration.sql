-- Adiciona o valor 'extensao' ao enum 'EntidadeAuditoria' se ele não existir
DO $$ BEGIN
  ALTER TYPE "EntidadeAuditoria" ADD VALUE IF NOT EXISTS 'extensao';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
