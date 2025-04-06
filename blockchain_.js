const crypto = require('crypto');
const fs = require('fs'); // Usaremos o módulo `fs` para operações síncronas
const WebSocket = require('ws');
const secp256k1 = require('secp256k1');
const networkConfig = require('./networkConfig');
const BLOCK_TIME = networkConfig.BLOCK_TIME;
const directory =  networkConfig.DIRECTORY;

class Block {
  constructor(index, timestamp, transactions, previousHash = '', difficulty = networkConfig.INITIAL_DIFFICULTY) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.difficulty = difficulty; // Persistir a dificuldade no bloco
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.previousHash +
        this.nonce
      )
      .digest('hex');
  }
}

class Blockchain {
  constructor(webSocketServer) {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = networkConfig.INITIAL_DIFFICULTY; // Use a dificuldade da rede
    this.reward = networkConfig.INITIAL_REWARD; // Use a recompensa da rede
    this.totalSupply = 0;
    this.nodes = new Set();
    this.webSocketServer = webSocketServer;
    this.load();
  }

  createGenesisBlock() {
    return new Block(0, '01/01/2009', [], '0', networkConfig.INITIAL_DIFFICULTY);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  validateBlock(block) {
    const calculatedHash = block.calculateHash();
    if (calculatedHash !== block.hash) {
      console.log('Erro: O hash do bloco não é válido.');
      return false;
    }
    const previousBlock = this.chain[block.index - 1];
    if (previousBlock && block.previousHash !== previousBlock.hash) {
      console.log('Erro: O hash do bloco anterior não corresponde.');
      return false;
    }
    return true;
  }

  minePendingTransactions(minerAddress) {
      this.checkHalving();
      const rewardTransaction = new Transaction(null, minerAddress, this.reward);
      this.pendingTransactions.push(rewardTransaction);
      const latestBlock = this.getLatestBlock();
      const block = new Block(
        this.chain.length,
        Date.now(),
        this.pendingTransactions,
        latestBlock.hash,
        this.difficulty
      );
      console.log('Iniciando mineração do bloco...');
      block.hash = this.mineBlock(block);
      if (!this.validateBlock(block)) {
        console.log('Bloco inválido!');
        return;
      }
      this.chain.push(block);
      this.totalSupply += this.reward;
      this.pendingTransactions = [];
      if (!this.validateChain()) {
        console.log('A cadeia está inválida!');
        return;
      }
      console.log(`Bloco minerado por ${minerAddress}. Recompensa: ${this.reward} moedas.`);
      this.adjustDifficulty();
      this.save();
      // Broadcast do novo bloco via WebSocket
      if (this.webSocketServer && this.webSocketServer.broadcast) {
        this.webSocketServer.broadcast({ type: 'newBlock', block });
      } else {
        console.error('Servidor WebSocket não está disponível para broadcast.');
      }
  }

  checkHalving() {
    const blocksMined = this.chain.length - 1;
    const halvings = Math.floor(blocksMined / networkConfig.HALVING_INTERVAL);
    this.reward = networkConfig.INITIAL_REWARD / Math.pow(2, halvings);
    if (this.reward < 0.00000001) this.reward = 0;
  }

  mineBlock(block) {
    let hash;
    console.log(`Mineração iniciada com dificuldade: ${block.difficulty}`);
    do {
      block.nonce++;
      hash = block.calculateHash();
    } while (hash.substring(0, block.difficulty) !== Array(block.difficulty + 1).join('0'));
    console.log(`Bloco minerado! Nonce: ${block.nonce}, Hash: ${hash}`);
    return hash;
  }

  adjustDifficulty() {
    const latestBlock = this.getLatestBlock();
    const actualTime = Date.now() - latestBlock.timestamp;
    if (actualTime < networkConfig.BLOCK_TIME) {
      this.difficulty++; // Aumentar a dificuldade se o bloco foi minerado muito rápido
    } else if (actualTime > networkConfig.BLOCK_TIME) {
      this.difficulty--; // Diminuir a dificuldade se o bloco foi minerado muito devagar
    }
    console.log(`Dificuldade ajustada para: ${this.difficulty}`);
  }

save() {
  try {
    const dataToSave = {
      chain: this.chain.map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        transactions: block.transactions,
        previousHash: block.previousHash,
        hash: block.hash,
        nonce: block.nonce,
        difficulty: block.difficulty,
      })),
      pendingTransactions: this.pendingTransactions, // Salvar transações pendentes
    };
    fs.writeFileSync(directory+'blockchain.json', JSON.stringify(dataToSave, null, 2)); // Salvar sincronicamente
    console.log('Blockchain salva com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar a blockchain:', error);
  }
}


  load() {
    try {
      // Lê o arquivo blockchain.json sincronicamente
      const data = fs.readFileSync(directory+'blockchain.json', 'utf8');
      if (!data.trim()) {
        throw new Error('Arquivo blockchain.json está vazio.');
      }
      // Analisa os dados JSON
      const parsedData = JSON.parse(data);
      // Verifica se os dados são válidos
      if (Array.isArray(parsedData.chain) && Array.isArray(parsedData.pendingTransactions)) {
        // Carrega a cadeia de blocos usando map e Object.assign
        this.chain = parsedData.chain.map(blockData => {
          const block = Object.assign(new Block(), blockData);
          if (!this.validateBlock(block)) {
            throw new Error(`Bloco inválido no índice ${blockData.index}`);
          }
          return block;
        });
        // Carrega as transações pendentes
        this.pendingTransactions = parsedData.pendingTransactions.map(txData => {
          return Object.assign(new Transaction(), txData);
        });
        // Atualiza a dificuldade com base no último bloco carregado
        this.difficulty = this.chain[this.chain.length - 1]?.difficulty || networkConfig.INITIAL_DIFFICULTY;
      } else {
        console.log('Dados inválidos no arquivo blockchain.json. Usando dados padrão.');
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
      }
    } catch (error) {
      console.log('Erro ao carregar blockchain:', error.message);
      this.chain = [this.createGenesisBlock()];
      this.pendingTransactions = [];
    }
    // Calcula o totalSupply com base nas transações da blockchain
    this.totalSupply = this.chain.reduce((acc, block) => {
      return acc + block.transactions.reduce((txAcc, tx) => txAcc + (tx.amount || 0), 0);
    }, 0);
  }


  validateChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (currentBlock.timestamp <= previousBlock.timestamp) {
        console.log('Erro: Timestamps fora de ordem.');
        return false;
      }
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log('Erro: Hash do bloco inválido.');
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log('Erro: Hash do bloco anterior não corresponde.');
        return false;
      }
    }
    return true;
  }


  sendTransaction(from, to, amount, privateKeyArray) {
  const amountInSatoshis = Math.round(amount * 1e8); // Converte para satoshis
  // console.log(amountInSatoshis);
  if (amountInSatoshis < 1) {
    console.log('Erro: O valor mínimo para uma transação é 0.00000001 BTC.');
    return false;
  }
  if (!this.hasSufficientFunds(from, amountInSatoshis / 1e8)) {
    console.log("Saldo insuficiente para a transação");
    return false;
  }
  const transaction = this.createTransaction(from, to, amountInSatoshis / 1e8, privateKeyArray);
  if (!transaction.isValid(privateKeyArray)) {
    console.log("Transação inválida");
    return false;
  }
  this.pendingTransactions.push(transaction);
  console.log(`Transação de ${amountInSatoshis / 1e8} moedas de ${from} para ${to} realizada com sucesso.`);
  this.save(); // Salvar blockchain após adicionar a transação
  return true;
}

  hasSufficientFunds(from, amount) {
    // console.log(this.chain);
    let balance = 0;
    for (let block of this.chain) {
      // console.log('block:', block);
      // console.log('block_transiction:' + block.transactions);
      for (let tx of block.transactions) {
        // console.log(block.transactions);
        if (tx.from === from) balance -= tx.amount;
        if (tx.to === from) balance += tx.amount;
      }
    }
    console.log(balance, amount);
    return balance >= amount;
  }

  createTransaction(from, to, amount, privateKey) {
    const transaction = new Transaction(from, to, amount);
    transaction.signTransaction(privateKey);
    return transaction;
  }
}

class Transaction {
  constructor(from, to, amount, signature = null) {
    this.from = from || 'COINBASE';
    this.to = to;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = signature;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.from + this.to + this.amount + this.timestamp)
      .digest('hex');
  }

  signTransaction(privateKey) {
    const message = this.from + this.to + this.amount + this.timestamp;
    const messageHash = crypto.createHash('sha256').update(message).digest();
    if (privateKey.length !== 32) throw new Error('A chave privada deve ter exatamente 32 bytes.');
    const { signature } = secp256k1.ecdsaSign(messageHash, privateKey);
    this.signature = Buffer.from(signature).toString('hex');
  }

  isValid(privateKey) {
    if (this.from === 'COINBASE') return true;
    const message = this.from + this.to + this.amount + this.timestamp;
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const publicKey = secp256k1.publicKeyCreate(privateKey);
    return secp256k1.ecdsaVerify(Buffer.from(this.signature, 'hex'), messageHash, publicKey);
  }
}

module.exports = { Blockchain, Transaction, BLOCK_TIME, directory };