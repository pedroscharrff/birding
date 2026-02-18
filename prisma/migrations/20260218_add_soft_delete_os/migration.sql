-- AlterTable: Add soft delete fields to OS table
ALTER TABLE "os" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "os" ADD COLUMN IF NOT EXISTS "deleted_by" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "os_deleted_at_idx" ON "os"("deleted_at");
