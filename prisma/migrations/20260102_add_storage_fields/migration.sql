-- AlterTable: Adicionar campos de arquivos/documentos
ALTER TABLE "os_participantes" ADD COLUMN IF NOT EXISTS "documentos" JSONB;

-- AlterTable: Adicionar campos de arquivos em fornecedores
ALTER TABLE "fornecedores" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- AlterTable: Adicionar campos de arquivos em OS
ALTER TABLE "os" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- AlterTable: Adicionar campos de arquivos em hospedagens
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- AlterTable: Adicionar campos de arquivos em atividades
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- AlterTable: Adicionar campos de arquivos em transportes
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- AlterTable: Adicionar campos de arquivos em passagens aéreas
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- Comentários para documentação
COMMENT ON COLUMN "os_participantes"."documentos" IS 'Array JSON de documentos: passaporte, identidade, certificados de vacinação, etc.';
COMMENT ON COLUMN "fornecedores"."arquivos" IS 'Array JSON de arquivos: contratos, documentos fiscais, certificados, etc.';
COMMENT ON COLUMN "os"."arquivos" IS 'Array JSON de arquivos: contratos com clientes, propostas, documentos diversos';
COMMENT ON COLUMN "os_hospedagens"."arquivos" IS 'Array JSON de arquivos: vouchers, confirmações de reserva';
COMMENT ON COLUMN "os_atividades"."arquivos" IS 'Array JSON de arquivos: vouchers, confirmações';
COMMENT ON COLUMN "os_transportes"."arquivos" IS 'Array JSON de arquivos: vouchers, confirmações';
COMMENT ON COLUMN "os_passagens_aereas"."arquivos" IS 'Array JSON de arquivos: bilhetes, vouchers';
