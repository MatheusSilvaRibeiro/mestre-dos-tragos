import { z } from 'zod';
import type { Tamanho, TipoProduto } from '@prisma/client';

export const TIPOS_VALIDOS: TipoProduto[] = ['LANCHE', 'BATATA_FRITA', 'PORCAO_MISTA'];
export const TAMANHOS_VALIDOS: Tamanho[] = ['P', 'M', 'G'];

// Number(preco) não distingue "veio inválido" de "é zero" — isso resolve
export function parsePreco(valor: number | string | undefined): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

// "tamanho" fica como string solto (não z.enum) de propósito: assim quem
// mandar um valor inválido cai na nossa mensagem customizada no superRefine,
// em vez da mensagem genérica do zod. O controller faz o cast pra Tamanho
// depois que a validação já garantiu que o valor é um dos válidos.
const tamanhoPayloadSchema = z.object({
  tamanho: z.string(),
  preco: z.union([z.number(), z.string()]),
});

const baseProdutoSchema = z.object({
  nome: z.string().trim().optional(),
  descricao: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  preco: z.union([z.number(), z.string()]).optional(),
  categoriaId: z.string().optional(),
  disponivel: z.boolean().optional(),
  tipo: z.string().optional(),
  tamanhos: z.array(tamanhoPayloadSchema).optional(),
  adicionaisIds: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────
// CRIAR — replica as regras condicionais que existiam no controller:
// campos obrigatórios, tipo válido e, dependendo do tipo, preço
// (LANCHE) ou tamanhos com preços (BATATA_FRITA/PORCAO_MISTA).
// ─────────────────────────────────────────────────────────
export const criarProdutoSchema = baseProdutoSchema.superRefine((data, ctx) => {
  if (!data.nome || !data.categoriaId || !data.tipo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Campos obrigatórios: nome, categoriaId, tipo',
    });
    return;
  }

  if (!TIPOS_VALIDOS.includes(data.tipo as TipoProduto)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}`,
    });
    return;
  }

  if (data.tipo === 'LANCHE') {
    if (parsePreco(data.preco) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'LANCHE precisa de um preço válido (número >= 0)!',
      });
      return;
    }
  }

  if (data.tipo === 'BATATA_FRITA' || data.tipo === 'PORCAO_MISTA') {
    if (!data.tamanhos || data.tamanhos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.tipo} precisa de tamanhos (P, M, G) com preços!`,
      });
      return;
    }

    for (const t of data.tamanhos) {
      if (!TAMANHOS_VALIDOS.includes(t.tamanho as Tamanho)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tamanho inválido: ${t.tamanho}. Use P, M ou G.`,
        });
        return;
      }
      if (parsePreco(t.preco) === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Preço inválido para o tamanho ${t.tamanho}`,
        });
        return;
      }
    }
  }
});

// ─────────────────────────────────────────────────────────
// EDITAR — atualização parcial. Só valida preço e tamanhos
// se eles vierem no body.
// ─────────────────────────────────────────────────────────
export const editarProdutoSchema = baseProdutoSchema.superRefine((data, ctx) => {
  if (data.preco !== undefined && parsePreco(data.preco) === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Preço inválido!',
    });
    return;
  }

  if (data.tamanhos) {
    for (const t of data.tamanhos) {
      if (!TAMANHOS_VALIDOS.includes(t.tamanho as Tamanho)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tamanho inválido: ${t.tamanho}. Use P, M ou G.`,
        });
        return;
      }
      if (parsePreco(t.preco) === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Preço inválido para o tamanho ${t.tamanho}`,
        });
        return;
      }
    }
  }
});

export type ProdutoInput = z.infer<typeof baseProdutoSchema>;