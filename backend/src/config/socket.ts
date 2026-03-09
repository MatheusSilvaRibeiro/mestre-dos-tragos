import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Instância global do Socket.IO — guardada aqui para ser acessada em qualquer controller
let io: SocketServer;

// 
// INICIALIZAR SOCKET — chamado uma única vez na inicialização do servidor
// Recebe o servidor HTTP e cria a instância do Socket.IO em cima dele.
// O cors com origin '*' libera conexões de qualquer origem — ajuste em produção.
// 
export function initSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: { origin: '*' },
  });

  io.on('connection', socket => {
    // Cada vez que um painel se conecta (cozinha, atendente), aparece aqui
    console.log(` Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      // Quando o navegador fecha ou perde conexão, registra a saída
      console.log(` Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

// 
// GET IO — atalho para pegar a instância do Socket em qualquer lugar do projeto
// Usado nos controllers para emitir eventos em tempo real (ex: pedido:novo, pedido:atualizado).
// Lança erro se chamado antes do servidor inicializar — evita bugs silenciosos.
// 
export function getIO(): SocketServer {
  if (!io) throw new Error('Socket não inicializado! Chame initSocket primeiro.');
  return io;
}