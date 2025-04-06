const WebSocket = require('ws');

class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.server = new WebSocket.Server({ port });
    this.nodes = new Set();

    this.server.on('connection', (ws) => {
      this.nodes.add(ws);
      console.log('Novo nó conectado');

      ws.on('close', () => {
        this.nodes.delete(ws);
        console.log('Nó desconectado');
      });

      ws.on('error', (error) => {
        console.error('Erro no WebSocket:', error);
      });
    });

    console.log(`WebSocket Server iniciado na porta ${this.port}`);
  }

  broadcast(message) {
    this.nodes.forEach((node) => {
      if (node.readyState === WebSocket.OPEN) {
        node.send(JSON.stringify(message));
      }
    });
  }
}

// Inicie o servidor WebSocket na porta 6001
const webSocketServer = new WebSocketServer(6001);

// Mantenha o processo em execução
process.on('SIGINT', () => {
  console.log('Servidor WebSocket encerrado.');
  process.exit();
});

module.exports = WebSocketServer; // Exporte a classe para uso em outros arquivos