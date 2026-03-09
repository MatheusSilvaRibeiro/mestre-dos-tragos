export type Status = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

export interface ItemPedido {
  id:         string;
  produto:    { nome: string };
  quantidade: number;
  tamanho:    string | null;
  adicionais: { adicional: { nome: string } }[];
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
// Centraliza cor e label de cada status — usado no PedidoCard e em badges.
// Apenas PENDENTE, EM_PREPARO e PRONTO aparecem na tela da cozinha.
// 
export const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  PENDENTE:   { label: 'Pendente',   cor: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  EM_PREPARO: { label: 'Em Preparo', cor: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  PRONTO:     { label: 'Pronto',     cor: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
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