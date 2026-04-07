/*
  Warnings:

  - A unique constraint covering the columns `[os_id,guia_id,extensao_id]` on the table `os_guias_designacao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[os_id,motorista_id,extensao_id]` on the table `os_motoristas_designacao` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "os_guias_designacao_os_id_guia_id_key";

-- DropIndex
DROP INDEX "os_motoristas_designacao_os_id_motorista_id_key";

-- AlterTable
ALTER TABLE "contas_pagamento" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cotacoes" ADD COLUMN     "arquivos" JSONB;

-- AlterTable
ALTER TABLE "financeiro_lancamentos" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "itens_incluidos" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "os" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "os_atividades" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "os_extensoes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "os_hospedagens" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "os_pagamentos" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "os_passagens_aereas" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "os_transportes" ADD COLUMN     "cotacao_atual" DECIMAL(10,4);

-- CreateIndex
CREATE INDEX "os_fornecedores_extensao_id_idx" ON "os_fornecedores"("extensao_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_guias_designacao_os_id_guia_id_extensao_id_key" ON "os_guias_designacao"("os_id", "guia_id", "extensao_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_motoristas_designacao_os_id_motorista_id_extensao_id_key" ON "os_motoristas_designacao"("os_id", "motorista_id", "extensao_id");
