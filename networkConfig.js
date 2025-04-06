module.exports = {
  MAX_SUPPLY: 21000000,
  HALVING_INTERVAL: 210000,
  BLOCK_TIME: 10000, // 4 segundos para testes (10 minutos em produção)
  INITIAL_REWARD: 50,
  INITIAL_DIFFICULTY: 4, // Dificuldade inicial
  DIRECTORY: './blockchain/'
};

// const networkConfig = {
//   BLOCK_TIME: 10000, // 10 segundos
//   INITIAL_DIFFICULTY: 2, // Dificuldade inicial mais baixa
//   INITIAL_REWARD: 50,
//   HALVING_INTERVAL: 210000,
// };