// Script para gerar hash de senha usando bcrypt
// Execute: node scripts/gerar-hash-senha.js

const bcrypt = require('bcrypt');

// Altere a senha aqui
const senha = 'admin123';

bcrypt.hash(senha, 10)
  .then(hash => {
    console.log('\n=================================');
    console.log('Hash gerado com sucesso!');
    console.log('=================================');
    console.log('\nSenha:', senha);
    console.log('Hash:', hash);
    console.log('\nUse este hash no SQL:');
    console.log(`'${hash}'`);
    console.log('\n=================================\n');
  })
  .catch(err => {
    console.error('Erro ao gerar hash:', err);
  });
