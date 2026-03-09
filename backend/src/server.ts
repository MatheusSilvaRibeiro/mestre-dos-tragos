import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { createServer } from 'http';
import { initSocket }   from './config/socket';
import prisma           from './config/prisma';
import dashboardRoutes  from './modules/dashboard/dashboard.routes';
import authRoutes       from './routes/authRoutes';
import categoriaRoutes  from './routes/categoriaRoutes';
import produtoRoutes    from './routes/produtoRoutes';
import pedidoRoutes     from './routes/pedidoRoutes';
import adicionalRoutes  from './routes/adicionalRoutes';
import relatorioRoutes  from './routes/relatorioRoutes';
import usuarioRoutes    from './routes/usuarioRoutes';
import { errorHandler } from './middlewares/errorHandler';
dotenv.config();

const app    = express();
const server = createServer(app); // Servidor HTTP necessário para o Socket.IO

// Inicializa o WebSocket em cima do servidor HTTP
initSocket(server);

app.use(cors());
app.use(express.json());

// 
// ROTA DE HEALTH CHECK
// Confirma que a API está no ar — útil para monitoramento e testes
// 
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Mestre dos Tragos funcionando!',
    versao:   '1.0.0',
  });
});

// 
// ROTA DE SETUP — disponível apenas fora de produção
// Cria o primeiro usuário ADMIN caso ainda não exista nenhum.
// Em produção essa rota não existe — evita brecha de segurança.
// 
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
      data: { usuario: 'admin', nome: 'Administrador', senha, role: 'ADMIN' },
    });

    return res.json({
      mensagem: 'Admin criado com sucesso!',
      usuario:  admin.usuario,
      senha:    'admin123',
    });
  });
}

// 
// ROTAS DA APLICACAO
// Cada prefixo mapeia para um grupo de endpoints
// 
app.use('/api/dashboard',  dashboardRoutes);  // Metricas e relatorios do painel admin
app.use('/api/auth',       authRoutes);        // Login e cadastro de funcionarios
app.use('/api/categorias', categoriaRoutes);   // CRUD de categorias do cardapio
app.use('/api/produtos',   produtoRoutes);     // CRUD de produtos do cardapio
app.use('/api/pedidos',    pedidoRoutes);      // Criacao e gestao de pedidos
app.use('/api/adicionais', adicionalRoutes);   // CRUD de adicionais
app.use('/api/relatorios', relatorioRoutes);   // Relatorios detalhados
app.use('/api/usuarios',   usuarioRoutes);     // CRUD de usuarios/funcionarios

// Middleware global de tratamento de erros — deve ficar sempre por ultimo
app.use(errorHandler);

const PORT = process.env.PORT || 3333;

// 
// server.listen em vez de app.listen
// Necessario para o Socket.IO funcionar no mesmo servidor HTTP
// 
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`WebSocket ativo`);
});