// admin-auth.js
// Guarda de acesso do painel.
//
// Isto é apenas a camada de conveniência: esconde a interface de quem não
// está logado e evita telas quebradas. NÃO é a segurança de verdade — o
// navegador é do visitante e qualquer guarda em JS pode ser contornada.
//
// A segurança real está no servidor: /api/produtos só aceita escrita com um
// token de sessão assinado (ver api/admin-login.js). Sem esse token, mesmo
// quem forçar a entrada no painel não consegue alterar nada da loja.
(() => {
    const bruto = localStorage.getItem('adminUser');
    let sessao = null;
    try { sessao = bruto ? JSON.parse(bruto) : null; } catch { sessao = null; }

    const caminho = window.location.pathname.toLowerCase();
    const naTelaDeLogin = caminho.includes('admin-login');

    // Sessão expirada é o mesmo que sessão inexistente. Antes o painel
    // continuava aberto com um token morto, e só quebrava na hora de salvar.
    const expirou = sessao && sessao.expira && Date.now() > sessao.expira;
    if (expirou) {
        localStorage.removeItem('adminUser');
        sessao = null;
    }

    const valido = sessao && sessao.token;

    if (!valido && !naTelaDeLogin) {
        window.location.replace('admin-login');
        throw new Error('Sessão ausente ou expirada. Redirecionando para o login.');
    }

    if (valido && naTelaDeLogin) {
        window.location.replace('admin');
        return;
    }

    if (valido && !naTelaDeLogin) {
        // O <body> das páginas do admin começa com style="display:none" para não
        // "piscar" o painel antes de conferir a sessão. Só o JS revela — e antes
        // ninguém fazia isso, então o painel ficava BRANCO mesmo logado.
        // (O CSS body.admin-body{display:flex} perde para o inline sem !important.)
        const revelarBody = function () { if (document.body) document.body.style.display = 'flex'; };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', revelarBody);
        } else {
            revelarBody();
        }

        const nome = document.querySelector('.admin-profile span');
        if (nome) nome.innerText = sessao.name || 'Administrador';

        if (sessao.role !== 'ceo') {
            document.querySelectorAll('.ceo-only').forEach(el => { el.style.display = 'none'; });
            const paginaDeCeo = caminho.includes('admin-equipe') || caminho.includes('admin-configuracoes');
            if (paginaDeCeo) {
                window.location.replace('admin');
                throw new Error('Acesso restrito ao CEO.');
            }
        }
    }
})();

function adminLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login';
}
