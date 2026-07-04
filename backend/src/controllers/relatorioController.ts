import { Request, Response } from 'express';
import prisma from '../config/prisma';

// 
// RESUMO DO DIA — GET /api/relatorios/dia
// Fotografia do dia atual: pedidos, faturamento, ticket médio e tempo de preparo.
// Só conta no faturamento o que foi efetivamente entregue — cancelados não entram.
// 
export async function resumoDia(req: Request, res: Response) {
  try {
    const hoje = new Date();

    // Define o intervalo do dia inteiro — do primeiro ao último milissegundo
    const inicioDia = new Date(hoje);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const pedidosDia = await prisma.pedido.findMany({
      where: {
        criadoEm: { gte: inicioDia, lte: fimDia },
      },
      include: { itens: true },
    });

    const totalPedidos      = pedidosDia.length;
    const pedidosEntregues  = pedidosDia.filter(p => p.status === 'ENTREGUE');
    const pedidosCancelados = pedidosDia.filter(p => p.status === 'CANCELADO');

    // Faturamento considera apenas pedidos que chegaram na mão do cliente
    const faturamento = pedidosEntregues.reduce((acc, p) => acc + Number(p.valorTotal), 0);

    // Ticket médio = quanto cada pedido entregue rendeu em média
    const ticketMedio = pedidosEntregues.length > 0
      ? faturamento / pedidosEntregues.length
      : 0;

    // Tempo médio de preparo = diferença entre criação e finalização do pedido
    const pedidosComTempo = pedidosEntregues.filter(p => p.finalizadoEm);
    const tempoMedioMinutos = pedidosComTempo.length > 0
      ? pedidosComTempo.reduce((acc, p) => {
          const diff = new Date(p.finalizadoEm!).getTime() - new Date(p.criadoEm).getTime();
          return acc + diff / 60000; // Converte milissegundos para minutos
        }, 0) / pedidosComTempo.length
      : 0;

    return res.json({
      data:                       inicioDia.toLocaleDateString('pt-BR'),
      totalPedidos,
      pedidosEntregues:           pedidosEntregues.length,
      pedidosCancelados:          pedidosCancelados.length,
      faturamento:                Number(faturamento.toFixed(2)),
      ticketMedio:                Number(ticketMedio.toFixed(2)),
      tempoMedioPreparoMinutos:   Number(tempoMedioMinutos.toFixed(0)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar resumo do dia' });
  }
}

// 
// FATURAMENTO POR PERÍODO — GET /api/relatorios/periodo
// Ex: ?inicio=2024-01-01&fim=2024-01-31
// Retorna um resumo completo do período, faturamento dia a dia e lista de cancelamentos.
// 
export async function faturamentoPeriodo(req: Request, res: Response) {
  try {
    const { inicio, fim } = req.query;

    // As duas datas são obrigatórias — sem elas não tem como calcular o período
    if (!inicio || !fim) {
      return res.status(400).json({
        erro: 'Informe as datas! Ex: ?inicio=2024-01-01&fim=2024-01-31',
      });
    }

    const dataInicio = new Date(inicio as string);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(fim as string);
    dataFim.setHours(23, 59, 59, 999);

    // Valida se o usuário passou datas que fazem sentido
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return res.status(400).json({ erro: 'Datas inválidas!' });
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
      },
      include: {
        itens:   { include: { produto: { select: { nome: true } } } },
        usuario: { select: { nome: true } },
      },
      orderBy: { criadoEm: 'asc' },
    });

    const entregues  = pedidos.filter(p => p.status === 'ENTREGUE');
    const cancelados = pedidos.filter(p => p.status === 'CANCELADO');

    const faturamentoTotal = entregues.reduce((acc, p) => acc + Number(p.valorTotal), 0);
    const ticketMedio = entregues.length > 0
      ? faturamentoTotal / entregues.length
      : 0;

    // Agrupa o faturamento por dia — útil para ver os dias mais movimentados
    const faturamentoPorDia: Record<string, number> = {};
    entregues.forEach(pedido => {
      const dia = new Date(pedido.criadoEm).toLocaleDateString('pt-BR');
      faturamentoPorDia[dia] = (faturamentoPorDia[dia] || 0) + Number(pedido.valorTotal);
    });

    return res.json({
      periodo: {
        inicio: dataInicio.toLocaleDateString('pt-BR'),
        fim:    dataFim.toLocaleDateString('pt-BR'),
      },
      resumo: {
        totalPedidos:       pedidos.length,
        pedidosEntregues:   entregues.length,
        pedidosCancelados:  cancelados.length,
        faturamentoTotal:   Number(faturamentoTotal.toFixed(2)),
        ticketMedio:        Number(ticketMedio.toFixed(2)),
      },
      faturamentoPorDia,
      // Lista detalhada dos cancelamentos para análise e acompanhamento
      pedidosCancelados: cancelados.map(p => ({
        id:          p.id,
        nomeCliente: p.nomeCliente,
        valorTotal:  p.valorTotal,
        data:        new Date(p.criadoEm).toLocaleDateString('pt-BR'),
        atendente:   p.usuario.nome,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar relatório por período' });
  }
}

// 
// RANKING DE PRODUTOS — GET /api/relatorios/produtos
// Mostra os produtos mais e menos pedidos — ótimo para decisões de cardápio.
// Filtro de data opcional: ?inicio=2024-01-01&fim=2024-01-31
// 
export async function rankingProdutos(req: Request, res: Response) {
  try {
    const { inicio, fim } = req.query;

    // Só considera itens de pedidos que foram de fato entregues
    const where: any = {
      pedido: { status: 'ENTREGUE' },
    };

    if (inicio && fim) {
      const dataInicio = new Date(inicio as string);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(fim as string);
      dataFim.setHours(23, 59, 59, 999);

      where.pedido = {
        ...where.pedido,
        criadoEm: { gte: dataInicio, lte: dataFim },
      };
    }

    const itensPedidos = await prisma.itemPedido.findMany({
      where,
      include: {
        produto: { select: { id: true, nome: true } },
      },
    });

    // Agrupa os itens por produto e acumula quantidade vendida e valor arrecadado
    const rankingMap: Record<string, {
      nome:            string;
      quantidade:      number;
      totalArrecadado: number;
    }> = {};

    itensPedidos.forEach(item => {
      const id = item.produtoId;
      if (!rankingMap[id]) {
        rankingMap[id] = { nome: item.produto.nome, quantidade: 0, totalArrecadado: 0 };
      }
      rankingMap[id].quantidade      += item.quantidade;
      rankingMap[id].totalArrecadado += Number(item.subtotal);
    });

    // Converte para array e ordena do mais vendido para o menos vendido
    const ranking = Object.entries(rankingMap)
      .map(([id, dados]) => ({
        id,
        ...dados,
        totalArrecadado: Number(dados.totalArrecadado.toFixed(2)),
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return res.json({
      maisPedidos:   ranking.slice(0, 5),                    // Top 5 mais vendidos
      menosPedidos:  [...ranking].reverse().slice(0, 5),     // Bottom 5 menos vendidos
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar ranking de produtos' });
  }
}

// 
// PEDIDOS POR ATENDENTE — GET /api/relatorios/atendentes
// Mostra o desempenho de cada atendente: total de pedidos, entregas e faturamento gerado.
// Filtro de data opcional: ?inicio=2024-01-01&fim=2024-01-31
// 
export async function pedidosPorAtendente(req: Request, res: Response) {
  try {
    const { inicio, fim } = req.query;

    const where: any = {};

    if (inicio && fim) {
      const dataInicio = new Date(inicio as string);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(fim as string);
      dataFim.setHours(23, 59, 59, 999);
      where.criadoEm = { gte: dataInicio, lte: dataFim };
    }

    // Busca atendentes e admins ativos com seus pedidos já filtrados
    const atendentes = await prisma.usuario.findMany({
      where: {
        role: { in: ['ATENDENTE', 'ADMIN'] },
        ativo: true,
      },
      select: {
        id:      true,
        nome:    true,
        usuario: true,
        role:    true,
        pedidos: {
          where,
          select: { id: true, status: true, valorTotal: true },
        },
      },
    });

    // Calcula as métricas de cada atendente individualmente
    const resultado = atendentes.map(atendente => {
      const pedidos   = atendente.pedidos;
      const entregues = pedidos.filter(p => p.status === 'ENTREGUE');
      const cancelados = pedidos.filter(p => p.status === 'CANCELADO');
      const faturamento = entregues.reduce((acc, p) => acc + Number(p.valorTotal), 0);

      return {
        id:                  atendente.id,
        nome:                atendente.nome,
        usuario:             atendente.usuario,
        cargo:               atendente.role,
        totalPedidos:        pedidos.length,
        pedidosEntregues:    entregues.length,
        pedidosCancelados:   cancelados.length,
        faturamentoGerado:   Number(faturamento.toFixed(2)),
      };
    });

    // Quem atendeu mais pedidos aparece primeiro
    resultado.sort((a, b) => b.totalPedidos - a.totalPedidos);

    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar relatório por atendente' });
  }
}

// 
// PEDIDOS POR STATUS — GET /api/relatorios/pedidos-status
// Snapshot de um dia específico mostrando quantos pedidos estão em cada status.
// Ex: ?data=2026-02-26 (se não informar, usa o dia atual)
// 
export async function pedidosPorStatus(req: Request, res: Response) {
  try {
    const { data } = req.query;

    // Se não passar data, assume hoje
    const base   = data ? new Date(data as string) : new Date();
    const inicio = new Date(base);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(base);
    fim.setHours(23, 59, 59, 999);

    const statusList = ['PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];
    const resultado: Record<string, number> = {};

    // Conta pedidos de cada status separadamente — mais eficiente que filtrar no JS
    for (const status of statusList) {
      resultado[status] = await prisma.pedido.count({
        where: { status: status as any, criadoEm: { gte: inicio, lte: fim } },
      });
    }

    const total = Object.values(resultado).reduce((acc, v) => acc + v, 0);

    return res.json({
      data:      inicio.toLocaleDateString('pt-BR'),
      total,
      porStatus: resultado,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar relatório por status' });
  }
}

// 
// TAXA DE CANCELAMENTO — GET /api/relatorios/cancelamentos
// Calcula que percentual dos pedidos foram cancelados no período.
// Ex: ?inicio=2026-02-01&fim=2026-02-26
// Se não informar período, calcula sobre todos os pedidos do banco.
// 
export async function taxaCancelamento(req: Request, res: Response) {
  try {
    const { inicio, fim } = req.query;

    const where: any = {};

    if (inicio && fim) {
      const dataInicio = new Date(inicio as string);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(fim as string);
      dataFim.setHours(23, 59, 59, 999);
      where.criadoEm = { gte: dataInicio, lte: dataFim };
    }

    const total      = await prisma.pedido.count({ where });
    const cancelados = await prisma.pedido.count({ where: { ...where, status: 'CANCELADO' } });

    // Evita divisão por zero se não houver pedidos no período
    const taxa = total > 0
      ? ((cancelados / total) * 100).toFixed(2)
      : '0.00';

    return res.json({
      periodo:          inicio && fim ? { inicio, fim } : 'geral',
      totalPedidos:     total,
      cancelados,
      taxaCancelamento: `${taxa}%`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar taxa de cancelamento' });
  }
}

// 
// COMPARATIVO SEMANAL — GET /api/relatorios/comparativo-semanal
// Compara o desempenho da semana atual com a semana passada.
// Mostra variação percentual do faturamento — ótimo para ver tendências.
// 
export async function comparativoSemanal(req: Request, res: Response) {
  try {
    const hoje = new Date();

    // Calcula o início da semana atual (segunda-feira)
    const diaSemana = hoje.getDay() === 0 ? 7 : hoje.getDay();
    const inicioSemanaAtual = new Date(hoje);
    inicioSemanaAtual.setDate(hoje.getDate() - (diaSemana - 1));
    inicioSemanaAtual.setHours(0, 0, 0, 0);

    // Semana passada = 7 dias antes da semana atual
    const inicioSemanaPassada = new Date(inicioSemanaAtual);
    inicioSemanaPassada.setDate(inicioSemanaAtual.getDate() - 7);
    const fimSemanaPassada = new Date(inicioSemanaAtual);
    fimSemanaPassada.setMilliseconds(-1);

    // Função interna que calcula o resumo de qualquer semana dado um intervalo
    async function resumoSemana(inicio: Date, fim: Date) {
      const pedidos = await prisma.pedido.findMany({
        where: { criadoEm: { gte: inicio, lte: fim }, status: 'ENTREGUE' },
      });
      const total = pedidos.reduce((acc, p) => acc + Number(p.valorTotal), 0);
      return {
        totalPedidos: pedidos.length,
        faturamento:  Number(total.toFixed(2)),
        ticketMedio:  pedidos.length > 0
          ? Number((total / pedidos.length).toFixed(2))
          : 0,
      };
    }

    // Executa as duas consultas em paralelo para economizar tempo
    const [semanaAtual, semanaPassada] = await Promise.all([
      resumoSemana(inicioSemanaAtual, hoje),
      resumoSemana(inicioSemanaPassada, fimSemanaPassada),
    ]);

    // Variação percentual do faturamento entre as semanas
    const variacao = semanaPassada.faturamento > 0
      ? `${(((semanaAtual.faturamento - semanaPassada.faturamento) / semanaPassada.faturamento) * 100).toFixed(2)}%`
      : 'sem dados anteriores';

    return res.json({
      semanaAtual: {
        inicio: inicioSemanaAtual.toLocaleDateString('pt-BR'),
        fim:    hoje.toLocaleDateString('pt-BR'),
        ...semanaAtual,
      },
      semanaPassada: {
        inicio: inicioSemanaPassada.toLocaleDateString('pt-BR'),
        fim:    fimSemanaPassada.toLocaleDateString('pt-BR'),
        ...semanaPassada,
      },
      variacao,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao gerar comparativo semanal' });
  }
}