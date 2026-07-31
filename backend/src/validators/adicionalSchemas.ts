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
  // Opcional: permite que PUT /adicionais/:id tambem alterne o campo
  // ativo (usado pelo botao "Ativo/Inativo" do admin). Antes desse campo
  // existir aqui, o Zod descartava "ativo" do payload silenciosamente —
  // o PUT respondia 200 mas nunca persistia a mudanca.
  ativo: z.boolean().optional(),
  // Grupo de preco (LANCHES usa preco fixo, PORCOES usa preco por
  // tamanho) — controla em quais tipos de produto o adicional pode
  // ser vinculado. Opcional aqui pra permitir editar so esse campo
  // via PUT em adicionais antigos, sem exigir os outros campos.
  grupoPreco: z.enum(['LANCHES', 'PORCOES']).optional(),
});

// ─────────────────────────────────────────────────────────
// CRIAR — nome, preco e grupoPreco são obrigatórios (preco pode ser 0,
// então checamos "=== undefined" em vez de usar um .min/required simples).
// ─────────────────────────────────────────────────────────
export const criarAdicionalSchema = baseAdicionalSchema.superRefine((data, ctx) => {
  if (!data.nome || data.preco === undefined || !data.grupoPreco) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Campos obrigatórios: nome, preco, grupoPreco',
    });
  }
});

// ─────────────────────────────────────────────────────────
// EDITAR — todos os campos são opcionais (atualização parcial).
// ─────────────────────────────────────────────────────────
export const editarAdicionalSchema = baseAdicionalSchema;

export type AdicionalInput = z.infer<typeof baseAdicionalSchema>;