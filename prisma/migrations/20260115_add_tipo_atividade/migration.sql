-- CreateEnum
CREATE TYPE "TipoAtividade" AS ENUM ('atividade', 'alimentacao');

-- AlterTable
ALTER TABLE "os_atividades" ADD COLUMN "tipo" "TipoAtividade" NOT NULL DEFAULT 'atividade';

-- CreateIndex
CREATE INDEX "os_atividades_tipo_idx" ON "os_atividades"("tipo");

-- CreateIndex
CREATE INDEX "os_atividades_os_id_tipo_idx" ON "os_atividades"("os_id", "tipo");
