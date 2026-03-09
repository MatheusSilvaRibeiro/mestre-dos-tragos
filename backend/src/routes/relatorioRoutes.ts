import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import {
  resumoDia,
  faturamentoPeriodo,
  rankingProdutos,
  pedidosPorAtendente,
  pedidosPorStatus,
  taxaCancelamento,
  comparativoSemanal,
} from '../controllers/relatorioController';

const router = Router();

// Relatórios são exclusivos do ADMIN — dados financeiros e operacionais sensíveis
const adminOnly = [autenticar, checkRole(['ADMIN'])] as const;

router.get('/dia',                 ...adminOnly, resumoDia);           // Resumo do dia atual
router.get('/periodo',             ...adminOnly, faturamentoPeriodo);  // Faturamento por período
router.get('/produtos',            ...adminOnly, rankingProdutos);     // Produtos mais vendidos
router.get('/atendentes',          ...adminOnly, pedidosPorAtendente); // Desempenho por atendente
router.get('/pedidos-status',      ...adminOnly, pedidosPorStatus);    // Pedidos agrupados por status
router.get('/cancelamentos',       ...adminOnly, taxaCancelamento);    // Taxa de cancelamento
router.get('/comparativo-semanal', ...adminOnly, comparativoSemanal);  // Comparativo semana a semana

export default router;