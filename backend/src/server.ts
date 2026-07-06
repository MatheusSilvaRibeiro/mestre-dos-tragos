import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { createServer } from 'http';

import { initSocket } from './config/socket';
import prisma from './config/prisma';

import dashboardRoutes from './modules/dashboard/dashboard.routes';
import authRoutes from './routes/authRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import produtoRoutes from './routes/produtoRoutes';
import pedidoRoutes from './routes/pedidoRoutes';
import adicionalRoutes from './routes/adicionalRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

import { errorHandler } from './middlewares/errorHandler';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';

dotenv.config();

const app = express();
const server = createServer(app);

initSocket(server);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Mestre dos Tragos funcionando!',
    versao: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mestre-dos-tragos-api',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.post('/setup', async (req, res) => {
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
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`WebSocket ativo`);
});