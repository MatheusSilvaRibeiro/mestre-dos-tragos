import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { createServer } from 'http';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { initSocket } from './config/socket';
import prisma from './config/prisma';
import { logger } from './config/logger';

import dashboardRoutes from './modules/dashboard/dashboard.routes';
import authRoutes from './routes/authRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import produtoRoutes from './routes/produtoRoutes';
import pedidoRoutes from './routes/pedidoRoutes';
import adicionalRoutes from './routes/adicionalRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

import { apiLimiter } from './middlewares/rateLimit';
import { errorHandler } from './middlewares/errorHandler';
import { loggerMiddleware } from './middlewares/logger';
import { swaggerSpec } from './docs/swagger';

dotenv.config();

const app = express();
const server = createServer(app);

initSocket(server);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(apiLimiter);
app.use(loggerMiddleware);
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (_req, res) => {
  res.json({
    mensagem: 'API Mestre dos Tragos funcionando!',
    versao: '1.0.0',
  });
});

app.get('/health', async (_req, res) => {
  const database = await prisma.usuario
    .findFirst({
      select: { id: true },
    })
    .then(() => 'connected')
    .catch(() => 'disconnected');

  return res.json({
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'mestre-dos-tragos-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Number(process.uptime().toFixed(2)),
    database,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.post('/setup', async (_req, res) => {
    const adminExiste = await prisma.usuario.findFirst({
      where: { role: 'ADMIN' },
    });

    if (adminExiste) {
      return res.json({ mensagem: 'Admin ja existe! Faca login normalmente.' });
    }

    const senha = await bcrypt.hash('admin123', 10);

    const admin = await prisma.usuario.create({
      data: {
        usuario: 'admin',
        nome: 'Administrador',
        senha,
        role: 'ADMIN',
      },
    });

    return res.json({
      mensagem: 'Admin criado com sucesso!',
      usuario: admin.usuario,
      senha: 'admin123',
    });
  });
}

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/adicionais', adicionalRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3333;

server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  logger.info(`Acesse: http://localhost:${PORT}`);
  logger.info('WebSocket ativo');
});