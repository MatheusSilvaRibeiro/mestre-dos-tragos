import { Request, Response } from 'express';
import prisma from '../config/prisma';

// 
// LISTAR PRODUTOS — GET /api/produtos
// Suporta filtros opcionais por categoria e disponibilidade.
// Os disponíveis sempre aparecem primeiro — facilita na hora de montar o pedido.
// 
export async function listar(req: Request, res: Response) {
  try {
    const { categoriaId, apenasDisponiveis } = req.query;

    // Começa filtrando só os produtos ativos — inativados não aparecem no cardápio
    const where: any = { ativo: true };

    if (apenasDisponiveis === 'true') {
      where.disponivel = true;
    }

    if (categoriaId) {
      where.categoriaId = categoriaId as string;
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nome: true } },
        tamanhos:  { orderBy: { tamanho: 'asc' } },
        // Traz os adicionais vinculados ao produto com seus preços por tamanho
        adicionaisProduto: {
          include: {
            adicional: {
              include: {
                precoPorTamanho: { orderBy: { tamanho: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: [
        { disponivel: 'desc' }, // Disponíveis primeiro
        { nome: 'asc' },
      ],
    });

    return res.json(produtos);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
}

// 
// BUSCAR PRODUTO POR ID — GET /api/produtos/:id
// Retorna todos os detalhes do produto, incluindo tamanhos e adicionais
// 
export async function buscarPorId(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: { select: { id: true, nome: true } },
        tamanhos:  { orderBy: { tamanho: 'asc' } },
        adicionaisProduto: {
          include: {
            adicional: {
              include: {
                precoPorTamanho: { orderBy: { tamanho: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    return res.json(produto);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
}

// 
// CRIAR PRODUTO — POST /api/produtos
// Só ADMIN pode criar. As regras variam por tipo de produto:
// - LANCHE → precisa de preço fixo
// - BATATA_FRITA / PORCAO_MISTA → precisa de tamanhos (P, M, G) com preços
// 
export async function criar(req: Request, res: Response) {
  try {
    const { nome, descricao, emoji, preco, categoriaId, disponivel, tipo, tamanhos, adicionaisIds } = req.body;

    // Valida os campos mínimos antes de qualquer operação no banco
    if (!nome || !categoriaId || !tipo) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, categoriaId, tipo' });
    }

    // Lanche tem preço único — sem preco não tem como cadastrar
    if (tipo === 'LANCHE' && !preco) {
      return res.status(400).json({ erro: 'LANCHE precisa de preco!' });
    }

    // Batata e porção mista variam por tamanho — sem tamanhos não tem como precificar
    if ((tipo === 'BATATA_FRITA' || tipo === 'PORCAO_MISTA') && (!tamanhos || tamanhos.length === 0)) {
      return res.status(400).json({ erro: `${tipo} precisa de tamanhos (P, M, G) com preços!` });
    }

    // Garante que a categoria existe antes de criar o produto
    const categoriaExiste = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoriaExiste) {
      return res.status(400).json({ erro: 'Categoria não encontrada!' });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        emoji:      emoji ?? null,
        preco:      Number(preco || 0),
        categoriaId,
        disponivel: disponivel ?? true, // Novo produto já nasce disponível por padrão
        tipo,
        // Se vieram tamanhos, cria tudo junto numa única operação
        ...(tamanhos?.length > 0 && {
          tamanhos: {
            create: tamanhos.map((t: any) => ({
              tamanho: t.tamanho,
              preco:   Number(t.preco),
            })),
          },
        }),
        // Vincula os adicionais pré-selecionados para esse produto
        ...(adicionaisIds?.length > 0 && {
          adicionaisProduto: {
            create: adicionaisIds.map((adicionalId: string) => ({ adicionalId })),
          },
        }),
      },
      include: {
        categoria: { select: { id: true, nome: true } },
        tamanhos:  { orderBy: { tamanho: 'asc' } },
        adicionaisProduto: {
          include: {
            adicional: {
              include: {
                precoPorTamanho: { orderBy: { tamanho: 'asc' } },
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar produto' });
  }
}

// 
// EDITAR PRODUTO — PUT /api/produtos/:id
// Só ADMIN pode editar. Todos os campos são opcionais.
// Tamanhos e adicionais são substituídos por completo quando enviados.
// 
export async function editar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { nome, descricao, emoji, preco, categoriaId, disponivel, tamanhos, adicionaisIds } = req.body;

    // Verifica se o produto existe antes de tentar editar
    const existe = await prisma.produto.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    // Se vier uma nova categoria, valida antes de aceitar
    if (categoriaId) {
      const categoriaExiste = await prisma.categoria.findUnique({ where: { id: categoriaId } });
      if (!categoriaExiste) {
        return res.status(400).json({ erro: 'Categoria não encontrada!' });
      }
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        // Só atualiza o que foi enviado — campos ausentes ficam intactos
        ...(nome                     && { nome }),
        ...(descricao !== undefined  && { descricao }),
        ...(emoji     !== undefined  && { emoji }),
        ...(preco                    && { preco: Number(preco) }),
        ...(categoriaId              && { categoriaId }),
        ...(disponivel !== undefined && { disponivel }),
        // Estratégia deleteMany + create: substitui todos os tamanhos antigos pelos novos
        ...(tamanhos?.length > 0 && {
          tamanhos: {
            deleteMany: {},
            create: tamanhos.map((t: any) => ({
              tamanho: t.tamanho,
              preco:   Number(t.preco),
            })),
          },
        }),
        // Mesmo esquema para os adicionais vinculados
        ...(adicionaisIds && {
          adicionaisProduto: {
            deleteMany: {},
            create: adicionaisIds.map((adicionalId: string) => ({ adicionalId })),
          },
        }),
      },
      include: {
        categoria: { select: { id: true, nome: true } },
        tamanhos:  { orderBy: { tamanho: 'asc' } },
        adicionaisProduto: {
          include: {
            adicional: {
              include: {
                precoPorTamanho: { orderBy: { tamanho: 'asc' } },
              },
            },
          },
        },
      },
    });

    return res.json({ mensagem: 'Produto atualizado com sucesso!', produto: produtoAtualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao editar produto' });
  }
}

// 
// ALTERNAR DISPONIBILIDADE — PATCH /api/produtos/:id/disponibilidade
// Cozinha e Admin podem usar isso. Útil quando acaba um ingrediente
// e precisa tirar o produto do ar rapidinho sem desativar de vez.
// 
export async function alternarDisponibilidade(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    // Produto inativo não pode voltar a ficar disponível — precisa ser reativado antes
    if (!produto.ativo) {
      return res.status(400).json({ erro: 'Produto inativo não pode ter disponibilidade alterada!' });
    }

    // Inverte o estado atual — se estava disponível fica indisponível e vice-versa
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data:  { disponivel: !produto.disponivel },
      select: { id: true, nome: true, disponivel: true },
    });

    return res.json({
      mensagem: produtoAtualizado.disponivel
        ? ` ${produtoAtualizado.nome} está DISPONÍVEL!`
        : ` ${produtoAtualizado.nome} está INDISPONÍVEL!`,
      produto: produtoAtualizado,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao alterar disponibilidade' });
  }
}

// 
// DESATIVAR PRODUTO — DELETE /api/produtos/:id
// Não deleta do banco — marca como inativo.
// Isso preserva o histórico de pedidos que usaram esse produto.
// 
export async function desativar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const existe = await prisma.produto.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    await prisma.produto.update({
      where: { id },
      data:  { ativo: false },
    });

    return res.json({ mensagem: 'Produto desativado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao desativar produto' });
  }
}