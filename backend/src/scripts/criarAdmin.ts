import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 
// SCRIPT DE SEED — Criar ou restaurar usuário ADMIN
// Rode com: npx ts-node src/scripts/seedAdmin.ts
// 
// Usa upsert — se o usuário já existe atualiza, se não existe cria.
// Isso evita erro de duplicidade ao rodar o script mais de uma vez.
// 
async function main() {
  const senha = await bcrypt.hash('admin123', 10);

  const user = await prisma.usuario.upsert({
    where:  { usuario: 'elvis' },
    // Se já existe: atualiza a senha, role e status ativo
    update: { senha, role: 'ADMIN', ativo: true },
    // Se não existe: cria do zero com todos os campos
    create: {
      usuario: 'elvis',
      nome:    'Elvis',
      senha,
      role:    'ADMIN',
      ativo:   true,
    },
  });

  console.log(' Usuário criado/atualizado com sucesso!');
  console.log(' Usuário:', user.usuario);
  console.log(' Role:   ', user.role);
  console.log(' Senha:   admin123');

  await prisma.$disconnect();
}

main().catch(console.error);