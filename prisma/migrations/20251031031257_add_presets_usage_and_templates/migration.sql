-- AlterTable
ALTER TABLE "preset_items" ADD COLUMN     "ultimo_uso" TIMESTAMP(3),
ADD COLUMN     "uso_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "preset_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "PresetTipo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "uso_count" INTEGER NOT NULL DEFAULT 0,
    "ultimo_uso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "ordem" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preset_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preset_templates_org_id_idx" ON "preset_templates"("org_id");

-- CreateIndex
CREATE INDEX "preset_templates_tipo_idx" ON "preset_templates"("tipo");

-- CreateIndex
CREATE INDEX "preset_templates_nome_idx" ON "preset_templates"("nome");

-- CreateIndex
CREATE INDEX "preset_templates_uso_count_idx" ON "preset_templates"("uso_count");

-- CreateIndex
CREATE INDEX "preset_template_items_template_id_idx" ON "preset_template_items"("template_id");

-- CreateIndex
CREATE INDEX "preset_template_items_item_id_idx" ON "preset_template_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "preset_template_items_template_id_item_id_key" ON "preset_template_items"("template_id", "item_id");

-- CreateIndex
CREATE INDEX "preset_items_uso_count_idx" ON "preset_items"("uso_count");

-- CreateIndex
CREATE INDEX "preset_items_ultimo_uso_idx" ON "preset_items"("ultimo_uso");

-- AddForeignKey
ALTER TABLE "preset_templates" ADD CONSTRAINT "preset_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "preset_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "preset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
