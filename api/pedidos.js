// Listagem de PEDIDOS para o painel admin.
//
// Os pedidos contêm dados pessoais (nome, telefone, endereço), então só podem
// ser lidos pelo servidor com a service_role — nunca com a chave publishable.
// Duas travas: origem da loja + token de sessão de admin válido.

import { validarToken } from './admin-login.js';

const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co';

const ORIGENS_PERMITIDAS = [
  'https://i-world-prime.vercel.app',
  'https://www.iworldprime.com.br',
  'https://iworldprime.com.br'
];
const PADRAO_PREVIEW = /^https:\/\/i-world-prime-[a-z0-9-]+\.vercel\.app$/;
function origemPermitida(o) { return !!o && (ORIGENS_PERMITIDAS.includes(o) || PADRAO_PREVIEW.test(o)); }

export default async function handler(req, res) {
  const origem = req.headers.origin;
  const referer = req.headers.referer || '';
  const chamador = origem || (referer ? new URL(referer).origin : null);
  if (!origemPermitida(chamador)) return res.status(403).json({ error: 'Origem não autorizada' });

  res.setHeader('Access-Control-Allow-Origin', chamador);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token, X-Pedido-Id');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const segredo = process.env.ADMIN_SESSAO_SECRET;
  if (!KEY || !segredo) {
    console.error('[Pedidos] env ausente');
    return res.status(500).json({ error: 'Mal configurado' });
  }
  const sessao = validarToken(req.headers['x-admin-token'], segredo);
  if (!sessao) return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });

  const auth = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?select=*&order=criado_em.desc`, { headers: auth });
      const texto = await r.text();
      let data; try { data = texto ? JSON.parse(texto) : []; } catch { data = []; }
      return res.status(r.status).json({ data });
    }
    if (req.method === 'PATCH') {
      // Permite ao admin mudar o status do pedido (ex.: marcar como enviado).
      const id = req.headers['x-pedido-id'];
      if (!id || !/^[A-Za-z0-9-]+$/.test(id)) return res.status(400).json({ error: 'Pedido inválido' });
      let corpo = req.body; if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
      const upd = {};
      if (typeof corpo.status === 'string') upd.status = corpo.status;
      if (!Object.keys(upd).length) return res.status(400).json({ error: 'Nada para atualizar' });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...auth, Prefer: 'return=minimal' }, body: JSON.stringify(upd)
      });
      return res.status(r.status).json({ ok: r.ok });
    }
    return res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    console.error('[Pedidos] falha:', err);
    return res.status(502).json({ error: 'Falha ao consultar pedidos' });
  }
}
