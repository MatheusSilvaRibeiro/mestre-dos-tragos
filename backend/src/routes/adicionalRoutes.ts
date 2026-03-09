import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import {
  listar,
  buscarPorId,
  criar,
  editar,
  desativar,
} from '../controllers/adicionalController';

const router = Router();

// Qualquer funcionário logado pode ver os adicionais disponíveis
router.get('/',    autenticar, listar);
router.get('/:id', autenticar, buscarPorId);

// Só o ADMIN pode mexer nos adicionais — criar, editar ou desativar
router.post('/',      autenticar, checkRole(['ADMIN']), criar);
router.put('/:id',    autenticar, checkRole(['ADMIN']), editar);
router.delete('/:id', autenticar, checkRole(['ADMIN']), desativar);

export default router;