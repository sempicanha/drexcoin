const WebSocket = require('ws');
const { Blockchain } = require('./blockchain');

const webSocketServer = new WebSocket.Server({ port: 8080 });
const blockchain = new Blockchain(webSocketServer);

webSocketServer.on('connection', (ws) => {
  ws.on('message', (message) => {
    blockchain.handleMessage(message);
  });
});