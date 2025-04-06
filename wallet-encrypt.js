const crypto = require('crypto');
const fs = require('fs');

// Função para criptografar a chave privada
function encryptPrivateKey(privateKeyHex, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(password).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKeyHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted; // IV + Encrypted Private Key
}

// Função para criptografar novamente as chaves privadas na carteira
function encryptWallet(password) {
  // Carregar o arquivo wallet.json
  const walletData = fs.readFileSync('wallet.json', 'utf8');
  const wallet = JSON.parse(walletData);

  // Criptografar novamente as chaves privadas
  wallet.keys.forEach(key => {
    const encryptedPrivKey = encryptPrivateKey(key.decrypted_privkey, password);
    key.encrypted_privkey = encryptedPrivKey; // Substitui a chave privada criptografada

    // Remover a chave privada descriptografada
    delete key.decrypted_privkey;
  });

  // Exibir as chaves privadas criptografadas
  console.log('Carteira com as chaves privadas criptografadas:', JSON.stringify(wallet, null, 2));

  // Sobrescrever o arquivo wallet.json com as chaves privadas criptografadas
  fs.writeFileSync('wallet.json', JSON.stringify(wallet, null, 2));
  console.log('Carteira sobrescrita com chaves privadas criptografadas');
}

// Chave de senha para criptografar as chaves privadas
const password = 'minhaSenhaForte!';
encryptWallet(password);
