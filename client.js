const fs = require('fs');
const WebSocket = require('ws');
const { Blockchain } = require('./blockchain');

class Client {
  constructor(serverAddress) {
    this.blockchain = new Blockchain();
    this.serverAddress = serverAddress;
    this.ws = null;
  }

  connectToServer() {
    this.ws = new WebSocket(this.serverAddress);
    this.ws.on('open', () => {
      console.log('Conectado ao servidor WebSocket.');
      this.requestBlockchain();
    });
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'blockchain') {
        this.handleBlockchainUpdate(message.blockchain);
      }
    });
    this.ws.on('close', () => {
      console.log('Desconectado do servidor WebSocket.');
    });
    this.ws.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });
  }

  requestBlockchain() {
    this.ws.send(JSON.stringify({ type: 'requestBlockchain' }));
  }

  handleBlockchainUpdate(newBlockchain) {
    // Valida a nova blockchain recebida
    const isValid = this.blockchain.validateChain(newBlockchain);
    if (isValid) {
      console.log('Blockchain recebida e validada com sucesso.');
      this.blockchain.chain = newBlockchain;
      this.blockchain.save();
    } else {
      console.error('Blockchain inválida recebida. Ignorando...');
    }
  }

  mineBlock(minerAddress) {
    this.blockchain.minePendingTransactions(minerAddress);
  }

  sendTransaction(from, to, amount, privateKeyArray) {
    this.blockchain.sendTransaction(from, to, amount, privateKeyArray);
  }
}

// Inicie o cliente
const client = new Client('ws://localhost:6001');
client.connectToServer();