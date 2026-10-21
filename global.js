// Create and inject Search Modal HTML into body
document.addEventListener('DOMContentLoaded', () => {
    // Render dynamic navbar first
    const renderNavbar = () => {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Suba esta versão sempre que mexer no defaultNavbar. Sem isso, quem já
        // visitou o site fica preso ao menu salvo no localStorage e nunca vê
        // uma categoria nova.
        const NAVBAR_VERSION = 5;

        const defaultNavbar = [
            { name: "Loja", url: "loja", type: "system", visible: true },
            { name: "iPhones", url: "iphone", type: "category", visible: true },
            { name: "Macs", url: "macs", type: "category", visible: true },
            { name: "JBL", url: "jbl", type: "category", visible: true },
            { name: "PlayStation 5", url: "playstation", type: "category", visible: true },
            { name: "Acessórios", url: "acessorios", type: "category", visible: true },
            { name: "Drones", url: "drones", type: "category", visible: true },
            { name: "iPads", url: "ipads", type: "category", visible: false },
            { name: "Simular Troca", url: "simulador", type: "system", visible: true },
            { name: "Suporte", url: "suporte", type: "system", visible: true }
        ];

        const versaoSalva = parseInt(localStorage.getItem('navbar_menu_version') || '0', 10);
        let menuConfig = JSON.parse(localStorage.getItem('navbar_menu_config'));

        if (!menuConfig || !Array.isArray(menuConfig) || menuConfig.length === 0 || versaoSalva < NAVBAR_VERSION) {
            menuConfig = defaultNavbar;
            localStorage.setItem('navbar_menu_config', JSON.stringify(defaultNavbar));
            localStorage.setItem('navbar_menu_version', String(NAVBAR_VERSION));
        }

        const visibleItems = menuConfig.filter(item => item.visible);
        const currentPath = window.location.pathname.toLowerCase();
        
        let html = '';
        visibleItems.forEach(item => {
            const isActive = currentPath.includes(item.url.toLowerCase().split('?')[0]);
            html += `<li><a href="${item.url}" class="${isActive ? 'active' : ''}">${item.name}</a></li>`;
        });
        
        navLinks.innerHTML = html;
    };
    renderNavbar();

    const modalHTML = `
        <div id="searchModal" class="search-modal-overlay">
            <div class="search-modal-content">
                <button id="closeSearchBtn" class="close-search"><i class="fa-solid fa-xmark"></i></button>
                <div class="search-input-group">
                    <i class="fa-solid fa-magnifying-glass search-icon-left"></i>
                    <input type="text" id="searchInput" placeholder="Buscar produtos, marcas, etc...">
                </div>
                <div class="search-results">
                    <!-- Fake results for demonstration -->
                    <div class="search-suggestion">iPhone 17 Pro Max</div>
                    <div class="search-suggestion">MacBook Air M4</div>
                    <div class="search-suggestion">JBL Boombox 4</div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const searchModal = document.getElementById('searchModal');
    const closeBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.querySelector('.search-results');
    let allProductsList = [];

    // Global function to open modal
    window.openSearchModal = function(e) {
        if(e) e.preventDefault();
        searchModal.classList.add('active');
        setTimeout(() => searchInput.focus(), 100);
        
        // Pre-load products if empty
        if (allProductsList.length === 0 && typeof LojaAPI !== 'undefined') {
            LojaAPI.getProducts().then(prods => {
                allProductsList = prods || [];
                updateSearchSuggestions('');
            });
        } else {
            updateSearchSuggestions(searchInput.value || '');
        }
    }

    // Close modal
    closeBtn.addEventListener('click', () => {
        searchModal.classList.remove('active');
    });

    // Close on overlay click
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('active');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            searchModal.classList.remove('active');
        }
    });

    function updateSearchSuggestions(query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        
        const trimmed = query.trim().toLowerCase();
        
        let filtered = [];
        if (trimmed === '') {
            // Show first 3 suggestions
            filtered = allProductsList.slice(0, 3);
        } else {
            // Filter by name or description
            filtered = allProductsList.filter(p => 
                (p.name || '').toLowerCase().includes(trimmed) || 
                (p.description || '').toLowerCase().includes(trimmed)
            ).slice(0, 5);
        }
        
        if (filtered.length === 0) {
            searchResultsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.4); padding: 15px; font-size: 14px; text-align: center;">Nenhum produto encontrado.</div>';
            return;
        }
        
        filtered.forEach(p => {
            const row = document.createElement('div');
            row.className = 'search-suggestion';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '15px';
            row.style.padding = '12px 15px';
            row.style.cursor = 'pointer';
            row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            row.style.transition = 'background 0.2s';
            
            row.innerHTML = `
                <img src="${p.images[0]}" alt="${p.name}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px; background: #fff; padding: 2px;">
                <div style="flex: 1; text-align: left;">
                    <div style="font-weight: 500; font-size: 14px; color: #fff;">${p.name}</div>
                    <div style="font-size: 12px; color: #aaaaaa;">R$ ${p.price}</div>
                </div>
            `;
            
            row.onclick = () => {
                window.location.href = `detalhes.html?id=${p.id}`;
            };
            
            searchResultsContainer.appendChild(row);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            updateSearchSuggestions(e.target.value);
        });
    }

    // Mobile Menu Toggle (hamburguer -> revela menu)
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navBar = document.querySelector('.navbar');

    if (mobileMenuBtn && navLinks && navBar) {
        const iconsContainer = navBar.querySelector('.nav-icons-container');
        const mq = window.matchMedia('(max-width: 900px)');

        // Guarda a posição original dos ícones (para restaurar no desktop)
        const iconsHome = iconsContainer
            ? { parent: iconsContainer.parentNode, next: iconsContainer.nextSibling }
            : null;

        function setIcon(open) {
            const icon = mobileMenuBtn.querySelector('i');
            if (!icon) return;
            icon.classList.toggle('fa-bars', !open);
            icon.classList.toggle('fa-xmark', open);
        }

        function closeMenu() {
            navLinks.classList.remove('active');
            setIcon(false);
        }

        function openMenu() {
            navLinks.classList.add('active');
            setIcon(true);
        }

        // No mobile move os ícones (carrinho/conta/busca) para dentro do menu;
        // no desktop restaura a posição original.
        function placeIcons() {
            if (!iconsContainer) return;
            if (mq.matches) {
                if (iconsContainer.parentNode !== navLinks) {
                    navLinks.appendChild(iconsContainer);
                }
            } else {
                if (iconsHome && iconsContainer.parentNode !== iconsHome.parent) {
                    iconsHome.parent.insertBefore(iconsContainer, iconsHome.next);
                }
                closeMenu();
            }
        }

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.contains('active') ? closeMenu() : openMenu();
        });

        // Fecha o menu ao clicar em um link/ícone
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMenu);
        });

        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                closeMenu();
            }
        });

        // Reage à mudança de tamanho de tela
        if (mq.addEventListener) {
            mq.addEventListener('change', placeIcons);
        } else if (mq.addListener) {
            mq.addListener(placeIcons);
        }
        placeIcons();
    }

    // Dynamic Navbar Contrast Logic
    const navbarWrapper = document.getElementById('navbar') || document.querySelector('.navbar-wrapper');
    
    function updateNavbarContrast() {
        if (!navbarWrapper) return;
        
        // 1. Check if we are on a page that is known to have a white/light top background (like detalhes.html)
        if (document.body.classList.contains('details-page')) {
            navbarWrapper.classList.add('light-theme');
            return;
        }

        // 2. Get the position of the navbar
        const rect = navbarWrapper.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        // Check slightly below the navbar to detect the background color it is overlapping/about to overlap
        const y = rect.bottom + 5; 
        
        // Temporarily change visibility of navbar so we don't pick it up
        const originalPointerEvents = navbarWrapper.style.pointerEvents;
        const originalVisibility = navbarWrapper.style.visibility;
        
        navbarWrapper.style.pointerEvents = 'none';
        navbarWrapper.style.visibility = 'hidden';
        
        let elementBehind = document.elementFromPoint(x, y);
        
        navbarWrapper.style.pointerEvents = originalPointerEvents;
        navbarWrapper.style.visibility = originalVisibility;
        
        if (!elementBehind) return;
        
        // Traverse up to find the background color of the element behind the navbar
        let isLightBackground = false;
        let currentEl = elementBehind;
        while (currentEl && currentEl !== document.documentElement) {
            const computedStyle = window.getComputedStyle(currentEl);
            const bgColor = computedStyle.backgroundColor;
            
            if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                const rgb = bgColor.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const r = parseInt(rgb[0]);
                    const g = parseInt(rgb[1]);
                    const b = parseInt(rgb[2]);
                    // Relative luminance formula
                    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    if (luma > 150) { // Closer to 255 (white)
                        isLightBackground = true;
                    }
                    break;
                }
            }
            currentEl = currentEl.parentElement;
        }
        
        if (isLightBackground) {
            navbarWrapper.classList.add('light-theme');
        } else {
            navbarWrapper.classList.remove('light-theme');
        }
    }
    
    // Run contrast update on load, scroll, and resize
    if (navbarWrapper) {
        updateNavbarContrast();
        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateNavbarContrast);
        }, { passive: true });
        window.addEventListener('resize', updateNavbarContrast, { passive: true });
    }

    // Dynamic Cart Badge injection
    const cartLink = document.querySelector('a[href="carrinho"]');
    if (cartLink && !cartLink.querySelector('.cart-badge')) {
        cartLink.style.position = 'relative';
        cartLink.innerHTML += `
            <span class="cart-badge" style="
                display: none;
                position: absolute;
                top: -8px;
                right: -10px;
                background: #CEE7E6;
                color: #000;
                font-size: 10px;
                font-weight: bold;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                align-items: center;
                justify-content: center;
            ">0</span>
        `;
    }

    window.updateCartBadge = function() {
        const badge = document.querySelector('.cart-badge');
        if(!badge) return;
        
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    };
    
    // Initial badge update
    window.updateCartBadge();
});

// ---------------------------------------------------------------------------
// Toast global: um cardzinho no canto em vez de alert() do navegador.
// Uso: mostrarToast('mensagem', 'info'|'sucesso'|'aviso'|'erro', duracaoMs)
// ---------------------------------------------------------------------------
window.mostrarToast = function (mensagem, tipo, duracaoMs) {
    tipo = tipo || 'info';
    duracaoMs = duracaoMs || 4200;
    let host = document.getElementById('toastHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:100000;display:flex;flex-direction:column;gap:12px;max-width:360px;pointer-events:none;';
        document.body.appendChild(host);
    }
    const cores = { info: '#2E5BFF', sucesso: '#2fa84f', aviso: '#e0954a', erro: '#e0574a' };
    const icones = { info: 'fa-circle-info', sucesso: 'fa-circle-check', aviso: 'fa-triangle-exclamation', erro: 'fa-circle-xmark' };
    const cor = cores[tipo] || cores.info;
    const card = document.createElement('div');
    card.style.cssText = `pointer-events:auto;background:#0d1526;color:#fff;border-left:4px solid ${cor};border-radius:14px;padding:15px 18px;box-shadow:0 12px 34px rgba(0,0,0,.3);font-size:14px;line-height:1.45;display:flex;gap:12px;align-items:flex-start;transform:translateX(130%);opacity:0;transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .4s;`;
    card.innerHTML = `<i class="fa-solid ${icones[tipo] || icones.info}" style="color:${cor};font-size:18px;margin-top:1px;flex-shrink:0;"></i><span>${mensagem}</span>`;
    host.appendChild(card);
    requestAnimationFrame(() => { card.style.transform = 'translateX(0)'; card.style.opacity = '1'; });
    setTimeout(() => {
        card.style.transform = 'translateX(130%)'; card.style.opacity = '0';
        setTimeout(() => card.remove(), 450);
    }, duracaoMs);
    return card;
};

// ---------------------------------------------------------------------------
// Checkout com cadastro do cliente.
// Antes de ir ao Mercado Pago, o cliente preenche seus dados (nome, WhatsApp,
// e-mail, endereço). O servidor SALVA o pedido no banco e cria o pagamento.
// Usado tanto pelo carrinho quanto pelo "Comprar agora" da página de produto.
// ---------------------------------------------------------------------------
// Desconto Pix (global). O percentual vem do servidor (/api/cupons?config=1),
// com fallback de 10%. Serve para exibir o preço "à vista no Pix" nos preços
// do site — a cobrança de verdade acontece no checkout (mercadopago.js).
// ---------------------------------------------------------------------------
window.DESCONTO_PIX = window.DESCONTO_PIX || 10;
window.precoPix = function (valor) {
    const pct = window.DESCONTO_PIX || 10;
    return Math.round(valor * (1 - pct / 100) * 100) / 100;
};
window.precoPixFmt = function (valor) {
    return window.precoPix(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
// Linha "ou R$ X à vista no Pix (-10%)" usada nos cards e páginas de produto.
window.linhaPix = function (valor) {
    const n = parseFloat(valor);
    if (!Number.isFinite(n) || n <= 0) return '';
    const pct = window.DESCONTO_PIX || 10;
    return `<p class="linha-pix" style="margin:4px 0 0;font-size:13px;color:#12a150;font-weight:600;text-align:center;">ou <span data-pix-base="${n}">${window.precoPixFmt(n)}</span> à vista no Pix <span style="opacity:.85;font-weight:500;">(-${pct}%)</span></p>`;
};
(function carregarDescontoPix() {
    fetch('/api/cupons?config=1').then(r => r.json()).then(d => {
        if (!d || !Number.isFinite(+d.desconto_pix)) return;
        window.DESCONTO_PIX = +d.desconto_pix;
        // Recalcula os preços de Pix já pintados na tela com o % correto.
        document.querySelectorAll('[data-pix-base]').forEach(el => {
            const base = parseFloat(el.getAttribute('data-pix-base'));
            if (Number.isFinite(base)) el.textContent = window.precoPixFmt(base);
        });
        document.querySelectorAll('.linha-pix [style*="opacity"]').forEach(el => {
            el.textContent = `(-${window.DESCONTO_PIX}%)`;
        });
    }).catch(() => {});
})();

// ---------------------------------------------------------------------------
// Checkout: coleta os dados do cliente, deixa escolher Pix (com desconto) ou
// cartão, aplicar cupom, e então cria o pedido + abre o Mercado Pago.
// items = [{ id, quantity, price?, name? }]
// ---------------------------------------------------------------------------
window.iniciarCheckout = function (items, opts) {
    opts = opts || {};
    items = (items || []).filter(i => i && i.id != null);
    if (!items.length) {
        if (window.mostrarToast) mostrarToast('Seu carrinho está vazio.', 'aviso');
        return;
    }

    // Reaproveita os dados de quem já comprou antes (neste navegador).
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem('clienteDados') || '{}'); } catch (e) {}
    const v = (k) => (salvo[k] ? String(salvo[k]).replace(/"/g, '&quot;') : '');

    const antigo = document.getElementById('checkoutOverlay');
    if (antigo) antigo.remove();

    const ov = document.createElement('div');
    ov.id = 'checkoutOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(6,10,20,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px;';
    ov.innerHTML = `
      <div style="background:#fff;color:#1a1a1a;border-radius:20px;max-width:520px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 24px 8px;">
          <h2 style="margin:0;font-size:20px;font-weight:700;">Seus dados para entrega</h2>
          <button type="button" id="chkFechar" aria-label="Fechar" style="background:none;border:none;font-size:22px;cursor:pointer;color:#888;line-height:1;">&times;</button>
        </div>
        <p style="margin:0 24px 14px;color:#6b7280;font-size:13px;">Precisamos destes dados para enviar seu pedido e falar com você pelo WhatsApp.</p>
        <form id="chkForm" style="padding:0 24px 22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <label style="grid-column:1/3;font-size:13px;font-weight:600;">Nome completo
            <input name="nome" required value="${v('nome')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">WhatsApp / Telefone
            <input name="telefone" required placeholder="(71) 99999-9999" value="${v('telefone')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">E-mail
            <input name="email" type="email" required value="${v('email')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">CEP
            <input name="cep" required placeholder="00000-000" value="${v('cep')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">Cidade
            <input name="cidade" required value="${v('cidade')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="grid-column:1/3;font-size:13px;font-weight:600;">Endereço (rua/avenida)
            <input name="endereco" required value="${v('endereco')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">Número
            <input name="numero" required value="${v('numero')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">Estado (UF)
            <input name="estado" required maxlength="2" placeholder="BA" value="${v('estado')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;text-transform:uppercase;">
          </label>
          <label style="font-size:13px;font-weight:600;">Bairro
            <input name="bairro" value="${v('bairro')}" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;font-weight:600;">Complemento
            <input name="complemento" value="${v('complemento')}" placeholder="Apto, bloco (opcional)" style="width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;box-sizing:border-box;">
          </label>
          <div style="grid-column:1/3;border-top:1px solid #eef0f3;margin-top:6px;padding-top:14px;">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Cupom de desconto</label>
            <div style="display:flex;gap:8px;">
              <input id="chkCupom" placeholder="Ex: APPLE10" style="flex:1;padding:11px 12px;border:1px solid #d8dbe0;border-radius:10px;font-size:14px;text-transform:uppercase;box-sizing:border-box;">
              <button type="button" id="chkAplicarCupom" style="background:#eef1f6;border:1px solid #d8dbe0;border-radius:10px;padding:0 16px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;">Aplicar</button>
            </div>
            <div id="chkCupomMsg" style="font-size:12px;margin-top:6px;display:none;"></div>
          </div>
          <div style="grid-column:1/3;margin-top:4px;">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px;">Forma de pagamento</label>
            <div style="display:flex;gap:10px;">
              <button type="button" data-pag="pix" class="chkPag" style="flex:1;padding:12px;border:2px solid #12a150;background:#eafaf0;border-radius:12px;cursor:pointer;text-align:left;">
                <div style="font-weight:700;font-size:14px;color:#0f7a3d;"><i class="fa-brands fa-pix"></i> Pix <span style="background:#12a150;color:#fff;font-size:11px;padding:2px 7px;border-radius:20px;margin-left:2px;">-<span class="pixPctLbl">10</span>%</span></div>
                <div style="font-size:12px;color:#3a7a55;margin-top:3px;">Aprovação na hora</div>
              </button>
              <button type="button" data-pag="cartao" class="chkPag" style="flex:1;padding:12px;border:2px solid #e2e5ea;background:#fff;border-radius:12px;cursor:pointer;text-align:left;">
                <div style="font-weight:700;font-size:14px;color:#1a1a1a;"><i class="fa-solid fa-credit-card"></i> Cartão / Boleto</div>
                <div style="font-size:12px;color:#6b7280;margin-top:3px;">Parcele em até 12x</div>
              </button>
            </div>
          </div>
          <div id="chkResumo" style="grid-column:1/3;margin-top:12px;background:#f7f8fa;border-radius:12px;padding:12px 14px;font-size:14px;display:grid;gap:5px;"></div>
          <div id="chkErro" style="grid-column:1/3;color:#e0574a;font-size:13px;display:none;"></div>
          <button type="submit" id="chkEnviar" style="grid-column:1/3;margin-top:6px;background:#0d1526;color:#fff;border:none;border-radius:50px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
            <i class="fa-solid fa-lock"></i> Ir para o pagamento seguro
          </button>
          <p style="grid-column:1/3;text-align:center;color:#9aa0aa;font-size:11px;margin:2px 0 0;">Pagamento processado pelo Mercado Pago com total segurança.</p>
        </form>
      </div>`;
    document.body.appendChild(ov);

    const fechar = () => ov.remove();
    ov.querySelector('#chkFechar').onclick = fechar;
    ov.addEventListener('click', (e) => { if (e.target === ov) fechar(); });

    // --- Subtotal a partir dos itens (ou do carrinho salvo, se o item não
    //     trouxe preço). É só para EXIBIR; quem cobra é o servidor. ---
    let carrinho = [];
    try { carrinho = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (er) {}
    const doCarrinho = (id) => carrinho.find(c => String(c.id) === String(id)) || {};
    const linhasResumo = items.map(i => {
        const c = doCarrinho(i.id);
        const price = i.price != null ? parseFloat(i.price) : parseFloat(c.price);
        return { id: i.id, q: i.quantity || 1, price: Number.isFinite(price) ? price : 0 };
    });
    const subtotal = linhasResumo.reduce((s, l) => s + l.price * l.q, 0);

    let pagamento = 'pix';
    let cupom = null; // { codigo, tipo, valor, desconto }
    const pct = () => (window.DESCONTO_PIX || 10);
    const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    ov.querySelectorAll('.pixPctLbl').forEach(e => e.textContent = pct());

    const resumoEl = ov.querySelector('#chkResumo');
    function recalc() {
        const btnR = ov.querySelector('#chkEnviar');
        if (subtotal <= 0) {
            resumoEl.style.display = 'none';
            if (btnR && !btnR.disabled) btnR.innerHTML = '<i class="fa-solid fa-lock"></i> Ir para o pagamento seguro';
            return;
        }
        const cupomDesc = cupom ? Math.min(cupom.desconto, subtotal) : 0;
        const base = subtotal - cupomDesc;
        const pixDesc = pagamento === 'pix' ? Math.round(base * pct() / 100 * 100) / 100 : 0;
        const total = Math.max(0, Math.round((subtotal - cupomDesc - pixDesc) * 100) / 100);
        const linhas = [`<div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>`];
        if (cupomDesc > 0) linhas.push(`<div style="display:flex;justify-content:space-between;color:#12a150;"><span>Cupom ${cupom.codigo}</span><span>- ${fmt(cupomDesc)}</span></div>`);
        if (pixDesc > 0) linhas.push(`<div style="display:flex;justify-content:space-between;color:#12a150;"><span>Desconto Pix (${pct()}%)</span><span>- ${fmt(pixDesc)}</span></div>`);
        linhas.push(`<div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;margin-top:4px;border-top:1px solid #e6e8ec;padding-top:8px;"><span>Total</span><span>${fmt(total)}</span></div>`);
        resumoEl.innerHTML = linhas.join('');
        const btn2 = ov.querySelector('#chkEnviar');
        if (btn2 && !btn2.disabled) btn2.innerHTML = `<i class="fa-solid fa-lock"></i> Pagar ${fmt(total)}`;
    }
    recalc();

    ov.querySelectorAll('.chkPag').forEach(b => b.onclick = () => {
        pagamento = b.getAttribute('data-pag');
        ov.querySelectorAll('.chkPag').forEach(x => {
            const on = x === b;
            const ehPix = x.getAttribute('data-pag') === 'pix';
            x.style.border = '2px solid ' + (on ? (ehPix ? '#12a150' : '#0d1526') : '#e2e5ea');
            x.style.background = on ? (ehPix ? '#eafaf0' : '#f2f4f8') : '#fff';
        });
        recalc();
    });

    ov.querySelector('#chkAplicarCupom').onclick = async () => {
        const code = (ov.querySelector('#chkCupom').value || '').trim().toUpperCase();
        const msg = ov.querySelector('#chkCupomMsg');
        if (!code) return;
        msg.style.display = 'block'; msg.style.color = '#6b7280'; msg.textContent = 'Validando...';
        try {
            const r = await fetch(`/api/cupons?codigo=${encodeURIComponent(code)}&subtotal=${subtotal}`);
            const d = await r.json();
            if (d && d.valido) {
                cupom = { codigo: d.codigo, tipo: d.tipo, valor: d.valor, desconto: d.desconto };
                msg.style.color = '#12a150';
                msg.textContent = `Cupom ${d.codigo} aplicado! ${d.descricao || ''}`.trim();
            } else {
                cupom = null; msg.style.color = '#e0574a';
                msg.textContent = (d && d.motivo) || 'Cupom inválido.';
            }
        } catch (er) {
            cupom = null; msg.style.color = '#e0574a'; msg.textContent = 'Não foi possível validar agora.';
        }
        recalc();
    };

    // Cupom já validado na página de produto: preenche e aplica sozinho.
    if (opts.cupom) {
        const inp = ov.querySelector('#chkCupom');
        if (inp) { inp.value = opts.cupom; ov.querySelector('#chkAplicarCupom').click(); }
    }

    ov.querySelector('#chkForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const erroEl = ov.querySelector('#chkErro');
        const btn = ov.querySelector('#chkEnviar');
        erroEl.style.display = 'none';
        const fd = new FormData(e.target);
        const cliente = {};
        fd.forEach((val, k) => cliente[k] = String(val).trim());
        cliente.estado = (cliente.estado || '').toUpperCase();

        // Guarda para a próxima compra.
        try { localStorage.setItem('clienteDados', JSON.stringify(cliente)); } catch (er) {}

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Abrindo pagamento...';
        try {
            const r = await fetch('/api/mercadopago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(i => ({ id: i.id, quantity: i.quantity || 1 })),
                    cliente,
                    pagamento,
                    cupom: cupom ? cupom.codigo : null
                })
            });
            const data = await r.json();
            if (!r.ok) {
                erroEl.textContent = data.error || 'Não foi possível continuar. Confira seus dados.';
                erroEl.style.display = 'block';
                btn.disabled = false;
                recalc();
                return;
            }
            const url = data.init_point || data.sandbox_init_point;
            if (!url) { erroEl.textContent = 'Erro ao abrir o pagamento. Tente de novo.'; erroEl.style.display = 'block'; btn.disabled = false; recalc(); return; }
            window.location.href = url;
        } catch (er) {
            erroEl.textContent = 'Falha de conexão. Tente novamente.';
            erroEl.style.display = 'block';
            btn.disabled = false;
            recalc();
        }
    });
};

// ---------------------------------------------------------------------------
// Botão flutuante de WhatsApp (canto inferior direito).
// ---------------------------------------------------------------------------
(function () {
    function montarWhats() {
        if (document.getElementById('waFloat')) return;
        const msg = encodeURIComponent('Olá! Vim pelo site da iWorld Prime e gostaria de mais informações.');
        const a = document.createElement('a');
        a.id = 'waFloat';
        a.href = 'https://wa.me/5571992712952?text=' + msg;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Falar no WhatsApp');
        a.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        a.style.cssText = 'position:fixed;right:20px;bottom:20px;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:31px;box-shadow:0 8px 26px rgba(0,0,0,.28);z-index:9998;text-decoration:none;transition:transform .2s ease;animation:waPulse 2.4s ease-in-out infinite;';
        a.onmouseenter = () => a.style.transform = 'scale(1.08)';
        a.onmouseleave = () => a.style.transform = 'scale(1)';
        if (!document.getElementById('waFloatStyle')) {
            const st = document.createElement('style');
            st.id = 'waFloatStyle';
            st.textContent = '@keyframes waPulse{0%,100%{box-shadow:0 8px 26px rgba(0,0,0,.28),0 0 0 0 rgba(37,211,102,.5)}50%{box-shadow:0 8px 26px rgba(0,0,0,.28),0 0 0 12px rgba(37,211,102,0)}}@media(max-width:600px){#waFloat{width:52px;height:52px;font-size:27px;right:16px;bottom:16px}}';
            document.head.appendChild(st);
        }
        document.body.appendChild(a);
    }
    if (document.body) montarWhats();
    else document.addEventListener('DOMContentLoaded', montarWhats);
})();
