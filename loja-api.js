// loja-api.js
// Camada de dados da loja: PRODUTOS no Supabase, CHECKOUT no Mercado Pago.
//
// O nome da classe continua LojaAPI para não reescrever as 14 páginas que já
// a chamam — mas por baixo é tudo novo: os produtos são lidos da tabela
// `produtos` do Supabase (chave publishable, RLS só deixa ler publicados) e o
// pagamento é criado pelo servidor em /api/mercadopago (Checkout Pro).
//
// Nada de segredo aqui: este arquivo é servido ao navegador. O Access Token do
// Mercado Pago vive só na função serverless (api/mercadopago.js).

// Nomes próprios para não colidir com os `const SUPABASE_URL/ANON` do
// banners.js — os dois scripts vivem no mesmo escopo global e uma redeclaração
// de `const` derruba o segundo arquivo (era o que travava as coleções).
const PRODUTOS_SB_URL = 'https://kiozwryulztunsrfqdus.supabase.co';
const PRODUTOS_SB_ANON = 'sb_publishable_Rt1TFzLwV8YWhPVk2rMYLA_MFTMYXzH';

class LojaAPI {
    // Escrita do admin: passa pela função /api/produtos, que valida o token de
    // sessão e usa a service_role no servidor (o navegador nunca a vê).
    static async request(endpoint, options = {}) {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const expirou = adminUser.expira && Date.now() > adminUser.expira;
        if (expirou) localStorage.removeItem('adminUser');
        const adminToken = (!expirou && adminUser.token) ? adminUser.token : '';

        const headers = {
            'Content-Type': 'application/json',
            'X-Produtos-Endpoint': endpoint,
            'X-Admin-Token': adminToken,
            ...(options.headers || {})
        };

        try {
            const response = await fetch(`/api/produtos`, { ...options, headers, cache: 'no-store' });
            return await response.json();
        } catch (error) {
            console.error(`[Produtos] Falha na rede para ${endpoint}:`, error);
            return null;
        }
    }

    // 1b. Listagem do ADMIN: todas as linhas cruas (publicadas E rascunhos),
    // SEM agrupar por modelo — cada variante é uma linha editável. Passa pelo
    // /api/produtos (service_role) porque a chave publishable só vê publicados.
    static async getAllProductsAdmin() {
        const res = await this.request('/produtos', { method: 'GET' });
        const linhas = (res && Array.isArray(res.data)) ? res.data : [];
        return linhas.map(p => ({
            id: p.id,
            name: p.nome || 'Sem Nome',
            price: p.preco != null ? p.preco : 0,
            description: p.descricao || '',
            category: p.categoria || 'Geral',
            image: p.imagem || null,
            status: p.status || 'published',
            tags: Array.isArray(p.tags) ? p.tags : [],
            ordem: p.ordem
        }));
    }

    // 1. Listar produtos (Supabase) com cache de 60s no localStorage.
    static async getProducts() {
        const cacheKey = 'produtos_cache_v1';
        const cacheTimeKey = 'produtos_cache_time_v1';
        const now = Date.now();

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime && (now - parseInt(cachedTime) < 60000)) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed && parsed.length > 0) {
                    return this.agruparPorModelo(this.formatProducts(parsed));
                }
            } catch (e) { console.error('[Produtos Cache] leitura:', e); }
        }

        let linhas = null;
        try {
            // Só produtos publicados, na ordem definida. O RLS também filtra por
            // status, mas pedimos explícito para não depender só dele.
            const url = `${PRODUTOS_SB_URL}/rest/v1/produtos`
                + `?select=id,nome,descricao,preco,categoria,subcategoria,imagem,tags,slug,status`
                + `&status=eq.published&order=ordem.asc`;
            const r = await fetch(url, {
                headers: { apikey: PRODUTOS_SB_ANON, Authorization: `Bearer ${PRODUTOS_SB_ANON}` },
                cache: 'no-store'
            });
            if (r.ok) linhas = await r.json();
        } catch (e) {
            console.error('[Produtos] falha ao ler Supabase:', e);
        }

        if (linhas && linhas.length > 0) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(linhas));
                localStorage.setItem(cacheTimeKey, now.toString());
            } catch (e) {}
            return this.agruparPorModelo(this.formatProducts(linhas));
        }

        // Rede falhou ou voltou vazio: usa o último cache bom em vez de zerar a loja.
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed && parsed.length > 0) return this.agruparPorModelo(this.formatProducts(parsed));
            } catch (e) {}
        }
        return [];
    }

    static getSmartProductImage(p) {
        // Mapeamento por modelo, com fotos oficiais dos fabricantes
        // (Apple, DJI, JBL, Meta) em WebP 1200x1200 servidas pela própria loja.
        //
        // Este mapa tem prioridade sobre a imagem cadastrada no catálogo: o cadastro
        // vinha com placeholders .svg cinzas, fotos de lifestyle e imagens
        // genéricas da linha repetidas em vários anúncios. Produto sem foto
        // oficial aqui continua usando a imagem cadastrada (ver mainImg abaixo).
        const nameLower = (p && p.name ? p.name : '').toLowerCase();
        const catLower = (p && p.category ? p.category : '').toLowerCase();
        const combined = nameLower + ' ' + catLower;

        // A ordem importa: o primeiro termo que casar vence, então os modelos
        // mais específicos ("iphone 17 pro max") vêm antes dos genéricos ("iphone 17").
        const IMG_BASE = '/IMAGES/PRODUCTS/';
        const MAPA = [
            [['iphone duo', 'duo'], 'iphone_duo.webp?v=4'],
            [['iphone 18 pro max', 'iphone 18 pro', 'iphone 18'], 'iphone_18_burgundy.webp?v=5'],
            [['iphone 17 pro max'], 'iphone_17_pro_max.webp'],
            [['iphone 17 pro'], 'iphone_17_pro.webp'],
            [['iphone 17'], 'iphone_17.webp'],
            [['iphone air'], 'iphone_air.webp'],
            [['iphone 16 pro max'], 'iphone_16pro_natural.webp?v=1'],
            [['iphone 16 pro'], 'iphone_16pro_natural.webp?v=1'],
            [['iphone 16'], 'iphone_16.webp'],
            [['iphone 15 pro'], 'iphone_15_pro.webp'],
            [['iphone 15'], 'iphone_15.webp'],
            [['iphone 14 pro max'], 'iphone_14_pro_max.webp?v=2'],
            [['iphone 14 pro'], 'iphone_14_pro_max.webp?v=2'],
            [['iphone 14'], 'iphone_14.webp'],
            [['iphone 13 pro max'], 'iphone_13_pro_max.webp?v=2'],
            [['iphone 13'], 'iphone_13.webp'],
            [['iphone 12'], 'iphone_12.webp'],
            [['iphone 11'], 'iphone_11.webp'],
            [['ipad 11', 'ipad a16'], 'ipad_11.webp'],
            [['ipad 10', 'ipad'], 'ipad_10.webp'],
            [['macbook pro', 'mac pro'], 'macbook_pro.webp'],
            [['macbook air', 'mac air'], 'macbook_air_m4.webp'],
            [['macbook', 'mac'], 'macbook_air_m4.webp'],
            [['lito x1', 'lito'], 'dji_lito_x1.webp'],
            [['neo 2', 'neo'], 'dji_neo_2.webp'],
            [['creator combo'], 'osmo_pocket_3_creator.webp'],
            [['osmo', 'pocket'], 'osmo_pocket_3.webp'],
            [['party box 720', 'partybox 720', '720'], 'jbl_partybox_720.webp'],
            [['party box 520', 'partybox 520', '520'], 'jbl_partybox_520.webp'],
            [['party box 330', 'partybox 330'], 'jbl_partybox_720.webp'],
            [['party box 320', 'partybox 320'], 'jbl_partybox_520.webp'],
            [['party box 120', 'partybox 120'], 'jbl_partybox_520.webp'],
            [['jbl go', 'go 5', 'go5'], 'caixa-de-som-bluetooth-jbl-go-4-azul-01-min%201_1x.webp'],
            [['boombox'], 'jbl_boombox_4.webp'],
            [['ray ban', 'ray-ban', 'meta display'], 'rayban_meta_display.webp'],
            [['playstation', 'ps5'], 'ps5-product-thumbnail-01-en-14sep21%201_1x.webp'],
            [['airpods', 'fone'], 'AIR%20PODS%201_1x.webp'],
            [['pelicula', 'película'], 'acessorio_pelicula.webp'],
            [['capa', 'case'], 'acessorio_capa.webp'],
            [['carregador', 'charger', 'fonte usb', 'usb-c 20w'], 'acessorio_carregador.webp'],
            [['dji', 'drone'], 'dji_lito_x1.webp'],
            [['jbl', 'caixa de som'], 'jbl_boombox_4.webp'],
            [['iphone'], 'iphone_17.webp']
        ];

        for (const [termos, arquivo] of MAPA) {
            if (termos.some(t => combined.includes(t))) {
                return IMG_BASE + arquivo;
            }
        }

        // Sem foto oficial para este modelo: usa a imagem cadastrada, desde que
        // não seja um dos placeholders conhecidos.
        let mainImg = null;
        if (p && p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
            mainImg = p.images[0];
        } else if (p) {
            mainImg = p.imageUrl || p.image_url;
        }

        if (mainImg && typeof mainImg === 'string' &&
            mainImg.trim() !== '' &&
            !mainImg.endsWith('.svg') &&
            !mainImg.includes('IPHONE%206.webp') &&
            !mainImg.includes('via.placeholder') &&
            !mainImg.includes('placeholder')) {
            return mainImg;
        }

        return IMG_BASE + 'iphone_17.webp';
    }


    // Capacidades por modelo — mesma tabela usada na página de produto.
    // Serve para nomear as variantes quando o anúncio não traz a capacidade.
    static get CAPACIDADES() {
        return [
            ['iphone duo',     ['256 GB', '512 GB', '1 TB', '2 TB']],
            ['iphone 18',      ['256 GB', '512 GB', '1 TB', '2 TB']],
            ['iphone 17 pro',  ['256 GB', '512 GB', '1 TB']],
            ['iphone 17',      ['256 GB', '512 GB']],
            ['iphone air',     ['256 GB', '512 GB', '1 TB']],
            ['iphone 16',      ['128 GB', '256 GB', '512 GB']],
            ['iphone 15 pro',  ['128 GB', '256 GB', '512 GB', '1 TB']],
            ['iphone 15',      ['128 GB', '256 GB', '512 GB']],
            ['iphone 14',      ['128 GB', '256 GB', '512 GB']],
            ['iphone 13',      ['128 GB', '256 GB', '512 GB']],
            ['iphone 12',      ['64 GB', '128 GB', '256 GB']],
            ['iphone 11',      ['64 GB', '128 GB', '256 GB']],
            ['ipad',           ['128 GB', '256 GB', '512 GB']],
            ['macbook',        ['256 GB', '512 GB', '1 TB']]
        ];
    }

    // Fotos extras da galeria, indexadas pela foto de capa. A tabela `produtos`
    // guarda só UMA imagem (coluna `imagem`); quando o produto tem galeria, as
    // demais fotos ficam aqui, na ordem em que aparecem nas miniaturas.
    static get GALERIAS() {
        const woovAzul = (n) => `/IMAGES/PRODUCTS/capa_woov_azul_iphone_17_pro_${n}.jpg`;
        return {
            [woovAzul(1)]: [2, 3, 4, 5, 6, 7, 8].map(woovAzul)
        };
    }

    // Junta anúncios do mesmo modelo num produto só.
    //
    // O cadastro tinha um anúncio por capacidade — três "iPhone 17 Pro Max",
    // quatro "iPhone 14" — e a loja mostrava o mesmo aparelho repetido na
    // grade. Aqui eles viram um item com `variantes`, e a capacidade passa a
    // ser escolha dentro da página, que é o que o cliente pediu.
    //
    // A capacidade sai do nome quando está lá ("iPhone 14 256GB"); quando os
    // nomes são idênticos, as variantes são ordenadas por preço e recebem as
    // capacidades do modelo nessa ordem — do mais barato ao mais caro.
    static agruparPorModelo(produtos) {
        if (!Array.isArray(produtos) || produtos.length === 0) return [];

        const semCapacidade = (nome) => nome
            .replace(/\b\d+\s*(gb|tb)\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

        const capacidadeNo = (nome) => {
            const m = nome.match(/\b(\d+)\s*(gb|tb)\b/i);
            return m ? `${m[1]} ${m[2].toUpperCase()}` : null;
        };

        const grupos = new Map();
        for (const p of produtos) {
            const chave = semCapacidade((p.name || '').toLowerCase());
            if (!grupos.has(chave)) grupos.set(chave, []);
            grupos.get(chave).push(p);
        }

        const saida = [];
        for (const [, itens] of grupos) {
            if (itens.length === 1) { saida.push(itens[0]); continue; }

            itens.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));

            const nomeBase = semCapacidade(itens[0].name || '');
            const tabela = (this.CAPACIDADES.find(([t]) => nomeBase.toLowerCase().includes(t)) || [])[1] || [];

            const variantes = itens.map((it, i) => ({
                id: it.id,
                capacidade: capacidadeNo(it.name || '') || tabela[i] || `Opção ${i + 1}`,
                preco: parseFloat(it.price) || 0,
                url: it.url
            }));

            saida.push({
                ...itens[0],
                name: nomeBase,
                price: variantes[0].preco,      // a grade mostra "a partir de"
                variantes,
                aPartirDe: true
            });
        }
        return saida;
    }

    // Converte a linha do Supabase (nome, preco, categoria, imagem, ...) no
    // formato que o site inteiro já espera (name, price, category, images[]).
    static formatProducts(dataList) {
        let overrides = JSON.parse(localStorage.getItem('produtoOverrides') || '{}');
        return dataList.map(p => {
            // Aceita tanto a linha do Supabase (pt-BR) quanto o formato antigo,
            // por segurança durante a transição.
            const id = p.id || Math.random().toString();
            const nome = p.nome || p.name || 'Sem Nome';
            const preco = (p.preco != null ? p.preco : p.price) || 0;
            const desc = p.descricao || p.description || '';
            let cat = p.categoria || p.category || 'Geral';
            if (overrides[id] && overrides[id].category !== undefined) {
                cat = overrides[id].category;
            }
            const imagemCadastrada = p.imagem || (p.images && p.images[0]) || p.imageUrl || p.image_url || null;

            // Prioridade da imagem:
            // 1) a foto que o ADMIN cadastrou (se for uma imagem real, não
            //    placeholder) — assim editar/enviar foto no painel funciona;
            // 2) senão, a foto oficial do modelo (getSmartProductImage).
            const ehImagemReal = imagemCadastrada && typeof imagemCadastrada === 'string' &&
                imagemCadastrada.trim() !== '' &&
                !imagemCadastrada.endsWith('.svg') &&
                !imagemCadastrada.includes('IPHONE%206.webp') &&
                !imagemCadastrada.includes('via.placeholder') &&
                !imagemCadastrada.includes('placeholder');
            const finalImg = ehImagemReal
                ? imagemCadastrada
                : this.getSmartProductImage({ name: nome, category: cat, images: [] });

            return {
                id,
                name: nome,
                price: preco,
                description: desc,
                category: cat,
                images: [finalImg, ...(this.GALERIAS[finalImg] || [])],
                url: null, // checkout agora é gerado no Mercado Pago (ver criarCheckout)
                isStar: true,
                tags: Array.isArray(p.tags) ? p.tags : []
            };
        });
    }

    // Cria um checkout do Mercado Pago para os itens do carrinho e devolve a URL
    // para onde redirecionar. Manda só id+quantidade — o SERVIDOR relê o preço
    // no Supabase, então não dá para forjar valor pelo navegador.
    static async criarCheckout(itens) {
        const items = (itens || [])
            .map(i => ({ id: i.id, quantity: i.quantity || 1 }))
            .filter(i => i.id != null);
        if (items.length === 0) return null;
        try {
            const r = await fetch('/api/mercadopago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const data = await r.json();
            if (!r.ok) {
                console.error('[Mercado Pago] checkout:', data);
                return null;
            }
            // init_point = produção; sandbox_init_point = credencial de teste.
            return data.init_point || data.sandbox_init_point || null;
        } catch (e) {
            console.error('[Mercado Pago] falha de rede no checkout:', e);
            return null;
        }
    }

    // Traduz o formato do painel (name/price/category...) para as colunas da
    // tabela `produtos` do Supabase (nome/preco/categoria...).
    static paraColunas(d) {
        const col = {};
        if (d.name !== undefined) col.nome = d.name;
        if (d.nome !== undefined) col.nome = d.nome;
        if (d.price !== undefined) col.preco = d.price;
        if (d.preco !== undefined) col.preco = d.preco;
        if (d.description !== undefined) col.descricao = d.description;
        if (d.descricao !== undefined) col.descricao = d.descricao;
        if (d.category !== undefined) col.categoria = d.category;
        if (d.categoria !== undefined) col.categoria = d.categoria;
        if (d.subcategory !== undefined) col.subcategoria = d.subcategory;
        if (d.imagem !== undefined) col.imagem = d.imagem;
        if (d.images && d.images[0]) col.imagem = d.images[0];
        if (d.tags !== undefined) col.tags = d.tags;
        if (d.status !== undefined) col.status = d.status;
        return col;
    }

    // 2. Criar produto (painel admin) — grava no Supabase via /api/produtos.
    static async createProduct(productData) {
        const col = this.paraColunas(productData);
        if (col.categoria === undefined) col.categoria = 'iPhones';
        if (col.status === undefined) col.status = 'published';
        return this.request('/produtos', { method: 'POST', body: JSON.stringify(col) });
    }

    // 3. Atualizar produto.
    static async updateProduct(productId, updates) {
        // Feedback instantâneo na UI do admin enquanto o servidor confirma.
        let overrides = JSON.parse(localStorage.getItem('produtoOverrides') || '{}');
        if (!overrides[productId]) overrides[productId] = {};
        Object.assign(overrides[productId], updates);
        localStorage.setItem('produtoOverrides', JSON.stringify(overrides));

        const col = this.paraColunas(updates);
        return this.request('/produtos/' + productId, { method: 'PATCH', body: JSON.stringify(col) });
    }

    // 4. Excluir produto.
    static async deleteProduct(productId) {
        return this.request('/produtos/' + productId, { method: 'DELETE' });
    }

    // 5. Checkout: não existe mais link por produto. Quem abre o pagamento é
    // criarCheckout() (Mercado Pago). Mantido por compatibilidade de chamadas.
    static async getCheckoutUrl() {
        return null;
    }
}

// Alias com nome neutro para o novo mundo (Supabase + Mercado Pago). As páginas
// antigas continuam usando LojaAPI; código novo pode usar LojaAPI.
window.LojaAPI = LojaAPI;
window.LojaAPI = LojaAPI;
