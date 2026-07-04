import { Request, Response, NextFunction } from 'express';
import { checkRole } from '../middlewares/checkRole';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middlewares.checkRole', () => {
  it('retorna 401 quando não há usuário autenticado', () => {
    const middleware = checkRole(['ADMIN']);

    const req = {} as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Não autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o usuário não tem o role permitido', () => {
    const middleware = checkRole(['ADMIN']);

    const req = { usuario: { id: 'user-1', role: 'ATENDENTE' } } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Você não tem permissão para realizar esta ação!',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next() quando o usuário tem um dos roles permitidos', () => {
    const middleware = checkRole(['ADMIN', 'ATENDENTE']);

    const req = { usuario: { id: 'user-1', role: 'ATENDENTE' } } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});