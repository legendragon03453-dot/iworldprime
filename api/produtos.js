// Escrita administrativa de produtos no Supabase.
//
// A leitura dos produtos acontece direto no navegador com a chave PUBLISHABLE
// (RLS só deixa ler publicados). Já a ESCRITA (criar/editar/excluir) precisa
// ignorar o RLS, e para isso usa a service_role — que NUNCA pode ir para o
// navegador. Por isso ela vive só aqui, em process.env.SUPABASE_SERVICE_KEY.
//
// Duas travas, como no antigo proxy:
//   1. Só a própria loja chama (checagem de origem).
//   2. Só com token de sessão de admin válido (assinado pelo servidor).

import { validarToken } from './admin-login.js';

const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co';

const ORIGENS_PERMITIDAS = [
  'https://i-world-prime.vercel.app',
  'https://www.iworldprime.com.br',
  'https://iworldprime.com.br'
];
const PADRAO_PREVIEW = /^https:\/\/i-world-prime-[a-z0-9-]+\.vercel\.app$/;

function origemPermitida(origem) {
  if (!origem) return false;
  return ORIGENS_PERMITIDAS.includes(origem) || PADRAO_PREVIEW.test(origem);
}

// Só o recurso de produtos. Barra travessia de caminho e URLs absolutas.
function parseEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) return null;
  if (endpoint.includes('..') || endpoint.includes('//')) return null;
  const caminho = endpoint.split('?')[0];
  if (caminho === '/produtos') return { id: null };
  const m = caminho.match(/^\/produtos\/([A-Za-z0-9-]+)$/);
  if (m) return { id: m[1] };
  return null;
}

export default async function handler(req, res) {
  const origem = req.headers.origin;
  const referer = req.headers.referer || '';
  const origemDoReferer = referer ? new URL(referer).origin : null;
  const chamador = origem || origemDoReferer;

  if (!origemPermitida(chamador)) {
    return res.status(403).json({ error: 'Origem não autorizada' });
  }

  res.setHeader('Access-Control-Allow-Origin', chamador);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Produtos-Endpoint, X-Admin-Token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY) {
    console.error('[Produtos] SUPABASE_SERVICE_KEY não configurada no ambiente');
    return res.status(500).json({ error: 'Escrita mal configurada' });
  }

  // Toda escrita exige sessão de admin válida.
  const segredo = process.env.ADMIN_SESSAO_SECRET;
  if (!segredo) {
    console.error('[Produtos] ADMIN_SESSAO_SECRET ausente');
    return res.status(500).json({ error: 'Escrita mal configurada' });
  }
  const sessao = validarToken(req.headers['x-admin-token'], segredo);
  if (!sessao) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }

  const alvo = parseEndpoint(req.headers['x-produtos-endpoint'] || '');
  if (!alvo) {
    return res.status(403).json({ error: 'Endpoint não permitido' });
  }

  const authHeaders = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };

  let corpo = req.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }

  try {
    let url, options;
    if (req.method === 'GET') {
      // Lista TODAS as linhas (publicadas e rascunhos) para o painel admin —
      // o RLS/anon só mostraria as publicadas, por isso passa pela service_role.
      if (alvo.id) {
        url = `${SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(alvo.id)}&select=*`;
      } else {
        url = `${SUPABASE_URL}/rest/v1/produtos`
          + `?select=id,nome,descricao,preco,categoria,subcategoria,imagem,tags,slug,status,ordem`
          + `&order=categoria.asc,nome.asc,preco.asc`;
      }
      options = { method: 'GET', headers: authHeaders };
    } else if (req.method === 'POST') {
      if (alvo.id) return res.status(405).json({ error: 'POST é só em /produtos' });
      url = `${SUPABASE_URL}/rest/v1/produtos`;
      options = { method: 'POST', headers: authHeaders, body: JSON.stringify(corpo) };
    } else if (req.method === 'PATCH') {
      if (!alvo.id) return res.status(405).json({ error: 'PATCH precisa de id' });
      url = `${SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(alvo.id)}`;
      options = { method: 'PATCH', headers: authHeaders, body: JSON.stringify(corpo) };
    } else if (req.method === 'DELETE') {
      if (!alvo.id) return res.status(405).json({ error: 'DELETE precisa de id' });
      url = `${SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(alvo.id)}`;
      options = { method: 'DELETE', headers: authHeaders };
    } else {
      return res.status(405).json({ error: 'Método não suportado' });
    }

    const r = await fetch(url, options);
    const texto = await r.text();
    let data; try { data = texto ? JSON.parse(texto) : null; } catch { data = texto; }
    return res.status(r.status).json({ data });
  } catch (err) {
    console.error('[Produtos] Falha ao escrever no Supabase:', err);
    return res.status(502).json({ error: 'Falha ao gravar no banco' });
  }
}
