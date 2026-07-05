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
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        erro: 'Não autenticado',
      });
    }

    const temPermissao = rolesPermitidas.includes(usuario.role);

    if (!temPermissao) {
      return res.status(403).json({
        erro: 'Você não tem permissão para realizar esta ação!',
      });
    }

    return next();
  };
}