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
  // Opcional: permite que PUT /categorias/:id tambem alterne o campo
  // ativo (usado pelo botao "Ativo/Inativo" do admin). Antes desse campo
  // existir aqui, o Zod descartava "ativo" do payload silenciosamente —
  // o PUT respondia 200 mas nunca persistia a mudanca.
  ativo: z.boolean().optional(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;