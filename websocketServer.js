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

module.exports = WebSocketServer;