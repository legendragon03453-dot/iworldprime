// MARKETING: cupons de desconto + desconto Pix.
//
// Segurança em camadas (igual pedidos.js):
//   - Leitura pública (validar um cupom / ler o % do Pix): só precisa vir da
//     própria loja (origem confiável). Roda no servidor com a service_role,
//     então o código do cupom nunca é exposto em massa e o RLS fica fechado.
//   - Gestão (listar todos, criar, editar, excluir, mudar o % do Pix): exige
//     TOKEN de admin válido, além da origem.
//
// Também exporta helpers usados pelo checkout (mercadopago.js) para RE-VALIDAR
// o cupom e aplicar o desconto no servidor — o cliente nunca dita o desconto.

import { validarToken } from './admin-login.js';

const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co';

const ORIGENS_PERMITIDAS = [
  'https://i-world-prime.vercel.app',
  'https://www.iworldprime.com.br',
  'https://iworldprime.com.br'
];
const PADRAO_PREVIEW = /^https:\/\/i-world-prime-[a-z0-9-]+\.vercel\.app$/;
function origemPermitida(o) { return !!o && (ORIGENS_PERMITIDAS.includes(o) || PADRAO_PREVIEW.test(o)); }

function authHeaders() {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

// ---- Helpers reaproveitados pelo checkout ----

// Busca um cupom pelo código (case-insensitive). Retorna a linha ou null.
export async function buscarCupom(codigo) {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY || !codigo) return null;
  const cod = String(codigo).trim().toUpperCase();
  if (!cod) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(cod)}&select=*&limit=1`;
    const r = await fetch(url, { headers: authHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) && d[0] ? d[0] : null;
  } catch { return null; }
}

// Avalia um cupom já buscado contra um subtotal. Devolve o desconto em R$ e o
// motivo caso não valha.
export function avaliarCupom(cupom, subtotal) {
  if (!cupom) return { valido: false, motivo: 'Cupom não encontrado', desconto: 0 };
  if (!cupom.ativo) return { valido: false, motivo: 'Cupom inativo', desconto: 0 };
  if (cupom.validade) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const val = new Date(cupom.validade + 'T23:59:59');
    if (val < hoje) return { valido: false, motivo: 'Cupom expirado', desconto: 0 };
  }
  const min = Number(cupom.min_compra) || 0;
  if (subtotal < min) {
    return { valido: false, motivo: `Válido para compras acima de R$ ${min.toLocaleString('pt-BR')}`, desconto: 0 };
  }
  const valor = Number(cupom.valor) || 0;
  let desconto = cupom.tipo === 'fixo' ? valor : (subtotal * valor) / 100;
  desconto = Math.min(desconto, subtotal);
  desconto = Math.round(desconto * 100) / 100;
  return { valido: true, motivo: '', desconto, tipo: cupom.tipo, valor };
}

// Lê o desconto Pix (%) da tabela de configurações. Default 10.
export async function lerDescontoPix() {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY) return 10;
  try {
    const url = `${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.desconto_pix&select=valor&limit=1`;
    const r = await fetch(url, { headers: authHeaders() });
    if (!r.ok) return 10;
    const d = await r.json();
    const v = Array.isArray(d) && d[0] ? parseFloat(d[0].valor) : NaN;
    return Number.isFinite(v) && v >= 0 && v <= 90 ? v : 10;
  } catch { return 10; }
}

// Lê o valor bruto (string) de uma chave da tabela de configurações, ou null.
async function lerConfigValor(chave) {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.${encodeURIComponent(chave)}&select=valor&limit=1`;
    const r = await fetch(url, { headers: authHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) && d[0] ? d[0].valor : null;
  } catch { return null; }
}

// Salva (upsert) uma chave de configuração.
async function salvarConfig(chave, valor) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.${encodeURIComponent(chave)}`, {
    method: 'PATCH', headers: { ...authHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ valor: String(valor), atualizado_em: new Date().toISOString() })
  });
  let d = []; try { d = await r.json(); } catch {}
  if (!Array.isArray(d) || d.length === 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {
      method: 'POST', headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ chave, valor: String(valor) })
    });
  }
}

// Incrementa o contador de usos (chamado após pagamento aprovado, se quiser).
export async function registrarUsoCupom(id) {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY || !id) return;
  try {
    const g = await fetch(`${SUPABASE_URL}/rest/v1/cupons?id=eq.${encodeURIComponent(id)}&select=usos`, { headers: authHeaders() });
    const d = await g.json();
    const atual = Array.isArray(d) && d[0] ? (Number(d[0].usos) || 0) : 0;
    await fetch(`${SUPABASE_URL}/rest/v1/cupons?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...authHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ usos: atual + 1 })
    });
  } catch {}
}

// ---- Handler HTTP ----

export default async function handler(req, res) {
  const origem = req.headers.origin;
  const referer = req.headers.referer || '';
  const chamador = origem || (referer ? new URL(referer).origin : null);
  if (!origemPermitida(chamador)) return res.status(403).json({ error: 'Origem não autorizada' });

  res.setHeader('Access-Control-Allow-Origin', chamador);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const segredo = process.env.ADMIN_SESSAO_SECRET;
  if (!KEY) return res.status(500).json({ error: 'Mal configurado' });

  const ehAdmin = !!(segredo && validarToken(req.headers['x-admin-token'], segredo));
  const q = req.query || {};

  try {
    // ---------- Rotas PÚBLICAS (sem admin) ----------
    // Ler o % de desconto do Pix (a loja usa para exibir o preço no Pix).
    if (req.method === 'GET' && (q.config === '1' || q.config === 'pix')) {
      const pix = await lerDescontoPix();
      return res.status(200).json({ desconto_pix: pix });
    }
    // Ler a tabela de avaliação de troca (simulador). Público.
    if (req.method === 'GET' && q.config === 'avaliacao') {
      const raw = await lerConfigValor('avaliacao_troca');
      let arr = null; try { arr = raw ? JSON.parse(raw) : null; } catch { arr = null; }
      return res.status(200).json({ avaliacao_troca: Array.isArray(arr) ? arr : null });
    }
    // Validar um cupom digitado pelo cliente.
    if (req.method === 'GET' && q.codigo && !ehAdmin) {
      const subtotal = Number(q.subtotal) || 0;
      const cupom = await buscarCupom(q.codigo);
      const r = avaliarCupom(cupom, subtotal);
      if (!r.valido) return res.status(200).json({ valido: false, motivo: r.motivo });
      return res.status(200).json({
        valido: true, codigo: cupom.codigo, tipo: r.tipo, valor: r.valor,
        desconto: r.desconto, descricao: cupom.descricao || ''
      });
    }

    // ---------- Rotas de ADMIN ----------
    if (!ehAdmin) return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });

    // Mudar o % de desconto do Pix.
    if (req.method === 'PATCH' && (q.config === '1' || q.config === 'pix')) {
      let corpo = req.body; if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
      let v = parseFloat(corpo.desconto_pix);
      if (!Number.isFinite(v) || v < 0 || v > 90) return res.status(400).json({ error: 'Percentual inválido (0 a 90)' });
      v = Math.round(v * 100) / 100;
      await salvarConfig('desconto_pix', v);
      return res.status(200).json({ ok: true, desconto_pix: v });
    }

    // Salvar a tabela de avaliação de troca (simulador).
    if (req.method === 'PATCH' && q.config === 'avaliacao') {
      let corpo = req.body; if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
      const arr = Array.isArray(corpo.avaliacao_troca) ? corpo.avaliacao_troca : null;
      if (!arr) return res.status(400).json({ error: 'Envie a lista de avaliação' });
      const limpo = arr
        .map(x => ({ modelo: String(x.modelo || '').trim().slice(0, 60), valor: Math.max(0, Math.round(parseFloat(x.valor) || 0)) }))
        .filter(x => x.modelo);
      await salvarConfig('avaliacao_troca', JSON.stringify(limpo));
      return res.status(200).json({ ok: true, total: limpo.length });
    }

    // Listar TODOS os cupons.
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cupons?select=*&order=criado_em.desc`, { headers: authHeaders() });
      const texto = await r.text();
      let data; try { data = texto ? JSON.parse(texto) : []; } catch { data = []; }
      return res.status(r.status).json({ data });
    }

    // Criar cupom.
    if (req.method === 'POST') {
      let corpo = req.body; if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
      const cupom = montarCupom(corpo);
      if (cupom.erro) return res.status(400).json({ error: cupom.erro });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cupons`, {
        method: 'POST', headers: { ...authHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(cupom.dados)
      });
      const texto = await r.text();
      if (!r.ok) {
        if (texto.includes('duplicate') || r.status === 409) return res.status(409).json({ error: 'Já existe um cupom com esse código' });
        return res.status(r.status).json({ error: 'Não foi possível criar o cupom' });
      }
      let data; try { data = JSON.parse(texto); } catch { data = null; }
      return res.status(201).json({ data: Array.isArray(data) ? data[0] : data });
    }

    // Editar cupom (?id=).
    if (req.method === 'PATCH') {
      const id = q.id;
      if (!id) return res.status(400).json({ error: 'ID do cupom ausente' });
      let corpo = req.body; if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
      const cupom = montarCupom(corpo, true);
      if (cupom.erro) return res.status(400).json({ error: cupom.erro });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cupons?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...authHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify(cupom.dados)
      });
      if (!r.ok) {
        const t = await r.text();
        if (t.includes('duplicate') || r.status === 409) return res.status(409).json({ error: 'Já existe um cupom com esse código' });
        return res.status(r.status).json({ error: 'Não foi possível salvar' });
      }
      return res.status(200).json({ ok: true });
    }

    // Excluir cupom (?id=).
    if (req.method === 'DELETE') {
      const id = q.id;
      if (!id) return res.status(400).json({ error: 'ID do cupom ausente' });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cupons?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { ...authHeaders(), Prefer: 'return=minimal' }
      });
      return res.status(r.status).json({ ok: r.ok });
    }

    return res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    console.error('[Cupons] falha:', err);
    return res.status(502).json({ error: 'Falha ao processar cupons' });
  }
}

// Valida e normaliza o corpo do cupom vindo do admin.
function montarCupom(corpo, parcial = false) {
  const dados = {};
  if (corpo.codigo != null) {
    const cod = String(corpo.codigo).trim().toUpperCase().replace(/\s+/g, '');
    if (!cod || cod.length < 3) return { erro: 'Código deve ter ao menos 3 caracteres' };
    if (!/^[A-Z0-9]+$/.test(cod)) return { erro: 'Código: use só letras e números' };
    dados.codigo = cod;
  } else if (!parcial) return { erro: 'Informe o código do cupom' };

  if (corpo.tipo != null) {
    const t = String(corpo.tipo);
    if (t !== 'percent' && t !== 'fixo') return { erro: 'Tipo inválido' };
    dados.tipo = t;
  }
  if (corpo.valor != null) {
    const v = parseFloat(corpo.valor);
    if (!Number.isFinite(v) || v <= 0) return { erro: 'Valor do desconto inválido' };
    const tipo = dados.tipo || corpo.tipo;
    if (tipo === 'percent' && v > 90) return { erro: 'Percentual máximo é 90%' };
    dados.valor = v;
  } else if (!parcial) return { erro: 'Informe o valor do desconto' };

  if (corpo.ativo != null) dados.ativo = !!corpo.ativo;
  if (corpo.min_compra != null) { const m = parseFloat(corpo.min_compra); dados.min_compra = Number.isFinite(m) && m > 0 ? m : 0; }
  if (corpo.validade != null) dados.validade = corpo.validade ? String(corpo.validade).slice(0, 10) : null;
  if (corpo.descricao != null) dados.descricao = String(corpo.descricao).slice(0, 200);

  return { dados };
}
