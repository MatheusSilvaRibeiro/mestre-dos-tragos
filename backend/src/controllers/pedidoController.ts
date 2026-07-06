import { Request, Response } from 'express';
import { Prisma, Tamanho, StatusPedido } from '@prisma/client';
import { ZodError } from 'zod';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';
import { criarPedidoSchema, atualizarStatusSchema } from '../validators/pedidoSchemas';

// Tipos que definem o formato esperado de cada item do pedido
type ItemInput = {
  produtoId:    string;
  quantidade:   number | string;
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

// Produto com os tamanhos incluídos — é o shape retornado pela query em `criar`
type ProdutoComTamanhos = Prisma.ProdutoGetPayload<{ include: { tamanhos: true } }>;

// Formato de cada item já validado, pronto pra entrar no `create` do pedido
type ItemValidado = Prisma.ItemPedidoCreateWithoutPedidoInput;

async function calcularPrecoItem(produto: ProdutoComTamanhos, item: ItemInput): Promise<CalculoRetorno> {
  let precoUnit = 0;
  const adicionaisData: { adicionalId: string; preco: number }[] = [];
  const saboresData:    { nome: string }[] = [];

  if (produto.tipo === 'LANCHE') {
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
    if (!item.tamanho) throw new Error('Tamanho não informado!');

    const produtoTamanho = produto.tamanhos.find((t) => t.tamanho === item.tamanho);
    if (!produtoTamanho) throw new Error(`Tamanho ${item.tamanho} não encontrado!`);

    precoUnit = Number(produtoTamanho.preco);

    if (item.adicionais?.length) {
      for (const id of item.adicionais) {
        const adicionalTamanho = await prisma.adicionalTamanho.findFirst({
          where: { adicionalId: id, tamanho: item.tamanho as Tamanho },
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
    if (!item.tamanho) throw new Error('Tamanho não informado!');

    const produtoTamanho = produto.tamanhos.find((t) => t.tamanho === item.tamanho);
    if (!produtoTamanho) throw new Error(`Tamanho ${item.tamanho} não encontrado!`);

    const qtdSabores = item.sabores?.length || 1;
    precoUnit = Number(produtoTamanho.preco) * qtdSabores;

    if (item.sabores?.length) {
      saboresData.push(...item.sabores.map(nome => ({ nome })));
    }
  }

  return { precoUnit, adicionaisData, saboresData };
}

export async function criar(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario.id;
    const { nomeCliente, itens, observacoes } = criarPedidoSchema.parse(req.body);

    let valorTotal = 0;
    const itensValidados: ItemValidado[] = [];

    for (const item of itens as ItemInput[]) {
      const produto = await prisma.produto.findUnique({
        where:   { id: item.produtoId },
        include: { tamanhos: true },
      });

      if (!produto) {
        return res.status(400).json({ erro: `Produto não encontrado: ${item.produtoId}` });
      }

      if (!produto.disponivel || !produto.ativo) {
        return res.status(400).json({ erro: `Produto indisponível ou inativo: ${produto.nome}` });
      }

      if ((produto.tipo === 'BATATA_FRITA' || produto.tipo === 'PORCAO_MISTA') && !item.tamanho) {
        return res.status(400).json({ erro: `Tamanho obrigatório para ${produto.nome}! Use: P, M ou G` });
      }

      const { precoUnit, adicionaisData, saboresData } = await calcularPrecoItem(produto, item);

      const quantidade = Number(item.quantidade);
      const subtotal = precoUnit * quantidade;
      valorTotal += subtotal;

      itensValidados.push({
        produto:     { connect: { id: item.produtoId } },
        quantidade,
        precoUnit,
        subtotal,
        tamanho:     (item.tamanho as Tamanho) || null,
        observacoes: item.observacoes || null,
        adicionais:  { create: adicionaisData },
        sabores:     { create: saboresData },
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        usuario: { connect: { id: usuarioId } },
        nomeCliente: nomeCliente || null,
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

    getIO().emit('pedido:novo', pedido);

    return res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
}

const STATUS_VALIDOS = Object.values(StatusPedido);

export async function listar(req: Request, res: Response) {
  try {
    const { status, limit = '50' } = req.query;

    const whereStatus: Prisma.PedidoWhereInput = status
      ? {
          status: {
            in: (status as string)
              .split(',')
              .map(s => s.trim())
              .filter((s): s is StatusPedido => STATUS_VALIDOS.includes(s as StatusPedido)),
          },
        }
      : {};

    const pedidos = await prisma.pedido.findMany({
      where:   whereStatus,
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

const transicoesValidas: Record<StatusPedido, StatusPedido[]> = {
  PENDENTE:   ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO',     'CANCELADO'],
  PRONTO:     ['ENTREGUE'],
  ENTREGUE:   [],
  CANCELADO:  [],
};

export async function atualizarStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = atualizarStatusSchema.parse(req.body);

    if (!STATUS_VALIDOS.includes(status as StatusPedido)) {
      return res.status(400).json({ erro: `Status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}` });
    }

    const statusValidado = status as StatusPedido;

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado!' });

    const permitidos = transicoesValidas[pedido.status] || [];
    if (!permitidos.includes(statusValidado)) {
      return res.status(400).json({
        erro: `Não é possível mudar de ${pedido.status} para ${statusValidado}!`,
        transicoesPermitidas: permitidos,
      });
    }

    const atualizado = await prisma.pedido.update({
      where: { id },
      data: {
        status: statusValidado,
        finalizadoEm: statusValidado === 'ENTREGUE' ? new Date() : undefined,
      },
    });

    getIO().emit('pedido:atualizado', atualizado);

    return res.json({ mensagem: 'Status atualizado!', pedido: atualizado });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    console.error(error);
    return res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
}

export async function cancelar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado!' });

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