// Importa tipos do Express
import { Request, Response, NextFunction } from 'express';

// NextFunction = função que chama o PRÓXIMO middleware ou controller
// É o "pode passar!" do segurança

// Importa jwt para verificar o token
import jwt from 'jsonwebtoken';

// ═══════════════════════════════════════════════════
// MIDDLEWARE: Verificar se está autenticado
// Usado em todas as rotas protegidas
// ═══════════════════════════════════════════════════

export function autenticar(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. PEGA o token do cabeçalho da requisição
    // O frontend envia assim:
    // Headers: { "Authorization": "Bearer eyJhbGci..." }
    const authHeader = req.headers.authorization;

    // 2. VERIFICA se o token foi enviado
    if (!authHeader) {
      return res.status(401).json({ 
        erro: 'Token não informado. Faça login!' 
      });
    }

    // 3. SEPARA o "Bearer" do token
    // "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."]
    const [, token] = authHeader.split(' ');

    // 4. VERIFICA se o token é válido
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_padrao'
    ) as { id: string; role: any };

    // 5. ADICIONA os dados do funcionário na requisição
    // Agora qualquer controller pode acessar req.usuario
    req.usuario = {
      id: payload.id,
      role: payload.role
    };

    // 6. LIBERA para continuar (chama o próximo middleware/controller)
    return next();

  } catch (error) {
    // Token inválido ou expirado
    return res.status(401).json({ 
      erro: 'Token inválido ou expirado. Faça login novamente!' 
    });
  }
} 