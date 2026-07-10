/**
 * check-e2e-prefixes.ts
 * -----------------------------------------------------------------------
 * Script de conferencia RAPIDA, SOMENTE LEITURA. Nao apaga nada.
 * Lista tudo que bateria com os prefixos usados pelos testes E2E, pra
 * você confirmar visualmente que nao tem dado real de cliente misturado
 * antes da gente escrever o script de limpeza de verdade.
 *
 * Como rodar (dentro da pasta backend/):
 *   npx tsx scripts/check-e2e-prefixes.ts
 * -----------------------------------------------------------------------
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREFIXOS = {
  categoria: 'Categoria E2E',
  produto: 'Produto E2E',
  adicional: 'Adicional E2E',
};

async function main() {
  console.log('=== CATEGORIAS que batem com o prefixo ===\n');
  const categorias = await prisma.categoria.findMany({
    where: { nome: { startsWith: PREFIXOS.categoria } },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  categorias.forEach((c) => console.log(`  [${c.id}] "${c.nome}" ativo=${c.ativo}`));
  console.log(`\nTotal categorias: ${categorias.length}\n`);

  console.log('=== PRODUTOS que batem com o prefixo (inclui "Produto E2E" e "Batata E2E") ===\n');
  const produtos = await prisma.produto.findMany({
    where: {
      OR: [
        { nome: { startsWith: PREFIXOS.produto } },
        { nome: { startsWith: 'Batata E2E' } },
      ],
    },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  produtos.forEach((p) => console.log(`  [${p.id}] "${p.nome}" ativo=${p.ativo}`));
  console.log(`\nTotal produtos: ${produtos.length}\n`);

  console.log('=== ADICIONAIS que batem com o prefixo ===\n');
  const adicionais = await prisma.adicional.findMany({
    where: { nome: { startsWith: PREFIXOS.adicional } },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  adicionais.forEach((a) => console.log(`  [${a.id}] "${a.nome}" ativo=${a.ativo}`));
  console.log(`\nTotal adicionais: ${adicionais.length}\n`);

  console.log('=== RESUMO ===');
  console.log(`Categorias: ${categorias.length} | Produtos: ${produtos.length} | Adicionais: ${adicionais.length}`);
  console.log('\nConfira essa lista com atencao: se QUALQUER item aqui for um dado');
  console.log('real de cliente (nao criado pelos testes E2E), PARE e me avise antes');
  console.log('de seguirmos para o script de limpeza de verdade.');
}

main()
  .catch((err) => {
    console.error('Erro ao consultar o banco:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });