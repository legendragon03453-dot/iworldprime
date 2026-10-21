// sitemap.xml dinâmico. Servido em /sitemap.xml (rewrite no vercel.json).
//
// Lê os produtos PUBLICADOS direto do Supabase (chave publishable + RLS, que só
// libera leitura de publicados) e monta o XML na hora — assim o sitemap sempre
// reflete o catálogo atual, sem precisar rodar gerador a cada mudança.

const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co/rest/v1/produtos';
const SUPABASE_ANON = 'sb_publishable_Rt1TFzLwV8YWhPVk2rMYLA_MFTMYXzH';
const SITE_URL = 'https://www.iworldprime.com.br';

const STATIC_PAGES = ['/', '/loja', '/iphone', '/macs', '/jbl', '/playstation', '/acessorios', '/drones', '/simulador', '/suporte'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  let produtos = [];
  try {
    const r = await fetch(SUPABASE_URL + '?select=id,nome,atualizado_em&status=eq.published&order=ordem.asc', {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
    });
    if (r.ok) produtos = await r.json();
  } catch (e) {
    console.error('[sitemap] falha ao ler produtos:', e);
  }

  // Um URL por MODELO (dedupe por nome) — variantes de capacidade compartilham
  // a mesma página de detalhe, então não repetimos no sitemap.
  const vistos = new Set();
  const urls = [];

  STATIC_PAGES.forEach(p => {
    urls.push(`  <url><loc>${SITE_URL}${p}</loc><changefreq>weekly</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`);
  });

  produtos.forEach(p => {
    const chave = (p.nome || '').trim().toLowerCase();
    if (!p.id || (chave && vistos.has(chave))) return;
    if (chave) vistos.add(chave);
    const lastmod = p.atualizado_em ? `<lastmod>${String(p.atualizado_em).slice(0, 10)}</lastmod>` : '';
    urls.push(`  <url><loc>${SITE_URL}/detalhes.html?id=${esc(p.id)}</loc>${lastmod}<changefreq>daily</changefreq><priority>0.7</priority></url>`);
  });

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
