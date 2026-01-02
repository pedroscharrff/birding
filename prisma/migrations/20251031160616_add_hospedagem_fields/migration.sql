-- AlterEnum
ALTER TYPE "RegimeHospedagem" ADD VALUE 'all_inclusive';

-- AlterTable
ALTER TABLE "os_hospedagens" ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "tarifa_id" TEXT,
ADD COLUMN     "tipo_quarto" TEXT;

-- CreateIndex
CREATE INDEX "os_hospedagens_tarifa_id_idx" ON "os_hospedagens"("tarifa_id");

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "fornecedor_tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
