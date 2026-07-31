-- CreateEnum
CREATE TYPE "GrupoPrecoAdicional" AS ENUM ('LANCHES', 'PORCOES');

-- AlterTable
ALTER TABLE "adicionais" ADD COLUMN     "grupoPreco" "GrupoPrecoAdicional";
