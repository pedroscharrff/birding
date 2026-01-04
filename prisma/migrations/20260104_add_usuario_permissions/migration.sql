-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "permissoes" JSONB,
ADD COLUMN "departamento" TEXT,
ADD COLUMN "cargo" TEXT,
ADD COLUMN "supervisor_id" TEXT,
ADD COLUMN "avatar" TEXT,
ADD COLUMN "ultimo_acesso" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "usuarios_ativo_idx" ON "usuarios"("ativo");

-- CreateIndex
CREATE INDEX "usuarios_supervisor_id_idx" ON "usuarios"("supervisor_id");

-- CreateIndex
CREATE INDEX "usuarios_departamento_idx" ON "usuarios"("departamento");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
