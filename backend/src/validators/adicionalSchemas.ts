import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Preço por tamanho (P, M, G) — o enum aqui precisa bater com o
// enum "Tamanho" do Prisma, senão o Prisma Client reclama de tipo
// na hora do create/update.
// ─────────────────────────────────────────────────────────
const precoPorTamanhoSchema = z.object({
  tamanho: z.enum(['P', 'M', 'G']),
  preco: z.union([z.number(), z.string()]),
});

const baseAdicionalSchema = z.object({
  nome: z.string().trim().optional(),
  preco: z.union([z.number(), z.string()]).optional(),
  precoPorTamanho: z.array(precoPorTamanhoSchema).optional(),
});

// ─────────────────────────────────────────────────────────
// CRIAR — nome e preco são obrigatórios (preco pode ser 0, então
// checamos "=== undefined" em vez de usar um .min/required simples).
// ─────────────────────────────────────────────────────────
export const criarAdicionalSchema = baseAdicionalSchema.superRefine((data, ctx) => {
  if (!data.nome || data.preco === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Campos obrigatórios: nome, preco',
    });
  }
});

// ─────────────────────────────────────────────────────────
// EDITAR — todos os campos são opcionais (atualização parcial).
// ─────────────────────────────────────────────────────────
export const editarAdicionalSchema = baseAdicionalSchema;

export type AdicionalInput = z.infer<typeof baseAdicionalSchema>;