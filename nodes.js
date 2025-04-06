const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Node {
  constructor(serverUrl) {
    this.webSocket = new WebSocket(serverUrl);
    this.blockchainPath = path.join(__dirname, 'blockchain', 'blockchain.json'); // Caminho local para blockchain.json

    this.webSocket.on('open', () => {
      console.log('Conectado ao servidor WebSocket.');
      this.requestBlockchain();
    });

    this.webSocket.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'blockchainResponse') {
        if (data.error) {
          console.error('Erro ao baixar a blockchain:', data.error);
        } else {
          this.validateAndSaveBlockchain(data.data);
        }
      }
    });

    this.webSocket.on('close', () => {
      console.log('Desconectado do servidor WebSocket.');
    });

    this.webSocket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });
  }

  requestBlockchain() {
    this.webSocket.send(JSON.stringify({ type: 'requestBlockchain' }));
    console.log('Solicitação de blockchain enviada ao servidor.');
  }

  validateAndSaveBlockchain(blockchainData) {
    try {
      const parsedData = JSON.parse(blockchainData);
      const blockchain = parsedData.chain;

      // Validação básica da blockchain
      for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];

        // Verifica o hash do bloco
        const calculatedHash = this.calculateHash(currentBlock);
        if (calculatedHash !== currentBlock.hash) {
          throw new Error(`Hash inválido no bloco ${currentBlock.index}`);
        }

        // Verifica o hash do bloco anterior
        if (currentBlock.previousHash !== previousBlock.hash) {
          throw new Error(`Hash do bloco anterior inválido no bloco ${currentBlock.index}`);
        }

        // Verifica o timestamp
        if (currentBlock.timestamp <= previousBlock.timestamp) {
          throw new Error(`Timestamp inválido no bloco ${currentBlock.index}`);
        }
      }

      // Salva a blockchain validada
      fs.writeFileSync(this.blockchainPath, blockchainData);
      console.log('Blockchain validada e salva com sucesso.');
    } catch (error) {
      console.error('Erro ao validar a blockchain:', error.message);
    }
  }

  calculateHash(block) {
    return crypto
      .createHash('sha256')
      .update(
        block.index +
        block.timestamp +
        JSON.stringify(block.transactions) +
        block.previousHash +
        block.nonce
      )
      .digest('hex');
  }
}

// Conecte-se ao servidor WebSocket
const node = new Node('ws://localhost:6001');