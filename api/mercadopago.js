// Função de checkout do Mercado Pago (Checkout Pro).
//
// Existe para que o Access Token do Mercado Pago fique SÓ no servidor e nunca
// chegue ao navegador (regra do cliente: "nunca exponha sua chave privada no
// client-side; faça sempre do servidor"). O front manda apenas os ids e as
// quantidades do carrinho; QUEM DIZ O PREÇO É O SERVIDOR, relendo o catálogo
// no Supabase. Assim ninguém fecha um iPhone por R$ 1 mexendo no navegador.
//
// Fluxo:
//   1. Confere a origem (só a própria loja chama).
//   2. Relê cada produto no Supabase (preço e nome oficiais, só publicados).
//   3. Cria uma "preference" no Mercado Pago e devolve o init_point.
// O cliente é então redirecionado para o checkout hospedado do Mercado Pago,
// onde paga com Pix, cartão ou boleto.

import { buscarCupom, avaliarCupom, lerDescontoPix } from './cupons.js';

const MP_API = 'https://api.mercadopago.com/checkout/preferences';

// Supabase: mesma URL e chave PUBLISHABLE que o site já usa (são públicas de
// propósito; o RLS só deixa LER produtos publicados). Nenhum segredo aqui.
const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Rt1TFzLwV8YWhPVk2rMYLA_MFTMYXzH';

// Salva o pedido (dados do cliente + itens) na tabela `pedidos` usando a
// service_role (só no servidor). Devolve o id do pedido, ou null se falhar.
async function criarPedido(pedido) {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY) { console.error('[Pedido] SUPABASE_SERVICE_KEY ausente'); return null; }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(pedido)
    });
    if (!r.ok) { console.error('[Pedido] insert falhou', r.status, await r.text()); return null; }
    const data = await r.json();
    return Array.isArray(data) && data[0] ? data[0].id : null;
  } catch (e) { console.error('[Pedido] erro ao salvar:', e); return null; }
}

// Anota no pedido o id da preference do Mercado Pago (falha em silêncio).
async function anotarPreference(pedidoId, preferenceId) {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY || !pedidoId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(pedidoId)}`, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ mp_preference_id: preferenceId })
    });
  } catch (e) {}
}

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

// Lê os produtos pedidos direto do Supabase. Só volta o que está publicado
// (o RLS garante isso), então item escondido/rascunho não fecha compra.
async function buscarProdutos(ids) {
  const lista = ids.map(encodeURIComponent).join(',');
  const url = `${SUPABASE_URL}/rest/v1/produtos?id=in.(${lista})&select=id,nome,preco,status`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
  });
  if (!r.ok) throw new Error('Supabase respondeu ' + r.status);
  return await r.json();
}

export default async function handler(req, res) {
  // Webhook do Mercado Pago: as notificações de pagamento chegam aqui (POST, sem
  // Origin da loja). Confirmamos o pagamento consultando a API do MP e deixamos
  // o status no log. SEMPRE respondemos 200, mesmo em erro, para o MP não ficar
  // reenviando. É a base para, no futuro, registrar pedido/estoque.
  if (req.query && req.query.event === 'webhook') {
    try {
      const tipo = req.query.type || req.query.topic || '';
      const pagamentoId = req.query['data.id'] || req.query.id || (req.body && req.body.data && req.body.data.id);
      const token = process.env.MP_ACCESS_TOKEN;
      if (tipo.includes('payment') && pagamentoId && token) {
        const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pagamentoId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const pg = await r.json();
          console.log('[Mercado Pago] webhook pagamento', pagamentoId, '→', pg.status, '| ref:', pg.external_reference, '| R$', pg.transaction_amount);
          // Atualiza o pedido correspondente (external_reference = id do pedido).
          const KEY = process.env.SUPABASE_SERVICE_KEY;
          const ref = pg.external_reference;
          if (KEY && ref && !String(ref).startsWith('iwp-')) {
            const mapa = { approved: 'pago', pending: 'pendente', in_process: 'pendente', rejected: 'cancelado', cancelled: 'cancelado' };
            const novo = mapa[pg.status] || 'pendente';
            try {
              await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(ref)}`, {
                method: 'PATCH',
                headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify({ status: novo, mp_payment_id: String(pagamentoId) })
              });
            } catch (e) {}
          }
        } else {
          console.warn('[Mercado Pago] webhook: não achei o pagamento', pagamentoId, r.status);
        }
      } else {
        console.log('[Mercado Pago] webhook recebido:', tipo || '?');
      }
    } catch (e) {
      console.error('[Mercado Pago] webhook erro (ignorado):', e);
    }
    return res.status(200).json({ received: true });
  }

  const origem = req.headers.origin;
  const referer = req.headers.referer || '';
  const origemDoReferer = referer ? new URL(referer).origin : null;
  const chamador = origem || origemDoReferer;

  if (!origemPermitida(chamador)) {
    return res.status(403).json({ error: 'Origem não autorizada' });
  }

  res.setHeader('Access-Control-Allow-Origin', chamador);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    console.error('[Mercado Pago] MP_ACCESS_TOKEN não configurada no ambiente');
    return res.status(500).json({ error: 'Checkout mal configurado' });
  }

  // Corpo esperado: { items: [{ id, quantity }] }. Qualquer preço que venha do
  // cliente é ignorado de propósito.
  let corpo = req.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
  const itensPedidos = Array.isArray(corpo && corpo.items) ? corpo.items : [];
  if (itensPedidos.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  // Quantidade por id, sanitizada (inteiro positivo, teto de 10 por item).
  const qtdPorId = new Map();
  for (const it of itensPedidos) {
    const id = it && it.id != null ? String(it.id) : null;
    if (!id) continue;
    let q = parseInt(it.quantity, 10);
    if (!Number.isFinite(q) || q < 1) q = 1;
    if (q > 10) q = 10;
    qtdPorId.set(id, (qtdPorId.get(id) || 0) + q);
  }
  const ids = [...qtdPorId.keys()];
  if (ids.length === 0) {
    return res.status(400).json({ error: 'Itens inválidos' });
  }

  let produtos;
  try {
    produtos = await buscarProdutos(ids);
  } catch (e) {
    console.error('[Mercado Pago] Falha ao reler preços no Supabase:', e);
    return res.status(502).json({ error: 'Não foi possível validar os produtos agora' });
  }

  // Monta os itens da preference com o PREÇO OFICIAL do banco.
  const items = [];
  for (const p of produtos) {
    const q = qtdPorId.get(String(p.id));
    const preco = Number(p.preco);
    if (!q || !Number.isFinite(preco) || preco <= 0) continue;
    items.push({
      id: String(p.id),
      title: String(p.nome || 'Produto'),
      quantity: q,
      unit_price: Math.round(preco * 100) / 100,
      currency_id: 'BRL'
    });
  }

  if (items.length === 0) {
    return res.status(400).json({ error: 'Nenhum produto válido/disponível no carrinho' });
  }

  // Dados do cliente (obrigatórios): sem eles não há como entregar o pedido.
  const c = (corpo && typeof corpo.cliente === 'object' && corpo.cliente) ? corpo.cliente : {};
  const str = (v) => (v == null ? '' : String(v).trim());
  const cliente = {
    nome: str(c.nome), email: str(c.email), telefone: str(c.telefone),
    cep: str(c.cep), endereco: str(c.endereco), numero: str(c.numero),
    complemento: str(c.complemento), bairro: str(c.bairro),
    cidade: str(c.cidade), estado: str(c.estado)
  };
  const obrig = ['nome', 'email', 'telefone', 'cep', 'endereco', 'numero', 'cidade', 'estado'];
  const faltando = obrig.filter(k => !cliente[k]);
  if (faltando.length) {
    return res.status(400).json({ error: 'Preencha seus dados para finalizar: ' + faltando.join(', ') });
  }
  if (!/^\S+@\S+\.\S+$/.test(cliente.email)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  // --- Descontos (SEMPRE recalculados no servidor; o cliente não dita nada) ---
  const pagamento = corpo && corpo.pagamento === 'pix' ? 'pix' : 'cartao';

  // 1) Cupom (revalidado contra o Supabase).
  let descCupom = 0, cupomCodigo = null;
  if (corpo && corpo.cupom) {
    const cup = await buscarCupom(corpo.cupom);
    const av = avaliarCupom(cup, subtotal);
    if (av.valido) { descCupom = av.desconto; cupomCodigo = cup.codigo; }
  }

  // 2) Desconto Pix (% do painel) sobre o valor já com cupom.
  let pixPct = 0;
  if (pagamento === 'pix') { pixPct = await lerDescontoPix(); }
  const baseAposCupom = Math.max(0, subtotal - descCupom);
  const descPix = pagamento === 'pix' ? Math.round(baseAposCupom * pixPct / 100 * 100) / 100 : 0;

  const total = Math.max(0, Math.round((subtotal - descCupom - descPix) * 100) / 100);

  // Aplica o desconto proporcionalmente nos preços dos itens (o Checkout Pro
  // cobra a soma dos unit_price; não há campo de desconto global). Ajusta a
  // sobra de centavos no primeiro item para a soma bater exatamente.
  if (total < subtotal && subtotal > 0) {
    const fator = total / subtotal;
    let acumulado = 0;
    items.forEach((it, idx) => {
      let novo = Math.round(it.unit_price * fator * 100) / 100;
      if (novo < 0.01) novo = 0.01;
      it.unit_price = novo;
      acumulado += novo * it.quantity;
    });
    // Correção de arredondamento no primeiro item.
    const diff = Math.round((total - acumulado) * 100) / 100;
    if (diff !== 0 && items[0]) {
      const ajuste = Math.round((items[0].unit_price + diff / items[0].quantity) * 100) / 100;
      items[0].unit_price = Math.max(0.01, ajuste);
    }
  }

  // Salva o pedido no Supabase ANTES do pagamento — assim a loja tem os dados
  // do cliente mesmo que ele não conclua o pagamento.
  const pedidoId = await criarPedido({
    ...cliente,
    itens: items.map(it => ({ id: it.id, nome: it.title, quantidade: it.quantity, preco: it.unit_price })),
    total,
    status: 'aguardando_pagamento'
  });

  // Telefone no formato do Mercado Pago (DDD + número).
  const digitos = cliente.telefone.replace(/\D/g, '');
  const phone = { area_code: digitos.slice(0, 2), number: digitos.slice(2) };

  const base = 'https://www.iworldprime.com.br';
  const preference = {
    items,
    payer: {
      name: cliente.nome,
      email: cliente.email,
      phone,
      address: {
        zip_code: cliente.cep.replace(/\D/g, ''),
        street_name: cliente.endereco,
        street_number: cliente.numero
      }
    },
    // Restringe o meio de pagamento à escolha do cliente. Se escolheu Pix (com
    // desconto), o checkout abre só com Pix. Se escolheu cartão, o Pix fica de
    // fora para ninguém pagar o valor cheio "sem querer" pelo Pix.
    payment_methods: pagamento === 'pix'
      ? { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }, { id: 'atm' }] }
      : { excluded_payment_types: [{ id: 'bank_transfer' }] },
    back_urls: {
      success: `${base}/sucesso?compra=sucesso`,
      failure: `${base}/carrinho?compra=falha`,
      pending: `${base}/sucesso?compra=pendente`
    },
    auto_return: 'approved',
    statement_descriptor: 'IWORLDPRIME',
    external_reference: pedidoId || ('iwp-' + Date.now()),
    notification_url: `${base}/api/mercadopago?event=webhook`
  };

  try {
    const mpResp = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });
    const data = await mpResp.json();

    if (!mpResp.ok) {
      console.error('[Mercado Pago] Erro ao criar preference:', mpResp.status, data);
      return res.status(502).json({ error: 'Não foi possível abrir o checkout agora' });
    }

    // Anota a preference no pedido (para casar depois com o pagamento).
    if (pedidoId) anotarPreference(pedidoId, data.id);

    // init_point = checkout de produção; sandbox_init_point = ambiente de teste.
    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id
    });
  } catch (err) {
    console.error('[Mercado Pago] Falha de rede:', err);
    return res.status(502).json({ error: 'Falha ao falar com o Mercado Pago' });
  }
}
