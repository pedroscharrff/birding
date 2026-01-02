-- CreateTable
CREATE TABLE "fornecedor_tarifas" (
    "id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "unidade" TEXT,
    "vigencia_inicio" DATE,
    "vigencia_fim" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_fornecedor_id_idx" ON "fornecedor_tarifas"("fornecedor_id");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_ativo_idx" ON "fornecedor_tarifas"("ativo");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_vigencia_inicio_idx" ON "fornecedor_tarifas"("vigencia_inicio");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_vigencia_fim_idx" ON "fornecedor_tarifas"("vigencia_fim");

-- AddForeignKey
ALTER TABLE "fornecedor_tarifas" ADD CONSTRAINT "fornecedor_tarifas_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
