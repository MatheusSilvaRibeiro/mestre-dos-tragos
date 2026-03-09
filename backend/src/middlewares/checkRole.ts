import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '@prisma/client';

// 
// MIDDLEWARE DE AUTORIZAÇÃO
// Esse middleware roda logo após o autenticar — ele já sabe quem é o usuário,
// agora verifica se esse usuário tem permissão para acessar aquela rota específica.
// 
// Uso nas rotas: checkRole(['ADMIN', 'ATENDENTE'])
// Se o role do usuário não estiver na lista, barra com 403.
// 
export function checkRole(rolesPermitidas: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;

    // Se por algum motivo o usuário não está na requisição,
    // significa que o autenticar não rodou antes — barra com 401
    if (!usuario) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    // Verifica se o role do usuário logado está na lista de roles permitidas
    const temPermissao = rolesPermitidas.includes(usuario.role as Role);

    // Se não tiver permissão, retorna 403 — autenticado mas sem acesso
    // 401 = não sabe quem é | 403 = sabe quem é, mas não pode entrar
    if (!temPermissao) {
      return res.status(403).json({ erro: 'Você não tem permissão para realizar esta ação!' });
    }

    // Role permitido — libera para o controller
    return next();
  };
}