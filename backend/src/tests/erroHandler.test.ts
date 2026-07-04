import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middlewares/errorHandler';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middlewares.errorHandler', () => {
  it('registra o erro no console e retorna 500 com mensagem genérica', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const erro = new Error('algo quebrou');
    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    errorHandler(erro, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('[ERRO NAO TRATADO]', erro);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});