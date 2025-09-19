#!/usr/bin/env node

const crypto = require('crypto');

// Gera uma chave AES-256 de 32 bytes
const key = crypto.randomBytes(32);
const base64Key = key.toString('base64');

console.log('🔑 Chave de criptografia gerada:');
console.log('');
console.log(`CERT_ENCRYPTION_KEY=${base64Key}`);
console.log('');
console.log('Copie esta linha para o seu arquivo .env.local');
console.log('');
console.log('⚠️  IMPORTANTE: Mantenha esta chave segura e não a compartilhe!');
console.log('   Se você perder esta chave, não conseguirá descriptografar certificados já armazenados.');
