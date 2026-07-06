import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'ATENDENTE', 'COZINHA']);

const baseUsuarioSchema = z.object({
  usuario: z.string().trim().optional(),
  nome: z.string().trim().optional(),
  senha: z.string().optional(),
  role: roleEnum.optional(),
  ativo: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────
// CRIAR — usuario, nome e senha são obrigatórios.
// ─────────────────────────────────────────────────────────
export const criarUsuarioSchema = baseUsuarioSchema.superRefine((data, ctx) => {
  if (!data.usuario || !data.nome || !data.senha) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Campos obrigatórios: usuario, nome, senha',
    });
  }
});

// ─────────────────────────────────────────────────────────
// ATUALIZAR — todos os campos são opcionais (atualização parcial).
// ─────────────────────────────────────────────────────────
export const atualizarUsuarioSchema = baseUsuarioSchema;

export type UsuarioInput = z.infer<typeof baseUsuarioSchema>;
