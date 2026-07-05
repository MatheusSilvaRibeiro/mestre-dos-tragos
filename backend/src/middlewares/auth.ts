import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type Role = 'ADMIN' | 'ATENDENTE' | 'COZINHA';

interface JwtPayload {
  id: string;
  role: Role;
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        erro: 'Token não informado. Faça login!',
      });
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      return res.status(401).json({
        erro: 'Token mal formatado.',
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_padrao'
    ) as JwtPayload;

    req.usuario = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      erro: 'Token inválido ou expirado. Faça login novamente!',
    });
  }
}