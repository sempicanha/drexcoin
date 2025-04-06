const { Blockchain, BLOCK_TIME } = require('./blockchain');
const WebSocket = require('ws');

class Miner {
  constructor(blockchain, minerAddress, webSocketServer) {
    this.blockchain = blockchain;
    this.minerAddress = minerAddress;
    this.webSocketServer = webSocketServer;
  }

  // startMining() {
  //   setInterval(() => {
  //     if (this.blockchain.pendingTransactions.length > 0) {
  //       this.blockchain.minePendingTransactions(this.minerAddress);
  //     }
  //   }, BLOCK_TIME);
  // }

  startMining() {
  setInterval(() => {
    if (this.blockchain.chain.length === 1 && this.blockchain.pendingTransactions.length === 0) {
      console.log('Apenas o bloco gênesis existe. Iniciando mineração automática...');
      this.blockchain.minePendingTransactions(this.minerAddress);
    } else if (this.blockchain.pendingTransactions.length > 0) {
      console.log('Transações pendentes encontradas. Iniciando mineração...');
      this.blockchain.minePendingTransactions(this.minerAddress);
    } else {
      console.log('Nenhuma transação pendente para minerar.');
    }
  }, 5000); // Verifica a cada 5 segundos
}
}

module.exports = Miner;