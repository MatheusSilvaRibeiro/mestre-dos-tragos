import type { Adicional, Produto, Tamanho } from './atendente.types';

// Formata numero para moeda brasileira — R$ 1.250,90
export function moeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// Normaliza categoria — aceita objeto ou string diretamente
export function getNomeCategoria(cat: { id: string; nome: string } | string): string {
  if (typeof cat === 'string') return cat;
  return cat?.nome ?? '';
}

// Retorna o preco do produto para um tamanho especifico
// Se o tamanho nao existir, cai no preco base do produto
export function getPrecoTamanho(produto: Produto, tamanho: Tamanho): number {
  const t = produto.tamanhos.find(x => x.tamanho === tamanho);
  return t ? Number(t.preco) : Number(produto.preco);
}

// Retorna o preco do adicional — por tamanho se disponivel, senao usa o preco base
export function getPrecoAdicional(adicional: Adicional, tamanho?: Tamanho): number {
  if (tamanho && adicional.precoPorTamanho?.length > 0) {
    const t = adicional.precoPorTamanho.find(p => p.tamanho === tamanho);
    if (t) return Number(t.preco);
  }
  return Number(adicional.preco);
}

// Retorna quantos minutos se passaram desde uma data ISO
export function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// Label legivel dos tamanhos — usado no ModalConfig
export const TAMANHO_LABEL: Record<Tamanho, string> = {
  P: 'Pequeno',
  M: 'Medio',
  G: 'Grande',
};

// Gradiente por categoria — usado em cards visuais de categoria
export const GRADIENTE_CAT: Record<string, string> = {
  Lanches:    'linear-gradient(135deg,#f97316,#fbbf24)',
  Bebidas:    'linear-gradient(135deg,#3b82f6,#06b6d4)',
  Porcoes:    'linear-gradient(135deg,#22c55e,#10b981)',
  Sobremesas: 'linear-gradient(135deg,#a855f7,#ec4899)',
};