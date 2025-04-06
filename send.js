const { Blockchain, Transaction } = require('./blockchain');

// Inicializa a blockchain
const blockchain = new Blockchain();

// Endereço de origem e destino
const senderAddress = '4FuvGvnrJvgZDVQAJaduKoDhQtxd';  // Endereço de envio
const receiverAddress = '3ejB1zqRAx7q2YqsQr14K8yYKTfU';  // Endereço de recebimento

// Sua chave privada hexadecimal de 64 caracteres
const hexPrivateKey = '48d67acb1a5043424a9dc3e75ef67132a52ca25ea83174420715117d0603f04c';

// Converte a chave hexadecimal para um Uint8Array (32 bytes)
const privateKeyArray = new Uint8Array(Buffer.from(hexPrivateKey, 'hex'));

console.log('Comprimento da chave privada:', privateKeyArray.length);  // Para depuração

// Verifica se a chave privada tem exatamente 32 bytes
if (privateKeyArray.length !== 32) {
  throw new Error('A chave privada deve ter exatamente 32 bytes.');
}

// Valor a ser transferido
const amountToSend =    0.000000010;  // Exemplo: 10 moedas
// const amountToSend = 0.00000001;  // Enviar 1 satoshi (fração mínima de Bitcoin)

// Envia a transação
blockchain.sendTransaction(senderAddress, receiverAddress, amountToSend, privateKeyArray);  // Passa privateKeyArray


