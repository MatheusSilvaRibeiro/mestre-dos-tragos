import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import {
  listar,
  buscarPorId,
  criar,
  atualizarStatus,
  cancelar,
} from '../controllers/pedidoController';

const router = Router();

// Todos os perfis podem ver pedidos — cada um precisa acompanhar o fluxo
const TODOS = ['ADMIN', 'ATENDENTE', 'COZINHA'] as const;

router.get('/',    autenticar, checkRole([...TODOS]), listar);
router.get('/:id', autenticar, checkRole([...TODOS]), buscarPorId);

// Só ADMIN e ATENDENTE criam pedidos — cozinha só recebe e produz
router.post('/', autenticar, checkRole(['ADMIN', 'ATENDENTE']), criar);

// Atualizar status é pra todos — cozinha muda pra EM_PREPARO e PRONTO, atendente entrega
router.patch('/:id/status',   autenticar, checkRole([...TODOS]),             atualizarStatus);

// Cancelar pedido só quem atende ou o admin pode fazer
router.patch('/:id/cancelar', autenticar, checkRole(['ADMIN', 'ATENDENTE']), cancelar);

export default router;