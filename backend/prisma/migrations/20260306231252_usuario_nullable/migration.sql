-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_usuarioId_fkey";

-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
