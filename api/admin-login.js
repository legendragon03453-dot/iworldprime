// api/admin-login.js
// Autenticação do painel administrativo.
//
// Por que existe: até aqui o login era feito no navegador, comparando a senha
// (depois o hash dela) contra um valor escrito no próprio admin-login.html.
// Como esse arquivo é público, o hash era legível por qualquer pessoa — e o
// proxy aceitava esse mesmo hash como token de escrita. Ou seja, ler a página
// dava acesso total à loja, sem precisar da senha. Foi assim que invadiram.
//
// Agora: a senha nunca sai do servidor, e o que o navegador guarda é um token
// assinado com um segredo que só existe nas variáveis de ambiente da Vercel.
// Ler o HTML não ajuda em nada, e o token expira.

import crypto from 'crypto';

const VALIDADE_HORAS = 12;

function pbkdf2(senha, salHex) {
  return crypto.pbkdf2Sync(senha, Buffer.from(salHex, 'hex'), 120000, 32, 'sha256').toString('hex');
}

// Comparação em tempo constante: `===` vaza informação pelo tempo de resposta
// e permite descobrir o segredo byte a byte.
function igual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function assinarToken(payload, segredo) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const assinatura = crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');
  return `${corpo}.${assinatura}`;
}

export function validarToken(token, segredo) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [corpo, assinatura] = token.split('.');
  const esperada = crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');
  if (!igual(assinatura, esperada)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    if (!dados.exp || Date.now() > dados.exp) return null;   // expirado
    return dados;
  } catch {
    return null;
  }
}

// Monta a lista de administradores a partir do ambiente. O primeiro slot usa
// ADMIN_EMAIL/SAL/HASH; os demais usam ADMIN_EMAIL_2/SAL_2/HASH_2, _3, _4...
// Assim dá para ter vários admins sem tocar no código — basta cadastrar as
// variáveis. Cada admin tem o próprio salt (por isso o hash é por slot).
function listarAdmins(env) {
  const admins = [];
  const add = (email, sal, hash) => {
    if (email && sal && hash) admins.push({ email: email.trim().toLowerCase(), sal, hash });
  };
  add(env.ADMIN_EMAIL, env.ADMIN_SAL, env.ADMIN_HASH);
  for (let i = 2; i <= 8; i++) {
    add(env[`ADMIN_EMAIL_${i}`], env[`ADMIN_SAL_${i}`], env[`ADMIN_HASH_${i}`]);
  }
  return admins;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { ADMIN_SESSAO_SECRET } = process.env;
  const admins = listarAdmins(process.env);
  if (admins.length === 0 || !ADMIN_SESSAO_SECRET) {
    console.error('[admin-login] variáveis de ambiente ausentes');
    return res.status(500).json({ error: 'Login mal configurado' });
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(corpo.email || '').trim().toLowerCase();
  const senha = String(corpo.senha || '');

  // Percorre TODOS os slots sempre (sem parar no primeiro acerto) para não
  // vazar por tempo quais contas existem. Cada slot tem salt próprio, então o
  // hash é recalculado por slot.
  let autenticado = false;
  for (const a of admins) {
    const hash = pbkdf2(senha, a.sal);
    if (igual(email, a.email) && igual(hash, a.hash)) autenticado = true;
  }

  if (!autenticado) {
    // Mensagem genérica: não dizer qual dos dois errou.
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }

  const token = assinarToken({
    sub: email,
    role: 'ceo',
    exp: Date.now() + VALIDADE_HORAS * 3600 * 1000
  }, ADMIN_SESSAO_SECRET);

  return res.status(200).json({
    token,
    nome: 'Administrador',
    role: 'ceo',
    expiraEm: VALIDADE_HORAS * 3600 * 1000
  });
}
