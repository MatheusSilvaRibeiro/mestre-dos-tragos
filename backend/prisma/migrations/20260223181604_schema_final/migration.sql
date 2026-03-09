/*
  Warnings:

  - You are about to drop the column `estoque` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `estoqueMin` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuario]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuario` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "usuarios_email_key";

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "finalizadoEm" TIMESTAMP(3),
ADD COLUMN     "nomeCliente" TEXT;

-- AlterTable
ALTER TABLE "produtos" DROP COLUMN "estoque",
DROP COLUMN "estoqueMin",
ADD COLUMN     "disponivel" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "email",
ADD COLUMN     "usuario" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");
