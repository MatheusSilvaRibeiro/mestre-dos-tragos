import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 
// SCRIPT UTILITÁRIO — Listar todos os usuários
// Rode com: npx ts-node src/scripts/listarUsuarios.ts
// Útil para conferir os usuários cadastrados no banco sem precisar do Insomnia
// 
async function main() {
  const usuarios = await prisma.usuario.findMany({
    // Não expomos a senha — mesmo em scripts locais é boa prática
    select: { id: true, nome: true, usuario: true, role: true },
  });

  console.table(usuarios);
}

main().finally(() => prisma.$disconnect());