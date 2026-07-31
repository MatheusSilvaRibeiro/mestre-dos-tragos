import { z } from 'zod';

// Quantidade aceita number ou string (ex: veio de um form), mas
// precisa resultar em um número > 0 depois de convertida.
const quantidadeSchema = z
  .union([z.number(), z.string()])
  .refine(
    (valor) => {
      const n = Number(valor);
      return !Number.isNaN(n) && n > 0;
    },
    { message: 'Quantidade inválida!' },
  );

export const itemPedidoSchema = z.object({
  produtoId: z.preprocess(
    (valor) => valor ?? '',
    z.string().min(1, 'Produto não informado!'),
  ),
  quantidade: quantidadeSchema,
  // .nullable() alem de .optional(): o frontend manda `null` (nao omite o
  // campo) quando o produto nao tem tamanho/sem adicionais/sem sabores.
  tamanho: z.string().nullable().optional(),
  adicionais: z.array(z.string()).optional(),
  sabores: z.array(z.string()).optional(),
  observacoes: z.string().nullable().optional(),
});

// ─────────────────────────────────────────────────────────
// CRIAR PEDIDO — o carrinho precisa ter ao menos 1 item, e cada
// item precisa ter um produto e uma quantidade válidos. As demais
// regras (produto existe, está disponível, tamanho obrigatório por
// tipo, etc.) dependem do banco e continuam no controller.
// ─────────────────────────────────────────────────────────
export const criarPedidoSchema = z.object({
  // .nullable() alem de .optional(): o frontend manda `null` (nao omite o
  // campo) quando "Nome do cliente" / "Observações" ficam em branco.
  nomeCliente: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  itens: z.array(itemPedidoSchema).min(1, 'Pedido precisa ter pelo menos 1 item!'),
});

// ─────────────────────────────────────────────────────────
// ATUALIZAR STATUS — só garante que o status foi informado.
// A checagem de quais status existem e quais transições são
// válidas continua no controller (depende do enum do Prisma
// e do status atual do pedido no banco).
// ─────────────────────────────────────────────────────────
export const atualizarStatusSchema = z.object({
  status: z.preprocess(
    (valor) => valor ?? '',
    z.string().min(1, 'Status é obrigatório!'),
  ),
});

export type ItemPedidoInput = z.infer<typeof itemPedidoSchema>;
export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;