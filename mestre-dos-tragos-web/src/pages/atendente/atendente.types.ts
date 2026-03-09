export type TipoProduto = 'LANCHE' | 'BATATA_FRITA' | 'PORCAO_MISTA';
export type Tamanho     = 'P' | 'M' | 'G';

// Preco do adicional por tamanho — permite cobrar valores diferentes para P, M e G
export interface AdicionalTamanho {
  tamanho: Tamanho;
  preco:   number;
}

export interface Adicional {
  id:              string;
  nome:            string;
  preco:           number;  // preco base — usado quando nao ha precoPorTamanho
  ativo:           boolean;
  precoPorTamanho: AdicionalTamanho[]; // opcional — substitui preco base por tamanho
}

export interface ProdutoAdicional {
  adicional: Adicional;
}

export interface ProdutoTamanho {
  tamanho: Tamanho;
  preco:   number;
}

export interface Produto {
  id:                string;
  nome:              string;
  descricao:         string | null;
  preco:             number;           // preco base — usado para LANCHE ou como fallback
  tipo:              TipoProduto;
  disponivel:        boolean;          // visivel no cardapio do atendente
  ativo:             boolean;          // visivel no sistema admin
  emoji?:            string;
  categoria:         { id: string; nome: string };
  tamanhos:          ProdutoTamanho[];  // vazio para LANCHE, obrigatorio para BATATA_FRITA e PORCAO_MISTA
  adicionaisProduto: ProdutoAdicional[];
}

// Representa um item dentro do carrinho — inclui todas as configuracoes feitas no ModalConfig
export interface ItemCarrinho {
  produto:    Produto;
  quantidade: number;
  tamanho?:   Tamanho;
  adicionais: { adicional: Adicional; preco: number }[];
  sabores:    string[];  // exclusivo de PORCAO_MISTA
  precoUnit:  number;    // preco unitario ja calculado (base + adicionais + extras de sabor)
}

export interface PedidoCozinha {
  id:           string;
  numeroPedido: number;
  nomeCliente?: string;
  status:       'PENDENTE' | 'EM_PREPARO' | 'PRONTO';
  criadoEm:     string;
}