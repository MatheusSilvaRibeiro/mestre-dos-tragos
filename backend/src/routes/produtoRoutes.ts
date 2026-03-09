import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import {
  listar,
  buscarPorId,
  criar,
  editar,
  alternarDisponibilidade,
  desativar,
} from '../controllers/produtoController';

const router = Router();

// Todos logados podem ver o cardápio — atendente precisa na hora de montar o pedido
router.get('/',    autenticar, listar);
router.get('/:id', autenticar, buscarPorId);

// Criar, editar e desativar produto é só o ADMIN que decide
router.post('/',      autenticar, checkRole(['ADMIN']), criar);
router.put('/:id',    autenticar, checkRole(['ADMIN']), editar);
router.delete('/:id', autenticar, checkRole(['ADMIN']), desativar);

// Disponibilidade a cozinha também pode alterar — ex: acabou o ingrediente
router.patch(
  '/:id/disponibilidade',
  autenticar,
  checkRole(['ADMIN', 'COZINHA']),
  alternarDisponibilidade,
);

export default router;