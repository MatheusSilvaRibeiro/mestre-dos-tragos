export interface Categoria {
  id:    string;
  nome:  string;
  ativo: boolean;
}

export interface Tamanho {
  id:    string;
  nome:  string;
  preco: number;
}

export interface Adicional {
  id:    string;
  nome:  string;
  preco: number;
  ativo: boolean;
}

export interface Produto {
  id:          string;
  nome:        string;
  descricao:   string | null;
  preco:       number;
  ativo:       boolean;
  categoria:   Categoria;
  categoriaId: string;
  tamanhos:    Tamanho[];   // quando vazio, produto tem preco unico
  adicionais:  Adicional[]; // itens opcionais que o cliente pode acrescentar
}

// Controla qual aba esta ativa na tela do atendente
export type Aba = 'produtos' | 'categorias' | 'adicionais';

// Formata numero para moeda brasileira — R$ 1.250,90
export function moeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}