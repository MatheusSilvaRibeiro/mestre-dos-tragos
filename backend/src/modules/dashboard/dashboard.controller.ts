import { Request, Response } from 'express';
import {
  getMetricasHoje,
  getResumoGeral,
  getTopProdutos,
  getFaturamentoPeriodo,
} from './dashboard.service';

// 
// MÉTRICAS DO DIA — GET /api/dashboard/hoje
// Retorna pedidos, faturamento, ticket médio e pendentes do dia atual
// 
export async function metricasHoje(req: Request, res: Response) {
  try {
    const data = await getMetricasHoje();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar métricas do dia.' });
  }
}

// 
// RESUMO GERAL — GET /api/dashboard/resumo
// Totalizadores gerais do sistema: pedidos, faturamento, produtos e funcionários
// 
export async function resumoGeral(req: Request, res: Response) {
  try {
    const data = await getResumoGeral();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar resumo geral.' });
  }
}

// 
// TOP PRODUTOS — GET /api/dashboard/top-produtos
// Ranking dos 10 produtos mais pedidos (excluindo cancelados)
// 
export async function topProdutos(req: Request, res: Response) {
  try {
    const data = await getTopProdutos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar top produtos.' });
  }
}

// 
// FATURAMENTO POR PERÍODO — GET /api/dashboard/faturamento?periodo=7d
// Aceita: 7d, 30d ou 90d — retorna faturamento agrupado por dia
// 
export async function faturamentoPeriodo(req: Request, res: Response) {
  const periodo = (req.query.periodo as string) ?? '7d';

  // Valida o período antes de bater no service — evita consultas inválidas
  if (!['7d', '30d', '90d'].includes(periodo)) {
    return res.status(400).json({ error: 'Período inválido. Use 7d, 30d ou 90d.' });
  }

  try {
    const data = await getFaturamentoPeriodo(periodo as '7d' | '30d' | '90d');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar faturamento por período.' });
  }
}