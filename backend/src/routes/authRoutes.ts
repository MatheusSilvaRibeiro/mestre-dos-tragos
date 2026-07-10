import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import { login, cadastrar, listarFuncionarios } from '../controllers/authController';
import { loginLimiter } from '../middlewares/rateLimit';

const router = Router();

// Login é público — qualquer um pode tentar entrar
router.post('/login', loginLimiter, login);

// Só ADMIN pode cadastrar novos funcionários no sistema
router.post('/cadastrar', autenticar, checkRole(['ADMIN']), cadastrar);

// Só ADMIN pode ver a lista de funcionários
router.get('/funcionarios', autenticar, checkRole(['ADMIN']), listarFuncionarios);

export default router;