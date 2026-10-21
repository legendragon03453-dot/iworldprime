document.addEventListener('DOMContentLoaded', () => {
    const sidebarHTML = `
        <div class="admin-logo">
            <img src="/IMAGES/LOGO%20WORLD.webp" alt="iWorld Prime">
        </div>
        <nav class="admin-nav">
            <a href="admin.html" class="nav-item" data-path="admin.html"><i class="fa-solid fa-house"></i> Início Geral</a>
            <a href="admin-pedidos.html" class="nav-item" data-path="admin-pedidos.html"><i class="fa-solid fa-bag-shopping"></i> Pedidos</a>
            <a href="admin-produtos.html" class="nav-item" data-path="admin-produtos.html"><i class="fa-solid fa-box"></i> Produtos & Tabela</a>
            <a href="admin-produtos.html#cat-explorer" class="nav-item"><i class="fa-solid fa-layer-group"></i> Produtos por Categoria</a>
            <a href="admin-estatisticas.html" class="nav-item" data-path="admin-estatisticas.html"><i class="fa-solid fa-chart-line"></i> Estatísticas</a>
            <a href="admin-cms.html" class="nav-item" data-path="admin-cms.html"><i class="fa-solid fa-pen-to-square"></i> Gerenciar Site</a>
            <a href="admin-historico.html" class="nav-item" data-path="admin-historico.html"><i class="fa-solid fa-clock-rotate-left"></i> Histórico de Alterações</a>
            <a href="admin-marketing.html" class="nav-item" data-path="admin-marketing.html"><i class="fa-solid fa-bullhorn"></i> Marketing</a>
            <a href="admin-equipe.html" class="nav-item ceo-only" data-path="admin-equipe.html"><i class="fa-solid fa-users"></i> Equipe</a>
            <a href="admin-configuracoes.html" class="nav-item ceo-only" data-path="admin-configuracoes.html"><i class="fa-solid fa-gear"></i> Configurações</a>
            <a href="https://www.mercadopago.com.br/home" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-credit-card"></i> Mercado Pago</a>
            
            <a href="#" onclick="adminLogout()" style="margin-top:auto; color: #ff4d4d;"><i class="fa-solid fa-right-from-bracket"></i> Sair</a>
        </nav>
    `;

    const sidebars = document.querySelectorAll('.admin-sidebar');
    sidebars.forEach(sidebar => {
        sidebar.innerHTML = sidebarHTML;
    });

    // Set active state
    const currentPath = window.location.pathname.split('/').pop() || 'admin.html';
    const navItems = document.querySelectorAll('.admin-nav .nav-item');
    navItems.forEach(item => {
        if(item.dataset.path === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Check CEO only items
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if(adminUser && adminUser.role !== 'ceo') {
        document.querySelectorAll('.ceo-only').forEach(el => el.style.display = 'none');
    }
});
