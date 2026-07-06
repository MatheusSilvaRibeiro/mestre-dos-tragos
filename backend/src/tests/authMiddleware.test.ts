import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { autenticar } from '../middlewares/auth';

jest.mock('jsonwebtoken');

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middleware autenticar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 quando token não é informado', () => {
    const req = { headers: {} } as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Token não informado. Faça login!',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 quando token está mal formatado', () => {
    const req = {
      headers: { authorization: 'Bearer' },
    } as Request;

    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Token mal formatado.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('adiciona usuario na request e chama next quando token é válido', () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    const req = {
      headers: { authorization: 'Bearer token-valido' },
    } as Request;

    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    autenticar(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      'token-valido',
      process.env.JWT_SECRET || 'secret_padrao'
    );

    expect(req.usuario).toEqual({
      id: 'user-1',
      role: 'ADMIN',
    });

    expect(next).toHaveBeenCalled();
  });

  it('retorna 401 quando token é inválido ou expirado', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token inválido');
    });

    const req = {
      headers: { authorization: 'Bearer token-invalido' },
    } as Request;

    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Token inválido ou expirado. Faça login novamente!',
    });
    expect(next).not.toHaveBeenCalled();
  });
});