const crypto = require('crypto');
const fs = require('fs');

// Função para descriptografar a chave privada
function decryptPrivateKey(encryptedPrivateKeyHex, password) {
  const ivHex = encryptedPrivateKeyHex.slice(0, 32); // IV é os primeiros 16 bytes (32 caracteres hexadecimais)
  const encryptedPrivKey = encryptedPrivateKeyHex.slice(32); // O restante é a chave privada criptografada
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(password).digest(); // Gerar a chave de criptografia usando a senha
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedPrivKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted; // Retorna a chave privada original
}

// Função para carregar a carteira e descriptografar as chaves privadas
function decryptWallet(password) {
  // Carregar o arquivo wallet.json
  const walletData = fs.readFileSync('wallet.json', 'utf8');
  const wallet = JSON.parse(walletData);

  // Descriptografar as chaves privadas
  wallet.keys.forEach(key => {
    const decryptedPrivKey = decryptPrivateKey(key.encrypted_privkey, password);
    key.decrypted_privkey = decryptedPrivKey; // Adiciona a chave privada descriptografada ao objeto

    // Verificar se a chave foi de fato descriptografada
    if (decryptedPrivKey) {
      console.log(`Chave privada descriptografada para o endereço ${key.addr}: ${decryptedPrivKey}`);
    } else {
      console.log(`Falha ao descriptografar chave para o endereço ${key.addr}`);
    }
  });

  // Exibir as chaves privadas descriptografadas
  console.log('Carteira com as chaves privadas descriptografadas:', JSON.stringify(wallet, null, 2));

  // Sobrescrever a carteira com as chaves privadas descriptografadas
  fs.writeFileSync('wallet.json', JSON.stringify(wallet, null, 2));
  console.log('Carteira sobrescrita com chaves privadas descriptografadas');

  return wallet;
}

// Chave de senha para descriptografar as chaves privadas
const password = 'minhaSenhaForte!';
decryptWallet(password);
