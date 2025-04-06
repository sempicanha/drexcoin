const { Blockchain, BLOCK_TIME, directory } = require('./blockchain');
const crypto = require('crypto');
const fs = require('fs').promises;

// Função para descriptografar a chave privada
async function decryptPrivateKey(encryptedPrivateKeyHex, password) {
  const ivHex = encryptedPrivateKeyHex.slice(0, 32);
  const encryptedPrivKey = encryptedPrivateKeyHex.slice(32);
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(password).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedPrivKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Função para validar a assinatura de uma transação
function validateTransaction(transaction, publicKey) {
  if (!transaction.signature) return false;

  const verifier = crypto.createVerify('SHA256');
  verifier.update(
    JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
    })
  );
  verifier.end();
  return verifier.verify(publicKey, transaction.signature, 'hex');
}

// Função para calcular o saldo de um endereço na blockchain
function calculateBalance(address, blockchain) {
  let balance = 0;

  blockchain.chain.forEach(block => {
    block.transactions.forEach(transaction => {
      // Incrementar saldo ao receber
      if (transaction.to === address) {
        balance += parseFloat(transaction.amount); // Garantir que o valor é numérico
      }

      // Decrementar saldo ao enviar
      if (transaction.from === address) {
        balance -= parseFloat(transaction.amount); // Garantir que o valor é numérico
      }
    });
  });

  return balance;
}

// Função para carregar e validar a carteira com a blockchain
async function syncWallet(password, walletName) {
  try {
    // Carregar wallet.json e descriptografar as chaves privadas
    const walletData = await fs.readFile(walletName + '.json', 'utf8');
    const wallet = JSON.parse(walletData);

    const blockchainData = await fs.readFile(directory+'blockchain.json', 'utf8');
    const blockchain = JSON.parse(blockchainData);

    for (let key of wallet.keys) {
      const decryptedPrivKey = await decryptPrivateKey(key.encrypted_privkey, password);
      key.decrypted_privkey = decryptedPrivKey;

      if (decryptedPrivKey) {
        console.log(`Chave privada descriptografada para o endereço ${key.addr}`);
      } else {
        console.error(`Erro ao descriptografar a chave privada do endereço ${key.addr}`);
        continue;
      }

      // Validar chaves e atualizar saldo
      const balance = calculateBalance(key.addr, blockchain);
      key.balance = balance.toFixed(8); // Exibir saldo com 8 casas decimais
      console.log(`Saldo do endereço ${key.addr}: ${key.balance}`);
    }

    // Salvar wallet sincronizada
    await fs.writeFile(walletName + '.json', JSON.stringify(wallet, null, 2));
    console.log('Carteira sincronizada com sucesso.');

  } catch (error) {
    console.error("Erro ao sincronizar a carteira:", error.message);
  }
}

// Iniciar a sincronização
const password = 'minhaSenhaForte!';
syncWallet(password, 'wallet2');
