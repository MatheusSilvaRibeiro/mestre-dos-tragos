-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('LANCHE', 'BATATA_FRITA', 'PORCAO_MISTA');

-- CreateEnum
CREATE TYPE "Tamanho" AS ENUM ('P', 'M', 'G');

-- AlterTable
ALTER TABLE "itens_pedido" ADD COLUMN     "tamanho" "Tamanho";

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "tipo" "TipoProduto" NOT NULL DEFAULT 'LANCHE';

-- CreateTable
CREATE TABLE "produto_tamanhos" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tamanho" "Tamanho" NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "produto_tamanhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adicionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adicional_tamanhos" (
    "id" TEXT NOT NULL,
    "adicionalId" TEXT NOT NULL,
    "tamanho" "Tamanho" NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "adicional_tamanhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_adicionais" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "adicionalId" TEXT NOT NULL,

    CONSTRAINT "produto_adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_adicionais" (
    "id" TEXT NOT NULL,
    "itemPedidoId" TEXT NOT NULL,
    "adicionalId" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_sabores" (
    "id" TEXT NOT NULL,
    "itemPedidoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "itens_pedido_sabores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produto_tamanhos_produtoId_tamanho_key" ON "produto_tamanhos"("produtoId", "tamanho");

-- CreateIndex
CREATE UNIQUE INDEX "adicional_tamanhos_adicionalId_tamanho_key" ON "adicional_tamanhos"("adicionalId", "tamanho");

-- CreateIndex
CREATE UNIQUE INDEX "produto_adicionais_produtoId_adicionalId_key" ON "produto_adicionais"("produtoId", "adicionalId");

-- AddForeignKey
ALTER TABLE "produto_tamanhos" ADD CONSTRAINT "produto_tamanhos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adicional_tamanhos" ADD CONSTRAINT "adicional_tamanhos_adicionalId_fkey" FOREIGN KEY ("adicionalId") REFERENCES "adicionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_adicionais" ADD CONSTRAINT "produto_adicionais_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_adicionais" ADD CONSTRAINT "produto_adicionais_adicionalId_fkey" FOREIGN KEY ("adicionalId") REFERENCES "adicionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_adicionais" ADD CONSTRAINT "itens_pedido_adicionais_itemPedidoId_fkey" FOREIGN KEY ("itemPedidoId") REFERENCES "itens_pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_adicionais" ADD CONSTRAINT "itens_pedido_adicionais_adicionalId_fkey" FOREIGN KEY ("adicionalId") REFERENCES "adicionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_sabores" ADD CONSTRAINT "itens_pedido_sabores_itemPedidoId_fkey" FOREIGN KEY ("itemPedidoId") REFERENCES "itens_pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
