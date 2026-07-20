/**
 * seed-usuarios-teste.ts
 * -----------------------------------------------------------------------
 * Cria os 3 usuarios de teste (ADMIN/ATENDENTE/COZINHA) usados pela suite
 * E2E, com as mesmas credenciais ja esperadas por
 * mestre-dos-tragos-web/e2e/helpers/testData.ts (via env E2E_*).
 *
 * SEGURANCA: so cria se o usuario ainda nao existir (idempotente). Nao
 * apaga nem sobrescreve nada. Pensado pra rodar contra um banco de
 * dev/teste dedicado — nunca contra o banco de producao.
 *
 * Como rodar (dentro da pasta backend/):
 *   npx tsx src/scripts/seed-usuarios-teste.ts
 * -----------------------------------------------------------------------
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USUARIOS = [
  { usuario: 'tz', nome: 'Admin Teste', senha: '123456', role: 'ADMIN' as Role },
  { usuario: 'atendente', nome: 'Atendente Teste', senha: 'atendente', role: 'ATENDENTE' as Role },
  { usuario: 'cozinha', nome: 'Cozinha Teste', senha: 'cozinha', role: 'COZINHA' as Role },
];

async function main() {
  for (const dados of USUARIOS) {
    const existe = await prisma.usuario.findUnique({ where: { usuario: dados.usuario } });
    if (existe) {
      console.log(`  [ja existe] ${dados.usuario} (${dados.role})`);
      continue;
    }

    const senhaCriptografada = await bcrypt.hash(dados.senha, 10);
    await prisma.usuario.create({
      data: {
        usuario: dados.usuario,
        nome: dados.nome,
        senha: senhaCriptografada,
        role: dados.role,
      },
    });
    console.log(`  [criado] ${dados.usuario} (${dados.role})`);
  }
}

main()
  .catch((err) => {
    console.error('Erro ao criar usuarios de teste:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
