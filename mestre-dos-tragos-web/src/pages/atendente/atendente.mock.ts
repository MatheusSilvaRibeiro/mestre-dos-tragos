import type { Produto } from './atendente.types';

// 
// MOCK DE PRODUTOS
// Usado como fallback quando a API nao responde — evita tela em branco em dev.
// Cobre os 3 tipos de produto: LANCHE (preco fixo), BATATA_FRITA (por tamanho) e LANCHE simples.
// 
export const MOCK_PRODUTOS: Produto[] = [
  {
    id:                '1',
    nome:              'X-Bacon',
    descricao:         null,
    preco:             25,
    tipo:              'LANCHE',
    disponivel:        true,
    ativo:             true,
    emoji:             '🍔',
    categoria:         { id: 'c1', nome: 'Lanches' },
    tamanhos:          [],
    adicionaisProduto: [],
  },
  {
    id:                '2',
    nome:              'Batata Frita',
    descricao:         null,
    preco:             0,
    tipo:              'BATATA_FRITA',
    disponivel:        true,
    ativo:             true,
    emoji:             '🍟',
    categoria:         { id: 'c2', nome: 'Porcoes' },
    tamanhos:          [
      { tamanho: 'P', preco: 12 },
      { tamanho: 'M', preco: 18 },
      { tamanho: 'G', preco: 25 },
    ],
    adicionaisProduto: [],
  },
  {
    id:                '3',
    nome:              'Coca-Cola',
    descricao:         null,
    preco:             8,
    tipo:              'LANCHE',
    disponivel:        true,
    ativo:             true,
    emoji:             '🥤',
    categoria:         { id: 'c3', nome: 'Bebidas' },
    tamanhos:          [],
    adicionaisProduto: [],
  },
];