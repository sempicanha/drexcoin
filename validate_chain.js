const { Blockchain } = require('./blockchain');

const blockchain = new Blockchain();
if (blockchain.validateChain()) {
  console.log("A cadeia está válida!");
} else {
  console.log("A cadeia está inválida!");
}
