import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 
// SCRIPT UTILITÁRIO — Resetar senha do admin
// Rode com: npx ts-node src/scripts/resetSenhaAdmin.ts
// Use quando precisar recuperar acesso sem passar pela API
// 
async function main() {
  // Criptografa a nova senha antes de salvar — nunca salvamos em texto puro
  const senha = await bcrypt.hash('123456', 10);

  await prisma.usuario.update({
    where: { usuario: 'admin' },
    data:  { senha },
  });

  console.log(' Senha do admin atualizada para: 123456');
}

main().finally(() => prisma.$disconnect());