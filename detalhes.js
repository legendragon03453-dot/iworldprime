// Gallery Image Switcher
function changeProductImage(thumbCard) {
    const mainImg = document.getElementById('mainProductImage');
    const thumbImg = thumbCard.querySelector('img');
    if (mainImg && thumbImg) {
        mainImg.src = thumbImg.src;
        
        // Remove active class from all thumbnails and add to clicked
        document.querySelectorAll('.thumb-card').forEach(card => {
            card.classList.remove('active');
            card.style.borderColor = 'transparent';
        });
        thumbCard.classList.add('active');
        thumbCard.style.borderColor = '#000000';
    }
}

// Lightbox logic
function openLightbox(imgSrc) {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    if(modal && img) {
        modal.style.display = "block";
        img.src = imgSrc;
    }
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if(modal) {
        modal.style.display = "none";
    }
}

// Cores reais de cada modelo, com os nomes que o fabricante usa no Brasil
// (extraídos das páginas da Apple Brasil, DJI, JBL e Meta).
//
// A ordem importa igual à do mapa de imagens no loja-api.js: "iphone 17 pro max"
// precisa ser testado antes de "iphone 17 pro", que vem antes de "iphone 17".
const CORES_POR_MODELO = [
    // iPhone Duo — cores oficiais da Apple: Star White e Night Sky.
    ['iphone duo', [
        { name: 'Star White', hex: '#ECEDEF' },
        { name: 'Night Sky',  hex: '#222E3C' }
    ]],
    // iPhone 18 Pro / Pro Max — cores e fotos oficiais da Apple (apple.com/iphone-18-pro).
    // Cada cor tem a foto real daquela cor: ao escolher a amostra, a imagem troca
    // (em vez de tingir), via o campo `img` (ver aplicarCorNaImagem).
    ['iphone 18', [
        { name: 'Burgundy', hex: '#6E2436', img: '/IMAGES/PRODUCTS/iphone_18_burgundy.webp?v=5' },
        { name: 'Glacier',  hex: '#C7DBE7', img: '/IMAGES/PRODUCTS/iphone_18_glacier.webp?v=5' },
        { name: 'Silver',   hex: '#E3E4E6', img: '/IMAGES/PRODUCTS/iphone_18_silver.webp?v=5' },
        { name: 'Black',    hex: '#1C1C1E', img: '/IMAGES/PRODUCTS/iphone_18_black.webp?v=5' }
    ]],
    ['iphone 17 pro', [
        { name: 'Laranja-cósmico', hex: '#C1622F' },
        { name: 'Azul-intenso',    hex: '#2E3D5C' },
        { name: 'Prateado',        hex: '#E2E3E5' }
    ]],
    ['iphone 17', [
        { name: 'Lavanda',     hex: '#D9CFE8' },
        { name: 'Azul-névoa',  hex: '#BCCEDD' },
        { name: 'Sálvia',      hex: '#C8D2C0' },
        { name: 'Branco',      hex: '#F2F2F0' },
        { name: 'Preto',       hex: '#1F2020' }
    ]],
    ['iphone air', [
        { name: 'Preto-espacial', hex: '#1C1C1E' },
        { name: 'Branco-nuvem',   hex: '#EFEDE8' },
        { name: 'Dourado-claro',  hex: '#E4D3B3' },
        { name: 'Azul-céu',       hex: '#BAC8D6' }
    ]],
    // iPhone 16 Pro / Pro Max — titânio, fotos oficiais da Apple (apple.com).
    // Uma entrada só cobre Pro e Pro Max (o nome "16 pro max" contém "16 pro").
    // Precisa vir ANTES de 'iphone 16' para ganhar no includes().
    ['iphone 16 pro', [
        { name: 'Titânio Deserto', hex: '#BFA48F', img: '/IMAGES/PRODUCTS/iphone_16pro_desert.webp?v=1' },
        { name: 'Titânio Natural', hex: '#C2BCB2', img: '/IMAGES/PRODUCTS/iphone_16pro_natural.webp?v=1' },
        { name: 'Titânio Branco',  hex: '#E8E8E4', img: '/IMAGES/PRODUCTS/iphone_16pro_white.webp?v=1' },
        { name: 'Titânio Preto',   hex: '#3B3B3D', img: '/IMAGES/PRODUCTS/iphone_16pro_black.webp?v=1' }
    ]],
    ['iphone 16', [
        { name: 'Ultramarino',        hex: '#7C8FC6' },
        { name: 'Verde-acinzentado',  hex: '#A9C1BC' },
        { name: 'Rosa',               hex: '#EFC9CE' },
        { name: 'Branco',             hex: '#F2F2F0' },
        { name: 'Preto',              hex: '#1F2020' }
    ]],
    ['iphone 15 pro', [
        { name: 'Titânio Natural', hex: '#A9A29B' },
        { name: 'Titânio Azul',    hex: '#56607A' },
        { name: 'Titânio Branco',  hex: '#E8E4E0' },
        { name: 'Titânio Preto',   hex: '#46474B' }
    ]],
    ['iphone 15', [
        { name: 'Preto',   hex: '#4A4B4D' },
        { name: 'Azul',    hex: '#D3DDE0' },
        { name: 'Verde',   hex: '#D1D9CC' },
        { name: 'Amarelo', hex: '#EDE7C8' },
        { name: 'Rosa',    hex: '#EBD3D6' }
    ]],
    ['iphone 14', [
        { name: 'Meia-noite', hex: '#24272E' },
        { name: 'Estelar',    hex: '#F0E9DF' },
        { name: 'Roxo',       hex: '#E0DDEB' },
        { name: 'Azul',       hex: '#A5B8CE' },
        { name: 'Vermelho',   hex: '#C4212F' }
    ]],
    ['iphone 13', [
        { name: 'Meia-noite', hex: '#24272E' },
        { name: 'Estelar',    hex: '#F0E9DF' },
        { name: 'Azul',       hex: '#276787' },
        { name: 'Rosa',       hex: '#F5DDDB' },
        { name: 'Verde',      hex: '#3C4B41' },
        { name: 'Vermelho',   hex: '#C4212F' }
    ]],
    ['iphone 12', [
        { name: 'Preto',    hex: '#2C2C2E' },
        { name: 'Branco',   hex: '#F5F5F0' },
        { name: 'Azul',     hex: '#2F4C63' },
        { name: 'Verde',    hex: '#D4E5D3' },
        { name: 'Roxo',     hex: '#D5CDE0' },
        { name: 'Vermelho', hex: '#C4212F' }
    ]],
    ['iphone 11', [
        { name: 'Preto',    hex: '#1F2020' },
        { name: 'Branco',   hex: '#F5F5F0' },
        { name: 'Roxo',     hex: '#D5CDE0' },
        { name: 'Amarelo',  hex: '#F5E7A0' },
        { name: 'Verde',    hex: '#D0E5D0' },
        { name: 'Vermelho', hex: '#C4212F' }
    ]],
    ['ipad', [
        { name: 'Azul',     hex: '#A3B8C8' },
        { name: 'Rosa',     hex: '#E5B5B0' },
        { name: 'Amarelo',  hex: '#E8D28C' },
        { name: 'Prateado', hex: '#E2E3E5' }
    ]],
    ['macbook', [
        { name: 'Azul-céu',   hex: '#B0C4DA' },
        { name: 'Prateado',   hex: '#E2E3E5' },
        { name: 'Estelar',    hex: '#EDE6DA' },
        { name: 'Meia-noite', hex: '#2E3641' }
    ]],
    ['ray ban', [
        { name: 'Preto', hex: '#1A1A1A' },
        { name: 'Areia', hex: '#D9CDBB' }
    ]],
    ['boombox', [
        { name: 'Preto',   hex: '#1A1A1A' },
        { name: 'Azul',    hex: '#2C3E5C' },
        { name: 'Laranja', hex: '#D2632A' }
    ]],
    ['party box', [{ name: 'Preto', hex: '#1A1A1A' }]],
    ['osmo',      [{ name: 'Cinza-escuro', hex: '#4A4A4C' }]],
    ['pocket',    [{ name: 'Cinza-escuro', hex: '#4A4A4C' }]],
    ['lito',      [{ name: 'Cinza-claro',  hex: '#C9CAC8' }]],
    ['neo',       [{ name: 'Cinza-claro',  hex: '#C9CAC8' }]],
    ['dji',       [{ name: 'Cinza-claro',  hex: '#C9CAC8' }]]
];

// Capacidades por modelo. O cliente vendia um anúncio por capacidade; aqui
// o aparelho tem uma página só e a capacidade é uma escolha.
const ARMAZENAMENTO_POR_MODELO = [
    ['iphone 18',      ['256 GB', '512 GB', '1 TB']],
    ['iphone 17 pro',  ['256 GB']],
    ['iphone 17',      ['256 GB']],
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

function armazenamentoDoModelo(nomeMinusculo) {
    for (const [termo, opcoes] of ARMAZENAMENTO_POR_MODELO) {
        if (nomeMinusculo.includes(termo)) return opcoes;
    }
    return [];
}

function coresDoModelo(nomeMinusculo) {
    for (const [termo, cores] of CORES_POR_MODELO) {
        if (nomeMinusculo.includes(termo)) return cores;
    }
    return [];
}

// Expose renderProductVariants globally
window.renderProductVariants = function(prod) {
    const modelContainer = document.querySelector('.model-selection');
    const colorSection = document.getElementById('colorSelectionSection');
    const colorSwatchesContainer = document.querySelector('.color-swatches');
    const actionSection = document.getElementById('actionSection');

    if (!modelContainer) return;
    modelContainer.innerHTML = '';

    // 1. Armazenamento
    // Antes esta seção listava OUTROS modelos (iPhone / Pro / Pro Max) dentro
    // da página de um produto — o que empurrava o cliente para fora do anúncio
    // que ele estava vendo. Agora mostra as CAPACIDADES do próprio aparelho,
    // que é o pedido: um anúncio por modelo, com 256 GB / 512 GB / 1 TB como
    // opção em vez de três anúncios separados.
    const nameLower = prod.name.toLowerCase();

    // Acessório leva o nome do aparelho no título ("Capa para iPhone 17 Pro"),
    // mas não tem o armazenamento nem as cores do aparelho — só as próprias tags.
    const ehAcessorio = /acess[oó]rio/i.test(prod.category || '');

    // Quando o agrupamento juntou anúncios do mesmo modelo, cada variante tem
    // capacidade E preço próprios — então escolher a capacidade troca o preço
    // na tela e o link de checkout.
    let capacidades = [];
    if (prod.variantes && prod.variantes.length > 0) {
        capacidades = prod.variantes.map(v => ({ rotulo: v.capacidade, preco: v.preco, url: v.url, id: v.id }));
    } else {
        let brutas = [];
        if (prod.tags && prod.tags.length > 0) {
            brutas = prod.tags.filter(t => /^\s*\d+\s*(gb|tb)\s*$/i.test(t));
        }
        if (brutas.length === 0 && !ehAcessorio) brutas = armazenamentoDoModelo(nameLower);
        capacidades = brutas.map(r => ({ rotulo: r, preco: null }));
    }

    // O título "Armazenamento" é estático no HTML. Sem capacidades (ex.: Ray-Ban
    // Meta, JBL) ele aparecia sozinho, com a lista vazia embaixo. Some junto.
    const tituloArmazenamento = modelContainer.previousElementSibling &&
        modelContainer.previousElementSibling.classList.contains('opcao-titulo')
        ? modelContainer.previousElementSibling
        : document.querySelector('.opcao-titulo');

    if (capacidades.length > 0) {
        if (tituloArmazenamento) tituloArmazenamento.style.display = '';
        modelContainer.style.display = 'flex';
        capacidades.forEach((cap) => {
            const card = document.createElement('div');
            card.className = 'model-card capacidade-card';
            card.setAttribute('data-capacidade', cap.rotulo);
            card.innerHTML = `
                <h3>${cap.rotulo}</h3>
                <span class="model-icon"><i class="fa-solid fa-check"></i></span>
            `;
            card.onclick = () => {
                document.querySelectorAll('.capacidade-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                if (cap.preco != null) {
                    // Atualiza preço, parcela e Pix de uma vez.
                    if (window.setPrecoDetalhe) window.setPrecoDetalhe(cap.preco);
                    else {
                        const fmt = cap.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        const alvoPreco = document.getElementById('priceDisplay');
                        const alvoFinal = document.getElementById('finalPriceDisplay');
                        if (alvoPreco) alvoPreco.innerText = fmt;
                        if (alvoFinal) alvoFinal.innerText = fmt;
                    }
                    // O checkout precisa apontar para a variante escolhida.
                    if (cap.url) window.urlCheckoutSelecionada = cap.url;
                    if (cap.id) window.idVarianteSelecionada = cap.id;
                }

                if (colorSection && colorSwatchesContainer && colorSwatchesContainer.children.length > 0) {
                    colorSection.style.display = 'block';
                }
            };
            modelContainer.appendChild(card);
        });
        modelContainer.firstElementChild.click();
    } else {
        if (tituloArmazenamento) tituloArmazenamento.style.display = 'none';
        modelContainer.style.display = 'none';
        if (colorSection) colorSection.style.display = 'block';
    }

    // 2. Determine colors
    let colors = [];
    if (prod.tags && prod.tags.length > 0) {
        const isColor = (tag) => /preto|branco|azul|cinza|prata|gold|ouro|vermelho|verde|titanium|orange|rosa|roxo/i.test(tag);
        colors = prod.tags.filter(isColor);
    }

    // Nenhum produto do catálogo vem com tag de cor hoje, então na prática é sempre
    // a tabela por modelo que responde.
    if (colors.length === 0 && !ehAcessorio) {
        colors = coresDoModelo(nameLower);
    }

    const colorTitle = document.querySelector('.color-title');

    if (colors.length === 0) {
        // Produto sem variação de cor: esconde a seção em vez de inventar uma
        // cor, e libera o botão de compra que dependia do clique na amostra.
        if (colorSection) colorSection.style.display = 'none';
        if (actionSection) actionSection.style.display = 'block';
    } else if (colorSwatchesContainer) {
        colorSwatchesContainer.innerHTML = '';
        // Cor base = primeira amostra. A foto real corresponde a ela, então
        // ela nunca recebe filtro (ver aplicarCorNaImagem).
        const primeira = colors[0];
        window._corBaseHex = typeof primeira === 'string' ? getColorHexFromName(primeira) : primeira.hex;
        colors.forEach((c, index) => {
            const colorName = typeof c === 'string' ? c : c.name;
            const colorHex = typeof c === 'string' ? getColorHexFromName(c) : c.hex;
            // Foto específica desta cor (ex.: iPhone 18 com as fotos oficiais da
            // Apple por cor). Quando existe, a imagem TROCA em vez de tingir.
            const colorImg = (typeof c === 'object' && c.img) ? c.img : null;

            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = colorHex;
            swatch.setAttribute('data-color', colorName.toLowerCase());
            swatch.setAttribute('title', colorName);

            swatch.onclick = () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                // Mostra o nome da cor escolhida — "Branco" e "Prateado" são
                // indistinguíveis só pela bolinha.
                if (colorTitle) colorTitle.innerHTML = `Cor: <span class="color-name">${colorName}</span>`;
                if (actionSection) actionSection.style.display = 'block';
                // A imagem do produto acompanha a cor escolhida.
                aplicarCorNaImagem(prod, index, colorName, colorHex, colorImg);
            };

            colorSwatchesContainer.appendChild(swatch);
        });

        // Select first swatch
        if (colorSwatchesContainer.firstElementChild) {
            colorSwatchesContainer.firstElementChild.click();
        }
    }
};

// Faz a imagem do produto "mudar de cor" ao escolher a amostra.
// Se o produto tiver várias fotos cadastradas, troca a foto pela do índice da
// cor. Sem fotos por cor (caso de hoje), tinge a imagem via filtro CSS calculado
// a partir do hex — hue-rotate para cores vivas, brilho/escala de cinza para
// neutros (preto/branco/prata/cinza), onde girar matiz não faria efeito.
function aplicarCorNaImagem(prod, index, colorName, colorHex, imgUrl) {
    const mainImg = document.getElementById('mainProductImage');
    if (!mainImg) return;
    mainImg.style.transition = 'filter 0.35s ease, opacity 0.25s ease';

    // 0) Foto oficial daquela cor (ex.: iPhone 18). Troca a imagem, sem filtro.
    if (imgUrl) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = imgUrl; mainImg.style.filter = ''; mainImg.style.opacity = '1'; }, 180);
        return;
    }

    // 1) Fotos reais por cor, se existirem.
    if (prod.images && prod.images.length > 1) {
        const nova = prod.images[index % prod.images.length];
        if (nova) {
            mainImg.style.opacity = '0';
            setTimeout(() => { mainImg.src = nova; mainImg.style.opacity = '1'; }, 200);
        }
        mainImg.style.filter = '';
        return;
    }

    // 2) Uma foto só: tinge com filtro RELATIVO à primeira cor.
    // A foto real do produto já está na cor padrão (a primeira amostra), então
    // ela nunca leva filtro — senão um iPhone magenta viraria verde. As outras
    // cores giram o matiz pela diferença em relação à cor base.
    const base = window._corBaseHex || colorHex;
    const [hAlvo, sAlvo, lAlvo] = hexParaHSL(colorHex);
    const [hBase, sBase] = hexParaHSL(base);

    if (colorHex.toLowerCase() === (base || '').toLowerCase()) {
        mainImg.style.filter = '';                // cor padrão = foto original
        return;
    }
    let filtro;
    if (sAlvo < 0.15) {
        // alvo neutro: ajusta luminância/saturação em vez de matiz
        if (lAlvo > 0.75)      filtro = 'saturate(0.15) brightness(1.12)';    // branco/prata
        else if (lAlvo < 0.2)  filtro = 'saturate(0.2) brightness(0.6)';      // preto
        else                   filtro = 'saturate(0.3) brightness(0.92)';     // cinza
    } else {
        let rot = Math.round(hAlvo - hBase);      // diferença de matiz vs. base
        while (rot > 180) rot -= 360;
        while (rot < -180) rot += 360;
        filtro = `hue-rotate(${rot}deg) saturate(1.2)`;
    }
    mainImg.style.filter = filtro;
}

function hexParaHSL(hex) {
    hex = (hex || '#888888').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255,
          g = parseInt(hex.slice(2, 4), 16) / 255,
          b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return [h, s, l];
}

function getColorHexFromName(name) {
    const n = name.toLowerCase();
    if (n.includes('preto') || n.includes('black')) return '#000000';
    if (n.includes('branco') || n.includes('white')) return '#ffffff';
    if (n.includes('azul') || n.includes('blue')) return '#0b2a59';
    if (n.includes('cinza') || n.includes('gray') || n.includes('grey')) return '#8e8e93';
    if (n.includes('prata') || n.includes('silver')) return '#e3e4e5';
    if (n.includes('titanium') || n.includes('titânio')) return '#a4a09c';
    if (n.includes('gold') || n.includes('dourado')) return '#f4e0c8';
    if (n.includes('vermelho') || n.includes('red')) return '#ff3b30';
    if (n.includes('verde') || n.includes('green')) return '#34c759';
    if (n.includes('orange') || n.includes('laranja')) return '#ff9500';
    if (n.includes('rosa') || n.includes('pink')) return '#ff2d55';
    if (n.includes('roxo') || n.includes('purple')) return '#af52de';
    return '#8e8e93'; // Fallback
}

document.addEventListener('DOMContentLoaded', () => {

    // 3. Swipeable Review Cards Logic
    const fakeReviews = [
        { name: "Pedro Carneiro", initial: "P", time: "Há 10 Meses", text: "Produto original, lacrado e com nota fiscal. Recebi antes do prazo e o atendimento pelo WhatsApp tirou todas as minhas dúvidas antes da compra. Voltarei a comprar." },
        { name: "Ana Souza", initial: "A", time: "Há 2 Meses", text: "Comprei e não me arrependo! A qualidade da câmera é surreal e a bateria dura o dia todo. Recomendo demais!" },
        { name: "Carlos Silva", initial: "C", time: "Há 5 Meses", text: "Entrega super rápida e produto impecável. A tela é muito fluida e o design é de cair o queixo." },
        { name: "Mariana Costa", initial: "M", time: "Há 1 Ano", text: "Sempre usei Android e decidi mudar. A transição foi super tranquila e o ecossistema é maravilhoso." },
        { name: "João Paulo", initial: "J", time: "Há 3 Semanas", text: "Achei o preço um pouco salgado, mas a performance justifica cada centavo. Muito satisfeito com a compra." },
        { name: "Fernanda Lima", initial: "F", time: "Há 4 Meses", text: "O aparelho esquenta um pouquinho em jogos pesados, mas de resto é perfeito. As fotos à noite são incríveis." },
        { name: "Ricardo Mendes", initial: "R", time: "Há 8 Meses", text: "Atualizei do iPhone 12 para esse e a diferença de velocidade é notável. Tela muito mais brilhante." },
        { name: "Beatriz Oliveira", initial: "B", time: "Há 1 Mês", text: "Melhor smartphone que já tive. O acabamento em titânio deixa ele muito mais leve e resistente." },
        { name: "Lucas Santos", initial: "L", time: "Há 6 Meses", text: "As novas funções de IA são bem úteis no dia a dia. Valeu o upgrade!" },
        { name: "Juliana Rocha", initial: "J", time: "Há 2 Semanas", text: "Chegou super bem embalado e antes do prazo. Amei a cor e a textura da traseira." }
    ];

    const swipeContainer = document.getElementById('swipeContainer');
    if(swipeContainer) {
        // Fetch products to use actual product images in the review gallery
        LojaAPI.getProducts().then(products => {
            const urlParams = new URLSearchParams(window.location.search);
            let productId = urlParams.get('id');
            let prod = products.find(p => String(p.id) === String(productId));
            if (!prod && products.length > 0) {
                prod = products.find(p => p.name.toLowerCase().includes('iphone')) || products[0];
            }
            
            const prodImg = (prod && prod.images && prod.images[0]) ? prod.images[0] : '/IPHONE%206.webp';
            const prodImg2 = (prod && prod.images && prod.images[1]) ? prod.images[1] : prodImg;
            const prodImg3 = (prod && prod.images && prod.images[2]) ? prod.images[2] : prodImg;
            const prodImg4 = (prod && prod.images && prod.images[3]) ? prod.images[3] : prodImg;

            fakeReviews.reverse().forEach((review, index) => {
                const card = document.createElement('div');
                card.className = 'review-active-card swipe-card';
                card.style.position = 'absolute';
                card.style.width = '100%';
                card.style.backgroundColor = 'var(--bg-card)'; // Match background
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = '20px';
                card.style.padding = '30px';
                card.style.cursor = 'grab';
                card.style.userSelect = 'none';
                card.style.transition = 'transform 0.3s ease';
                card.style.zIndex = index;

                card.innerHTML = `
                    <div class="review-images" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; aspect-ratio: 1/1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="${prodImg}" style="max-height: 90%; max-width: 90%; object-fit: contain;"></div>
                        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; aspect-ratio: 1/1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="${prodImg2}" style="max-height: 90%; max-width: 90%; object-fit: contain;"></div>
                        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; aspect-ratio: 1/1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="${prodImg3}" style="max-height: 90%; max-width: 90%; object-fit: contain;"></div>
                        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; aspect-ratio: 1/1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="${prodImg4}" style="max-height: 90%; max-width: 90%; object-fit: contain;"></div>
                    </div>
                    <div class="review-content-inner" style="background-color: rgba(255,255,255,0.4); padding: 20px; border-radius: 15px;">
                        <div class="review-header">
                            <div class="review-avatar">${review.initial}</div>
                            <h3 class="review-name">${review.name}</h3>
                        </div>
                        <p class="review-message">${review.text}</p>
                        <span class="review-timestamp">${review.time}</span>
                    </div>
                `;

                swipeContainer.appendChild(card);
                setupSwipe(card);
            });
        });

        function setupSwipe(card) {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;

            const onStart = (e) => {
                isDragging = true;
                startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
                card.style.transition = 'none';
                card.style.cursor = 'grabbing';
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
                currentX = x - startX;
                const rotate = currentX * 0.05;
                card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                card.style.cursor = 'grab';
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

                if (Math.abs(currentX) > 100) {
                    // Swipe away
                    const direction = currentX > 0 ? 1 : -1;
                    card.style.transform = `translateX(${direction * window.innerWidth}px) rotate(${direction * 30}deg)`;
                    card.style.opacity = '0';
                    
                    // After animation, reset and move to bottom of stack (infinite loop)
                    setTimeout(() => {
                        card.style.transition = 'none';
                        card.style.transform = 'translateX(0) rotate(0deg)';
                        card.style.opacity = '1';
                        swipeContainer.insertBefore(card, swipeContainer.firstChild); // Move to back
                    }, 300);
                } else {
                    // Snap back
                    card.style.transform = 'translateX(0) rotate(0deg)';
                }
                currentX = 0;
            };

            card.addEventListener('mousedown', onStart);
            card.addEventListener('touchstart', onStart, {passive: true});
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, {passive: false});
            
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        }
    }
});
