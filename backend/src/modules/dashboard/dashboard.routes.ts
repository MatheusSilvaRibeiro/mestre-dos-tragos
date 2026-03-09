import { Router } from 'express';
import { metricasHoje, resumoGeral, topProdutos, faturamentoPeriodo } from './dashboard.controller';
import { autenticar } from '../../middlewares/auth';
import { checkRole }  from '../../middlewares/checkRole';

const router = Router();

// 
// ROTAS DO DASHBOARD — /api/dashboard
// Todas as rotas aqui exigem login E cargo de ADMIN.
// O router.use aplica os dois middlewares em todas as rotas de uma vez.
// 

// Garante que o usuário está autenticado (token válido)
router.use(autenticar);

// Garante que só ADMIN consegue acessar o dashboard
router.use(checkRole(['ADMIN']));

router.get('/hoje',         metricasHoje);       // Snapshot do dia atual
router.get('/resumo',       resumoGeral);        // Totalizadores gerais do sistema
router.get('/top-produtos', topProdutos);        // Ranking dos 10 mais vendidos
router.get('/faturamento',  faturamentoPeriodo); // Faturamento agrupado por período

export default router;