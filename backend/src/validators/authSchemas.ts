import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, 'Usuário é obrigatório'),

  senha: z
    .string()
    .trim()
    .min(1, 'Senha é obrigatória'),
});

export const cadastrarFuncionarioSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(3, 'Usuário deve possuir pelo menos 3 caracteres'),

  nome: z
    .string()
    .trim()
    .min(3, 'Nome deve possuir pelo menos 3 caracteres'),

  senha: z
    .string()
    .min(6, 'Senha deve possuir pelo menos 6 caracteres'),

  role: z
    .enum(['ADMIN', 'ATENDENTE', 'COZINHA'])
    .optional(),
});

export const editarFuncionarioSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(3)
    .optional(),

  nome: z
    .string()
    .trim()
    .min(3)
    .optional(),

  senha: z
    .string()
    .min(6)
    .optional(),

  role: z
    .enum(['ADMIN', 'ATENDENTE', 'COZINHA'])
    .optional(),

  ativo: z
    .boolean()
    .optional(),
});