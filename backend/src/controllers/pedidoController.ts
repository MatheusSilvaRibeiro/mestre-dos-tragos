import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';

// Tipos que definem o formato esperado de cada item do pedido
type ItemInput = {
  produtoId:    string;
  quantidade:   number;
  tamanho?:     string;
  adicionais?:  string[];
  sabores?:     string[];
  observacoes?: string;
};

// O que a função de cálculo retorna — preço unitário + dados dos adicionais e sabores
type CalculoRetorno = {
  precoUnit:      number;
  adicionaisData: { adicionalId: string; preco: number }[];
  saboresData:    { nome: string }[];
};

// ─────────────────────────────────────────────────────────
// CALCULAR PREÇO DO ITEM
// Função interna — não é uma rota. Calcula o preço de cada item
// levando em conta o tipo do produto (LANCHE, BATATA_FRITA ou PORCAO_MISTA),
// o tamanho escolhido e os adicionais selecionados.
// ─────────────────────────────────────────────────────────
async function calcularPrecoItem(produto: any, item: ItemInput): Promise<CalculoRetorno> {
  let precoUnit = 0;
  const adicionaisData: { adicionalId: string; preco: number }[] = [];
  const saboresData:    { nome: string }[] = [];

  if (produto.tipo === 'LANCHE') {
    // Lanche tem preço fixo — adicionais somam em cima do preço base
    precoUnit = Number(produto.preco);

    if (item.adicionais?.length) {
      for (const id of item.adicionais) {
        const adicional = await prisma.adicional.findUnique({ where: { id } });
        if (adicional) {
          const preco = Number(adicional.preco);
          precoUnit += preco;
          adicionaisData.push({ adicionalId: id, preco });
        }
      }
    }
  }

  else if (produto.tipo === 'BATATA_FRITA') {
    // Batata frita tem preço por tamanho — P, M ou G
    const produtoTamanho = produto.tamanhos.find((t: any) => t.tamanho === item.tamanho);
    if (!produtoTamanho) throw new Error(`Tamanho ${item.tamanho} não encontrado!`);

    precoUnit = Number(produtoTamanho.preco);

    // Os adicionais da batata também variam por tamanho
    if (item.adicionais?.length) {
      for (const id of item.adicionais) {
        const adicionalTamanho = await prisma.adicionalTamanho.findFirst({
          where: { adicionalId: id, tamanho: item.tamanho as any },
        });
        if (adicionalTamanho) {
          const preco = Number(adicionalTamanho.preco);
          precoUnit += preco;
          adicionaisData.push({ adicionalId: id, preco });
        }
      }
    }
  }

  else if (produto.tipo === 'PORCAO_MISTA') {
    // Porção mista: preço por tamanho multiplicado pela quantidade de sabores
    const produtoTamanho = produto.tamanhos.find((t: any) => t.tamanho === item.tamanho);
    if (!produtoTamanho) throw new Error(`Tamanho ${item.tamanho} não encontrado!`);

    const qtdSabores = item.sabores?.length || 1;
    precoUnit = Number(produtoTamanho.preco) * qtdSabores;

    if (item.sabores?.length) {
      saboresData.push(...item.sabores.map(nome => ({ nome })));
    }
  }

  return { precoUnit, adicionaisData, saboresData };
}

// ─────────────────────────────────────────────────────────
// CRIAR PEDIDO — POST /api/pedidos
// Valida cada item do carrinho, calcula os preços e registra o pedido.
// Depois emite um evento via Socket.IO pra cozinha receber em tempo real.
// ─────────────────────────────────────────────────────────
export async function criar(req: Request, res: Response) {
  try {
    const usuarioId = (req as any).usuario.id;
    const { nomeCliente, itens, observacoes } = req.body;

    // O carrinho não pode estar vazio — sem itens não há pedido
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Pedido precisa ter pelo menos 1 item!' });
    }

    let valorTotal = 0;
    const itensValidados: any[] = [];

    for (const item of itens as ItemInput[]) {
      const produto = await prisma.produto.findUnique({
        where:   { id: item.produtoId },
        include: { tamanhos: true },
      });

      if (!produto) {
        return res.status(400).json({ erro: `Produto não encontrado: ${item.produtoId}` });
      }

      // Não deixa vender produto que está indisponível ou inativo no cardápio
      if (!produto.disponivel || !produto.ativo) {
        return res.status(400).json({ erro: `Produto indisponível ou inativo: ${produto.nome}` });
      }

      // Batata frita e porção mista obrigatoriamente precisam de tamanho
      if ((produto.tipo === 'BATATA_FRITA' || produto.tipo === 'PORCAO_MISTA') && !item.tamanho) {
        return res.status(400).json({ erro: `Tamanho obrigatório para ${produto.nome}! Use: P, M ou G` });
      }

      const { precoUnit, adicionaisData, saboresData } = await calcularPrecoItem(produto, item);

      const quantidade = Number(item.quantidade);
      if (!quantidade || quantidade <= 0) {
        return res.status(400).json({ erro: 'Quantidade inválida!' });
      }

      const subtotal = precoUnit * quantidade;
      valorTotal += subtotal;

      itensValidados.push({
        produtoId:   item.produtoId,
        quantidade,
        precoUnit,
        subtotal,
        tamanho:     item.tamanho     || null,
        observacoes: item.observacoes || null,
        adicionais:  { create: adicionaisData },
        sabores:     { create: saboresData },
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        nomeCliente: nomeCliente || null, // Nome do cliente é opcional
        observacoes: observacoes || null,
        valorTotal,
        status: 'PENDENTE',
        itens: { create: itensValidados },
      },
      include: {
        itens: {
          include: {
            produto:    { select: { id: true, nome: true } },
            adicionais: true,
            sabores:    true,
          },
        },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });

    // Avisa a cozinha em tempo real que um novo pedido chegou
    getIO().emit('pedido:novo', pedido);

    return res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
}

// ─────────────────────────────────────────────────────────
// LISTAR PEDIDOS — GET /api/pedidos
// Aceita filtro por status (ex: ?status=PENDENTE,EM_PREPARO)
// e limita a quantidade de pedidos retornados (padrão: 50)
// ─────────────────────────────────────────────────────────
export async function listar(req: Request, res: Response) {
  try {
    const { status, limit = '50' } = req.query;

    // Se vier status na query, filtra — senão retorna todos
    const whereStatus = status
      ? { status: { in: (status as string).split(',').map(s => s.trim()) as any } }
      : {};

    const pedidos = await prisma.pedido.findMany({
      where:   { ...whereStatus },
      take:    parseInt(limit as string),
      orderBy: { criadoEm: 'asc' },
      include: {
        itens: {
          include: {
            produto:    { select: { id: true, nome: true } },
            adicionais: { include: { adicional: true } },
            sabores:    true,
          },
        },
        usuario: { select: { id: true, nome: true } },
      },
    });

    return res.json({ pedidos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
}

// ─────────────────────────────────────────────────────────
// BUSCAR POR ID — GET /api/pedidos/:id
// Retorna todos os detalhes de um pedido específico
// ─────────────────────────────────────────────────────────
export async function buscarPorId(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: {
          include: {
            produto:    { select: { id: true, nome: true } },
            adicionais: true,
            sabores:    true,
          },
        },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });

    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado!' });

    return res.json(pedido);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao buscar pedido' });
  }
}

// ─────────────────────────────────────────────────────────
// ATUALIZAR STATUS — PATCH /api/pedidos/:id/status
// Controla o fluxo do pedido. Só permite transições válidas
// para evitar inconsistências — ex: não dá pra voltar de PRONTO pra PENDENTE.
// ─────────────────────────────────────────────────────────

// Mapa de transições permitidas — cada status só pode ir para determinados destinos
const transicoesValidas: Record<string, string[]> = {
  PENDENTE:   ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO',     'CANCELADO'],
  PRONTO:     ['ENTREGUE'],
  ENTREGUE:   [], // Pedido entregue é status final — não muda mais
  CANCELADO:  [], // Pedido cancelado também é final
};

export async function atualizarStatus(req: Request, res: Response) {
  try {
    const id       = req.params.id as string;
    const { status } = req.body;

    if (!status) return res.status(400).json({ erro: 'Status é obrigatório!' });

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado!' });

    // Verifica se a transição é permitida antes de atualizar
    const permitidos = transicoesValidas[pedido.status] || [];
    if (!permitidos.includes(status)) {
      return res.status(400).json({
        erro: `Não é possível mudar de ${pedido.status} para ${status}!`,
        transicoesPermitidas: permitidos,
      });
    }

    const atualizado = await prisma.pedido.update({
      where: { id },
      data: {
        status,
        // Registra o horário de entrega quando o pedido é finalizado
        finalizadoEm: status === 'ENTREGUE' ? new Date() : undefined,
      },
    });

    // Notifica todos os painéis conectados sobre a mudança de status
    getIO().emit('pedido:atualizado', atualizado);

    return res.json({ mensagem: 'Status atualizado!', pedido: atualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
}

// ─────────────────────────────────────────────────────────
// CANCELAR PEDIDO — PATCH /api/pedidos/:id/cancelar
// Só é possível cancelar pedidos PENDENTE ou EM_PREPARO.
// Pedido PRONTO ou ENTREGUE não pode ser cancelado.
// ─────────────────────────────────────────────────────────
export async function cancelar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado!' });

    // Não faz sentido cancelar algo que já foi entregue ou que já está pronto
    if (!['PENDENTE', 'EM_PREPARO'].includes(pedido.status)) {
      return res.status(400).json({
        erro: `Não é possível cancelar um pedido com status ${pedido.status}!`,
      });
    }

    const cancelado = await prisma.pedido.update({
      where: { id },
      data:  { status: 'CANCELADO' },
    });

    return res.json({ mensagem: 'Pedido cancelado!', pedido: cancelado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao cancelar pedido' });
  }
}