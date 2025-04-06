const crypto = require('crypto');
const fs = require('fs');

// Função para gerar chave privada
function generatePrivateKey() {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes para chave privada
}

// Função para gerar chave pública a partir da chave privada
function generatePublicKey(privateKeyHex) {
  const ecdsa = crypto.createECDH('secp256k1');
  ecdsa.setPrivateKey(Buffer.from(privateKeyHex, 'hex'));
  return ecdsa.getPublicKey('hex');
}

// Função para criptografar a chave privada
function encryptPrivateKey(privateKeyHex, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(password).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKeyHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted; // IV + Encrypted Private Key
}

// Função para gerar um endereço a partir da chave pública
function generateAddress(publicKeyHex) {
  const sha256 = crypto.createHash('sha256').update(Buffer.from(publicKeyHex, 'hex')).digest();
  const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest();
  return base58Encode(ripemd160);
}

// Função para codificar em Base58
function base58Encode(buffer) {
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + buffer.toString('hex'));
  let encoded = '';
  while (num > 0) {
    const remainder = num % BigInt(58);
    encoded = BASE58_ALPHABET[Number(remainder)] + encoded;
    num = num / BigInt(58);
  }
  for (let i = 0; buffer[i] === 0 && i < buffer.length; i++) {
    encoded = BASE58_ALPHABET[0] + encoded;
  }
  return encoded;
}

// Função para gerar a carteira
function generateWallet(password) {
  const wallet = {
    "defaultkey": "18B7FuVWgoc1WVG2yeo21q7Aj14DUHWiAt",
    "destdata": "unsupported",
    "keymeta": "unsupported",
    "keys": [],
    "address": []
  };

  for (let i = 0; i < 5; i++) {
    const privateKey = generatePrivateKey();
    const publicKey = generatePublicKey(privateKey);
    const encryptedPrivKey = encryptPrivateKey(privateKey, password);
    const address = generateAddress(publicKey);

    wallet.keys.push({
      "addr": address,
      "compressed": true,
      "encrypted_privkey": encryptedPrivKey,
      "pubkey": publicKey,
      "reserve": 1
    });

    wallet.address.push({
      "addr": address,
      "balance": 0.00000 // Placeholder, o saldo será atualizado futuramente com base na blockchain
    });
  }

  // Salvar a carteira no arquivo wallet.json
  fs.writeFileSync('wallet2.json', JSON.stringify(wallet, null, 2));
  console.log('Carteira salva em wallet.json');
}

// Chave de senha para criptografar as chaves privadas
const password = 'minhaSenhaForte!';
generateWallet(password);
