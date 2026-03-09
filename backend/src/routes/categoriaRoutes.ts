import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import { listar, criar, editar, desativar } from '../controllers/categoriaController';

const router = Router();

// Todo mundo logado pode ver as categorias — atendente precisa disso na hora de montar pedido
router.get('/', autenticar, listar);

// Mexer nas categorias é coisa de ADMIN — cria, edita ou desativa
router.post('/',      autenticar, checkRole(['ADMIN']), criar);
router.put('/:id',    autenticar, checkRole(['ADMIN']), editar);
router.delete('/:id', autenticar, checkRole(['ADMIN']), desativar);

export default router;