import { Request, Response, NextFunction } from 'express';

// 
// MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS
// Deve ser registrado por ultimo no server.ts — depois de todas as rotas.
// Captura qualquer erro que escapou dos controllers sem tratamento.
// 
export function errorHandler(
  err:  Error,
  req:  Request,
  res:  Response,
  next: NextFunction
) {
  console.error('[ERRO NAO TRATADO]', err);

  return res.status(500).json({
    erro: 'Erro interno do servidor',
  });
}