import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Schema usado tanto para criar quanto para editar uma categoria.
// A única regra de negócio hoje é: nome é obrigatório.
// O preprocess normaliza undefined/null para string vazia, assim o
// tipo final de "nome" é sempre `string` (nunca `string | undefined`),
// o que evita ficar fazendo type-cast no controller.
// ─────────────────────────────────────────────────────────
export const categoriaSchema = z.object({
  nome: z.preprocess(
    (valor) => (typeof valor === 'string' ? valor.trim() : (valor ?? '')),
    z.string().min(1, 'Nome é obrigatório!'),
  ),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
