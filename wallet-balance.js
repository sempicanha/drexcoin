const fs = require('fs');
const { loadWallet } = require('./wallet-open.js');
const blockchain = require('./blockchain.js'); // Supondo que você tenha um arquivo blockchain.js com a implementação da blockchain

// Função para carregar a carteira
function loadWallet() {
  if (fs.existsSync('wallet.dat')) {
    const data = fs.readFileSync('wallet.dat');
    return JSON.parse(data);
  } else {
    console.log('Carteira não encontrada.');
    return null;
  }
}

// Função para calcular o saldo de um endereço
function getBalance(address) {
  const blockchainInstance = new blockchain();
  blockchainInstance.load();
  
  let balance = 0;
  
  // Verifica todas as transações na blockchain
  blockchainInstance.chain.forEach(block => {
    block.transactions.forEach(tx => {
      if (tx.to === address) balance += tx.amount;
      if (tx.from === address) balance -= tx.amount;
    });
  });

  return balance;
}

// Solicita ao usuário um endereço e verifica o saldo
const wallet = loadWallet();
if (wallet) {
  console.log('Digite o número do endereço para verificar o saldo:');
  wallet.addresses.forEach((address, index) => {
    console.log(`Endereço ${index + 1}: ${address.address}`);
  });

  // Exemplo de um endereço para verificar
  const addressToCheck = wallet.addresses[0].address; // Verificando o primeiro endereço
  const balance = getBalance(addressToCheck);
  console.log(`Saldo do endereço ${addressToCheck}: ${balance} BTC`);
} else {
  console.log('Não foi possível carregar a carteira.');
}
