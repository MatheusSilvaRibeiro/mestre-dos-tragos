import rateLimit from 'express-rate-limit';

/** Le um limite via variavel de ambiente, com o valor seguro de producao como fallback. */
function limite(env: string | undefined, padrao: number): number {
  const valor = Number(env);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // RATE_LIMIT_MAX permite subir esse limite temporariamente (ex: pra rodar
  // a suite E2E completa, que sozinha facilmente passa de 100 requisicoes
  // em uma unica execucao). Sem a variavel definida, comportamento identico
  // ao de antes.
  max: limite(process.env.RATE_LIMIT_MAX, 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limite(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: 'Muitas tentativas de login. Aguarde alguns minutos.',
  },
});