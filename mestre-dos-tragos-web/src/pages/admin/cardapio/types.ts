// 
// TIPOS COMPARTILHADOS DO MODULO CARDAPIO
// Usados pelo Cardapio.tsx, ProdutoModal.tsx e qualquer outro componente do modulo.
// Centralizar aqui evita duplicacao e garante consistencia entre os arquivos.
// 

export interface Categoria {
  id:    string;
  nome:  string;
  ativo: boolean;
}

export interface Tamanho {
  id:      string;
  nome:    string;
  tamanho: string; // ex: 'P', 'M', 'G'
  preco:   number;
}

export interface Adicional {
  id:    string;
  nome:  string;
  preco: number;
  ativo: boolean;
}

// Relacao intermediaria entre produto e adicional — formato retornado pela API
export interface AdicionaisProduto {
  adicional: Adicional;
}

export interface Produto {
  id:                string;
  nome:              string;
  descricao:         string | null;
  emoji:             string | null;
  preco:             number;
  ativo:             boolean;   // visivel no sistema (admin)
  disponivel:        boolean;   // visivel no cardapio do atendente
  tipo:              'LANCHE' | 'BATATA_FRITA' | 'PORCAO_MISTA';
  categoriaId:       string;
  categoria:         Categoria;
  tamanhos:          Tamanho[];
  adicionais:        Adicional[];
  adicionaisProduto: AdicionaisProduto[]; // formato alternativo retornado em alguns endpoints
}

// Controla qual aba esta ativa na pagina de Cardapio
export type Aba = 'produtos' | 'categorias' | 'adicionais';

// Formato interno do formulario de tamanho — preco como string para compatibilidade com input number
export type TamanhoForm = { tamanho: string; preco: string };

// 
// UTILITARIO DE MOEDA
// Formata qualquer numero para o padrao brasileiro (R$ 1.250,90).
// Usar em todo lugar que exibir preco — nunca formatar na mao.
// 
export function moeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(v);
}