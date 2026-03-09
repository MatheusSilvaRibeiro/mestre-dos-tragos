import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuario: {
        id:   string;
        role: Role;
      };
    }
  }
}

export {}; 

// isso é necessário para transformar
//  este arquivo em um módulo e evitar
// conflitos de tipos globais com outros arquivos.