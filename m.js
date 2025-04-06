const { Blockchain } = require('./blockchain'); // Importa a classe Blockchain
const Miner = require('./miner'); // Importa a classe Miner
const WebSocket = require('ws'); // Importa o WebSocket

// Conecta-se ao servidor WebSocket existente
const ws = new WebSocket('ws://localhost:8080');

// Cria uma instância da Blockchain
const blockchain = new Blockchain();

// Cria uma instância do Miner
const miner = new Miner(blockchain, '4FuvGvnrJvgZDVQAJaduKoDhQtxd', ws);

// Inicia o minerador
miner.startMining();

// Configura o cliente WebSocket para receber mensagens
ws.on('open', () => {
  console.log('Conectado ao servidor WebSocket!');
});

ws.on('message', (message) => {
  console.log('Mensagem recebida:', message.toString());
  blockchain.handleMessage(message.toString());
});