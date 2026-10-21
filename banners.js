// banners.js
// Configuração das páginas de categoria: banner do topo, textos e quais
// produtos entram em cada uma.
//
// Antes disso, as 6 páginas de categoria eram cópias byte-idênticas com o
// mesmo banner de iPhone fixo no HTML — por isso quem entrava em /macs.html
// via um banner de iPhone. O banner só podia ser trocado pelo painel, que
// salvava em localStorage e portanto nunca chegava a nenhum cliente.
//
// Agora o padrão vem daqui e o painel sobrescreve pela tabela `banners` do
// Supabase (ver supabase-banners.sql). Se a tabela ainda não existir ou o
// Supabase estiver fora do ar, o site cai neste padrão e continua correto.

const BANNER_BASE = '/IMAGES/BANNERS/';
const SUPABASE_URL = 'https://kiozwryulztunsrfqdus.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Rt1TFzLwV8YWhPVk2rMYLA_MFTMYXzH';

// `casaCom` são os trechos de categoria do produto. A comparação é
// em minúsculas e por "contém", então 'som' pega 'Caixas de Som'.
const CATEGORIAS = {
    'iPhones': {
        rota: 'iphone',
        banner: BANNER_BASE + 'iphone_reserva.webp',
        kicker: 'Disponível agora',
        titulo: 'iPhone 18 Pro',
        subtitulo: 'Somente na iWorldPrime. Garanta o seu com frete grátis para todo o Brasil.',
        ctaTexto: 'Comprar iPhone 18',
        casaCom: ['iphone'],
        destaque: 'iphone 18'
    },
    'iPads': {
        rota: 'ipads',
        banner: BANNER_BASE + 'ipads.webp',
        titulo: 'iPad',
        subtitulo: 'Potência de computador na leveza de um tablet. Ideal para estudo, trabalho e criação.',
        ctaTexto: 'Comprar iPad',
        casaCom: ['ipad'],
        destaque: 'ipad'
    },
    'Macs': {
        rota: 'macs',
        banner: BANNER_BASE + 'macs.webp',
        bannerCompleto: true,
        kicker: 'Linha MacBook',
        titulo: 'Desempenho para tudo o que você precisa',
        subtitulo: 'Chips Apple silicon, bateria para o dia inteiro e tela Liquid Retina. Encontre no MacBook.',
        ctaTexto: 'Ver MacBooks',
        casaCom: ['mac'],
        destaque: 'macbook'
    },
    'JBL': {
        rota: 'jbl',
        banner: BANNER_BASE + 'jbl.webp',
        bannerCompleto: true,
        titulo: 'JBL PartyBox & Boombox',
        subtitulo: 'Som potente, graves profundos e show de luzes para levar a festa a qualquer lugar.',
        ctaTexto: 'Comprar JBL',
        casaCom: ['jbl', 'som', 'caixa'],
        destaque: 'boombox'
    },
    'Acessórios': {
        rota: 'acessorios',
        banner: BANNER_BASE + 'acessorios.webp',
        kicker: 'Para o seu iPhone',
        titulo: 'Acessórios',
        subtitulo: 'Películas, capas, carregadores e fones para proteger e completar o seu aparelho.',
        ctaTexto: 'Ver acessórios',
        // Drones saíram daqui: agora têm categoria própria.
        casaCom: ['acess', 'pelicula', 'película', 'capa', 'case', 'carregador', 'fone', 'airpod', 'hollyland', 'microfone'],
        destaque: 'pelicula'
    },
    'Drones': {
        rota: 'drones',
        banner: BANNER_BASE + 'drones.webp',
        bannerCompleto: true,
        kicker: 'DJI',
        titulo: 'Drones e câmeras',
        subtitulo: 'DJI Neo 2, Lito X1 e Osmo Pocket: imagem estabilizada para quem cria conteúdo.',
        ctaTexto: 'Ver drones',
        casaCom: ['drone', 'dji', 'osmo', 'pocket'],
        destaque: 'neo'
    },
    'Playstation': {
        rota: 'playstation',
        banner: BANNER_BASE + 'playstation.webp',
        bannerCompleto: true,
        titulo: 'PlayStation 5',
        subtitulo: 'SSD ultrarrápido, feedback tátil e uma biblioteca de jogos sem igual.',
        ctaTexto: 'Comprar PS5',
        casaCom: ['playstation', 'play', 'ps5'],
        destaque: 'playstation'
    },
};

const Banners = {
    categorias: CATEGORIAS,

    // Descobre a categoria pelo ?cat= ou pelo nome do arquivo da rota.
    categoriaAtual() {
        const pedida = new URLSearchParams(window.location.search).get('cat');
        if (pedida) {
            if (CATEGORIAS[pedida]) return pedida;
            // Nome que não é chave (ex.: ?cat=Drones) casa pelos mesmos termos
            // usados para filtrar produtos. Antes isso caía direto no
            // fallback e a página abria como "iPhones", criando uma segunda
            // coleção de iPhone que não deveria existir.
            const alvo = pedida.toLowerCase();
            for (const [nome, cfg] of Object.entries(CATEGORIAS)) {
                if (cfg.casaCom.some(t => alvo.includes(t) || t.includes(alvo))) return nome;
            }
            console.warn(`[Banners] Categoria "${pedida}" não existe; usando iPhones.`);
        }

        const caminho = window.location.pathname.toLowerCase();
        for (const [nome, cfg] of Object.entries(CATEGORIAS)) {
            const arquivo = cfg.rota.replace('.html', '');
            if (caminho.includes(arquivo)) return nome;
        }
        return 'iPhones';
    },

    // Um produto pertence à categoria se a categoria cadastrada contém algum
    // dos termos de `casaCom`.
    filtrar(produtos, nomeCategoria) {
        const cfg = CATEGORIAS[nomeCategoria];
        if (!cfg) return [];
        return produtos.filter(p => {
            const cat = (p.category || '').toLowerCase();
            return cfg.casaCom.some(t => cat.includes(t));
        });
    },

    // Busca o que o painel salvou. Falha em silêncio: banner é enfeite, não
    // pode derrubar a listagem de produtos.
    async carregar() {
        const cfg = JSON.parse(JSON.stringify(CATEGORIAS));
        try {
            const r = await fetch(
                `${SUPABASE_URL}/rest/v1/banners?select=*`,
                { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
            );
            if (!r.ok) return cfg;
            for (const linha of await r.json()) {
                const alvo = cfg[linha.categoria];
                if (!alvo) continue;
                if (linha.imagem_url) alvo.banner = linha.imagem_url;
                if (linha.titulo) alvo.titulo = linha.titulo;
                if (linha.subtitulo) alvo.subtitulo = linha.subtitulo;
                if (linha.cta_texto) alvo.ctaTexto = linha.cta_texto;
                if (linha.cta_link) alvo.ctaLink = linha.cta_link;
            }
        } catch (e) {
            console.warn('[Banners] Usando padrão do código:', e);
        }
        return cfg;
    }
};

window.Banners = Banners;
