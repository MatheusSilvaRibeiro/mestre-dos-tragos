// Importa o PrismaClient (gerado pelo Prisma)
import { PrismaClient } from '@prisma/client';

// Cria UMA instância do Prisma
// Toda a aplicação vai usar esta mesma instância
const prisma = new PrismaClient();

// Exporta para usar em qualquer arquivo
export default prisma;