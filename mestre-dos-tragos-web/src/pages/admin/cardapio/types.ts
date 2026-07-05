export interface Categoria {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Tamanho {
  id: string;
  nome: string;
  tamanho: string;
  preco: number;
}

export interface Adicional {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
}

export interface AdicionaisProduto {
  adicional: Adicional;
}

export type TipoProduto = 'LANCHE' | 'BATATA_FRITA' | 'PORCAO_MISTA';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  emoji: string | null;
  preco: number;
  ativo: boolean;
  disponivel: boolean;
  tipo: TipoProduto;
  categoriaId: string;
  categoria: Categoria;
  tamanhos: Tamanho[];
  adicionais: Adicional[];
  adicionaisProduto: AdicionaisProduto[];
}

export interface ProdutoPayload {
  nome: string;
  descricao: string | null;
  emoji: string | null;
  preco: number;
  categoriaId: string;
  disponivel: boolean;
  tipo: TipoProduto;
  tamanhos: {
    tamanho: string;
    preco: number;
  }[];
  adicionaisIds: string[];
}

export type Aba = 'produtos' | 'categorias' | 'adicionais';

export type TamanhoForm = {
  tamanho: string;
  preco: string;
};

export function moeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);
}