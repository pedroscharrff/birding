-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('criar', 'atualizar', 'excluir', 'visualizar', 'exportar', 'status_alterado');

-- CreateEnum
CREATE TYPE "EntidadeAuditoria" AS ENUM ('os', 'participante', 'fornecedor_os', 'atividade', 'hospedagem', 'transporte', 'passagem_aerea', 'guia_designacao', 'motorista_designacao', 'scouting', 'lancamento_financeiro', 'anotacao');

-- CreateTable
CREATE TABLE "auditoria_os" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "usuario_nome" TEXT NOT NULL,
    "usuario_role" "RoleGlobal" NOT NULL,
    "acao" "AcaoAuditoria" NOT NULL,
    "entidade" "EntidadeAuditoria" NOT NULL,
    "entidade_id" TEXT,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "campos" TEXT[],
    "descricao" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_os_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_os_org_id_idx" ON "auditoria_os"("org_id");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_idx" ON "auditoria_os"("os_id");

-- CreateIndex
CREATE INDEX "auditoria_os_usuario_id_idx" ON "auditoria_os"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_os_acao_idx" ON "auditoria_os"("acao");

-- CreateIndex
CREATE INDEX "auditoria_os_entidade_idx" ON "auditoria_os"("entidade");

-- CreateIndex
CREATE INDEX "auditoria_os_entidade_id_idx" ON "auditoria_os"("entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_os_created_at_idx" ON "auditoria_os"("created_at");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_created_at_idx" ON "auditoria_os"("os_id", "created_at");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_entidade_idx" ON "auditoria_os"("os_id", "entidade");

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
