import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import { listar, criar, atualizar, deletar } from '../controllers/usuarioController';

const router = Router();

// Gerenciamento de usuários é 100% restrito ao ADMIN
// Aqui o admin pode ver, criar, editar e remover qualquer funcionário do sistema
router.get('/',       autenticar, checkRole(['ADMIN']), listar);
router.post('/',      autenticar, checkRole(['ADMIN']), criar);
router.put('/:id',    autenticar, checkRole(['ADMIN']), atualizar);
router.delete('/:id', autenticar, checkRole(['ADMIN']), deletar);

export default router;