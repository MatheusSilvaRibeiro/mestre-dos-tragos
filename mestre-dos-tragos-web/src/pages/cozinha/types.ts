export type Status = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

export interface ItemPedido {
  id:         string;
  produto:    { nome: string };
  quantidade: number;
  tamanho:    string | null;
  precoUnit:  number;
  subtotal:   number;
  observacoes: string | null;
  adicionais: { preco: number; adicional: { nome: string } }[];
  sabores:    { nome: string }[];
}

export interface Pedido {
  id:           string;
  nomeCliente:  string | null;
  status:       Status;
  observacoes:  string | null;
  valorTotal:   number;
  criadoEm:     string; // ISO string — formatar antes de exibir
  itens:        ItemPedido[];
}

//
// STATUS_CONFIG
// Centraliza o label de cada status — usado no PedidoCard. A cor do
// badge vem das classes compartilhadas do design system (.badge-brand,
// .badge-info), não daqui, pra não duplicar os tokens de cor.
// Apenas PENDENTE, EM_PREPARO e PRONTO aparecem na tela da cozinha.
//
export const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDENTE:   { label: 'Pendente' },
  EM_PREPARO: { label: 'Em Preparo' },
  PRONTO:     { label: 'Pronto' },
};

// Tempo decorrido formatado — segundos, minutos ou horas
// Usado em contextos fora do PedidoCard (que tem sua propria funcao simplificada)
export function tempoDecorrido(criadoEm: string): string {
  const diff = Math.floor((Date.now() - new Date(criadoEm).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

// Formata numero para moeda brasileira — R$ 1.250,90
export function moeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
