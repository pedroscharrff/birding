-- AlterTable
ALTER TABLE "fornecedor_tarifas" 
ADD COLUMN "tipo_quarto" TEXT,
ADD COLUMN "regime" TEXT,
ADD COLUMN "quartos" INTEGER;

-- Comentários explicativos
COMMENT ON COLUMN "fornecedor_tarifas"."tipo_quarto" IS 'Tipo de quarto: single, duplo, triplo, suite, etc. Específico para fornecedores de hotelaria';
COMMENT ON COLUMN "fornecedor_tarifas"."regime" IS 'Regime de alimentação: sem_cafe, cafe, meia_pensao, pensao_completa, all_inclusive. Específico para fornecedores de hotelaria';
COMMENT ON COLUMN "fornecedor_tarifas"."quartos" IS 'Número de quartos incluídos nesta tarifa. Específico para fornecedores de hotelaria';
