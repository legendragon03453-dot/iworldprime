// scripts/gerar-admin.js
// Gera o SAL e o HASH de uma senha de administrador, no mesmo formato que
// api/admin-login.js confere (PBKDF2-SHA256, 120000 iterações, 32 bytes).
//
// Uso:  node scripts/gerar-admin.js "minha-senha-forte"
// Depois cadastre ADMIN_EMAIL, ADMIN_SAL e ADMIN_HASH na Vercel e faça redeploy.
// A senha em si não vai para lugar nenhum: só o sal e o hash.

const crypto = require('crypto');

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: node scripts/gerar-admin.js "senha"');
  process.exit(1);
}

const sal = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(senha, Buffer.from(sal, 'hex'), 120000, 32, 'sha256').toString('hex');

console.log(`ADMIN_SAL=${sal}`);
console.log(`ADMIN_HASH=${hash}`);
