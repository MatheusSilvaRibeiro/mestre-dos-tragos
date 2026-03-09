import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Produto, ItemCarrinho } from './atendente.types';
import { MOCK_PRODUTOS } from './atendente.mock';
import { getNomeCategoria } from './atendente.helpers';

// 
// HOOK PRINCIPAL DA TELA DE ATENDENTE
// Centraliza todo o estado e logica da tela:
//   - carregamento de produtos
//   - gerenciamento do carrinho
//   - filtragem por categoria e busca
//   - envio do pedido para a API
// O parametro "busca" vem do componente pai — permite filtrar sem estado interno duplicado.
// 
export function useAtendente(busca: string = '') {
  const [produtos,    setProdutos]    = useState<Produto[]>([]);
  const [carrinho,    setCarrinho]    = useState<ItemCarrinho[]>([]);
  const [categoria,   setCategoria]   = useState('Todos');
  const [nomeCliente, setNomeCliente] = useState('');
  const [obs,         setObs]         = useState('');
  const [loading,     setLoading]     = useState(true);
  const [enviando,    setEnviando]    = useState(false);
  const [sucesso,     setSucesso]     = useState(false);
  const [modalProd,   setModalProd]   = useState<Produto | null>(null);

  // Carrega produtos da API — usa mock em caso de erro (modo offline/dev)
  useEffect(() => {
    api.get('/produtos')
      .then(res => setProdutos(res.data))
      .catch(() => setProdutos(MOCK_PRODUTOS))
      .finally(() => setLoading(false));
  }, []);

  // Adiciona item configurado ao carrinho e fecha o modal de configuracao
  function adicionarItem(item: ItemCarrinho) {
    setCarrinho(prev => [...prev, item]);
    setModalProd(null);
  }

  // Incrementa ou decrementa quantidade — remove o item se chegar a 0
  function alterarQtd(index: number, delta: number) {
    setCarrinho((prev: ItemCarrinho[]) => {
      const nova = [...prev];
      nova[index] = { ...nova[index], quantidade: nova[index].quantidade + delta };
      if (nova[index].quantidade <= 0) nova.splice(index, 1);
      return nova;
    });
  }

  function removerItem(index: number) {
    setCarrinho(prev => prev.filter((_, i) => i !== index));
  }

  // Soma as quantidades de todas as ocorrencias do produto no carrinho
  function qtdNoCarrinho(id: string): number {
    return carrinho
      .filter(i => i.produto.id === id)
      .reduce((acc, i) => acc + i.quantidade, 0);
  }

  // 
  // ENVIO DO PEDIDO
  // Monta o payload esperado pela API e envia.
  // Apos sucesso, limpa o carrinho e exibe feedback por 4 segundos.
  // 
  async function enviarPedido() {
    if (carrinho.length === 0) return;
    setEnviando(true);
    try {
      await api.post('/pedidos', {
        nomeCliente: nomeCliente.trim() || null,
        observacoes: obs.trim()         || null,
        itens: carrinho.map(i => ({
          produtoId:  i.produto.id,
          quantidade: i.quantidade,
          tamanho:    i.tamanho    || null,
          adicionais: i.adicionais.map(a => a.adicional.id), // apenas os IDs
          sabores:    i.sabores    || [],
        })),
      });
      setCarrinho([]);
      setNomeCliente('');
      setObs('');
      setSucesso(true);
      setTimeout(() => setSucesso(false), 4000);
    } catch {
      alert('Erro ao enviar pedido.');
    } finally {
      setEnviando(false);
    }
  }

  // Extrai categorias unicas dos produtos — "Todos" sempre primeiro
  const categorias = [
    'Todos',
    ...Array.from(new Set(produtos.map(p => getNomeCategoria(p.categoria)))),
  ];

  // Filtra por categoria ativa e pelo texto de busca simultaneamente
  const filtrados = produtos.filter(p => {
    const cat = getNomeCategoria(p.categoria);
    return (categoria === 'Todos' || cat === categoria)
        && p.nome.toLowerCase().includes(busca.toLowerCase());
  });

  const total      = carrinho.reduce((acc, i) => acc + i.precoUnit * i.quantidade, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  return {
    carrinho, categoria, nomeCliente, obs,
    loading, enviando, sucesso, modalProd,
    categorias, filtrados, total, totalItens,
    setCategoria, setNomeCliente, setObs,
    setModalProd, setCarrinho,
    adicionarItem, alterarQtd, removerItem,
    qtdNoCarrinho, enviarPedido,
  };
}