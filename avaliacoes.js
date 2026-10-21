// avaliacoes.js
// Avaliações escritas pelos próprios clientes, por produto, sem foto.
//
// Guarda em duas camadas:
//   1. Supabase (tabela `avaliacoes`) — compartilhado entre todos os visitantes.
//      Precisa rodar o supabase-reviews.sql uma vez (leitura pública + insert
//      anônimo). Enquanto não rodar, cai no passo 2 sozinho.
//   2. localStorage — se o Supabase não responder, a avaliação fica salva no
//      navegador de quem escreveu, e o site não quebra.
//
// iPhone 18 Pro nasce com algumas avaliações de exemplo (fakes) e o contador
// aparece; os demais produtos começam do zero e só mostram o que for real.

(function () {
    const TABELA = 'avaliacoes';

    function slug(s) {
        return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Agrupa por modelo: "iPhone 13 256GB" e "iPhone 13 512GB" compartilham
    // avaliações. Seminovo tem chave própria (o "seminovo" fica no slug).
    function chaveProduto(nome) {
        const base = (nome || '').replace(/\b\d+\s*(gb|tb)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
        return slug(base) || 'produto';
    }

    const ehIphone18 = (chave) => chave.includes('iphone-18');

    // ---- Fakes só do iPhone 18 Pro -----------------------------------------
    const FAKES_IPHONE18 = [
        { nome: 'Rafael Andrade',   nota: 5, texto: 'Comprei assim que chegou. A câmera de 48MP é absurda e o design ficou lindo. Atendimento nota 10.', dias: 3 },
        { nome: 'Camila Ferreira',  nota: 5, texto: 'Vim do 15 Pro e a diferença de fluidez é nítida. Tela linda e a bateria dura o dia inteiro tranquilo.', dias: 6 },
        { nome: 'Bruno Almeida',    nota: 5, texto: 'Loja séria, produto lacrado e com nota fiscal. Recomendo demais, já é o terceiro que compro aqui.', dias: 8 },
        { nome: 'Larissa Gomes',    nota: 4, texto: 'Amei o aparelho, só achei o preço um pouco alto — mas entregou tudo que prometeram. Vale a pena.', dias: 11 },
        { nome: 'Diego Martins',    nota: 5, texto: 'Chegou antes do prazo, super bem embalado. O magenta ao vivo é ainda mais bonito.', dias: 14 },
        { nome: 'Patrícia Rocha',   nota: 5, texto: 'Melhor iPhone que já tive. As fotos à noite ficaram impecáveis. Suporte pelo WhatsApp muito atencioso.', dias: 17 },
        { nome: 'Thiago Nunes',     nota: 5, texto: 'Desempenho monstruoso, abro qualquer app na hora. Jogos rodando liso. Recomendo a iWorld.', dias: 20 },
        { nome: 'Aline Souza',      nota: 4, texto: 'Produto excelente e original. Esquenta um pouco em uso pesado, mas nada que atrapalhe.', dias: 23 },
        { nome: 'Marcelo Dias',     nota: 5, texto: 'Comprei pra minha esposa e ela amou. Processo de compra transparente do início ao fim.', dias: 27 },
        { nome: 'Juliana Prado',    nota: 5, texto: 'Entrega rápida pra minha cidade e com rastreio. Aparelho perfeito, sem nenhum arranhão.', dias: 30 },
        { nome: 'Gustavo Ribeiro',  nota: 5, texto: 'A tela ProMotion faz toda diferença. Vale cada centavo. Já indiquei pra dois amigos.', dias: 34 },
        { nome: 'Fernanda Lima',    nota: 5, texto: 'Confiança total nessa loja. Nota fiscal e garantia certinho. iPhone 18 Pro é outro nível.', dias: 38 },
        { nome: 'Rodrigo Teixeira', nota: 4, texto: 'Muito bom. Só demorou 1 dia a mais que o previsto, mas avisaram tudo pelo WhatsApp.', dias: 42 },
        { nome: 'Beatriz Cardoso',  nota: 5, texto: 'Simplesmente perfeito. Câmera, tela, bateria… tudo excelente. Comprarei de novo aqui.', dias: 47 },
        { nome: 'Vinícius Barros',  nota: 5, texto: 'Compra tranquila e comunicação ótima. O aparelho superou minhas expectativas.', dias: 52 },
        { nome: 'Letícia Moraes',   nota: 5, texto: 'Adorei! Vim de Android e a transição foi super fácil. Recomendo a loja de olhos fechados.', dias: 58 },
        { nome: 'Eduardo Pires',    nota: 5, texto: 'Titânio deixa ele leve e resistente. Zoom óptico ficou surreal. Loja confiável.', dias: 63 },
        { nome: 'Natália Fonseca',  nota: 4, texto: 'Produto maravilhoso e original. Tirei uma estrela só porque queria mais opção de cor.', dias: 70 }
    ];

    function tempoAtras(iso) {
        if (!iso) return '';
        const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (d <= 0) return 'Hoje';
        if (d === 1) return 'Ontem';
        if (d < 30) return `Há ${d} dias`;
        const m = Math.floor(d / 30);
        if (m === 1) return 'Há 1 mês';
        if (m < 12) return `Há ${m} meses`;
        const a = Math.floor(m / 12);
        return a === 1 ? 'Há 1 ano' : `Há ${a} anos`;
    }

    function estrelasHTML(n, tamanho) {
        n = Math.round(n) || 0;
        let s = '';
        for (let i = 1; i <= 5; i++) {
            s += `<i class="fa-${i <= n ? 'solid' : 'regular'} fa-star" style="font-size:${tamanho || 13}px;"></i>`;
        }
        return `<span style="color:#f5a623;">${s}</span>`;
    }

    async function carregar(chave) {
        try {
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from(TABELA).select('*').eq('produto', chave).order('criado_em', { ascending: false });
                if (error) throw error;
                if (Array.isArray(data)) return data;
            }
            throw new Error('sem client');
        } catch (e) {
            try { return JSON.parse(localStorage.getItem('aval_' + chave) || '[]'); }
            catch (_) { return []; }
        }
    }

    async function salvar(chave, rec) {
        try {
            if (window.supabaseClient) {
                const { error } = await window.supabaseClient.from(TABELA).insert(rec);
                if (error) throw error;
                return 'nuvem';
            }
            throw new Error('sem client');
        } catch (e) {
            try {
                const arr = JSON.parse(localStorage.getItem('aval_' + chave) || '[]');
                arr.unshift(rec);
                localStorage.setItem('aval_' + chave, JSON.stringify(arr));
                return 'local';
            } catch (_) { return false; }
        }
    }

    function corAvatar(nome) {
        const cores = ['#2E5BFF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#0EA5E9', '#6366F1'];
        let h = 0; for (const c of (nome || '?')) h = (h + c.charCodeAt(0)) % cores.length;
        return cores[h];
    }

    function render(chave, reais) {
        const fakes = ehIphone18(chave)
            ? FAKES_IPHONE18.map(f => ({ nome: f.nome, nota: f.nota, texto: f.texto,
                criado_em: new Date(Date.now() - f.dias * 86400000).toISOString() }))
            : [];
        const todas = [...reais.map(r => ({ nome: r.nome, nota: r.nota, texto: r.texto, criado_em: r.criado_em })), ...fakes]
            .sort((a, b) => new Date(b.criado_em || 0) - new Date(a.criado_em || 0));

        const total = todas.length;
        const media = total ? todas.reduce((s, r) => s + (Number(r.nota) || 5), 0) / total : 0;

        const elMedia = document.getElementById('avalMedia');
        const elTotal = document.getElementById('avalTotal');
        const elResumo = document.getElementById('avalEstrelasResumo');
        if (elMedia) elMedia.textContent = total ? media.toFixed(1) : '—';
        if (elTotal) elTotal.textContent = total.toLocaleString('pt-BR');
        if (elResumo) elResumo.innerHTML = total ? estrelasHTML(media, 18) : '';

        const lista = document.getElementById('avalLista');
        if (!lista) return;
        lista.innerHTML = '';
        if (!total) {
            lista.innerHTML = '<div id="avalVazio" style="color:var(--text-secondary); font-size:14px; text-align:center; padding:24px;">Seja o primeiro a avaliar este produto.</div>';
            return;
        }
        todas.forEach(r => {
            const nome = r.nome || 'Cliente';
            const card = document.createElement('div');
            card.className = 'aval-card';
            card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:14px; padding:16px 18px;';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                    <div style="width:40px; height:40px; border-radius:50%; background:${corAvatar(nome)}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0;">${nome.trim().charAt(0).toUpperCase()}</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; color:var(--text-primary); font-size:15px;">${nome}</div>
                        <div>${estrelasHTML(r.nota, 12)} <span style="color:var(--text-secondary); font-size:12px; margin-left:6px;">${tempoAtras(r.criado_em)}</span></div>
                    </div>
                </div>
                <p style="color:var(--text-secondary); font-size:14px; line-height:1.5; margin:0;">${(r.texto || '').replace(/</g, '&lt;')}</p>`;
            lista.appendChild(card);
        });
    }

    window.iniciarAvaliacoes = async function (prod) {
        if (!prod || !prod.name) return;
        const chave = chaveProduto(prod.name);

        // Seletor de estrelas do formulário
        let nota = 0;
        const stars = Array.from(document.querySelectorAll('#avalNotaStars i'));
        const pintar = (n) => stars.forEach(s => {
            s.style.color = Number(s.dataset.n) <= n ? '#f5a623' : '#d0d0d0';
        });
        stars.forEach(s => {
            s.style.cursor = 'pointer';
            s.addEventListener('mouseenter', () => pintar(Number(s.dataset.n)));
            s.addEventListener('click', () => { nota = Number(s.dataset.n); pintar(nota); });
        });
        const contInput = document.getElementById('avalNotaStars');
        if (contInput) contInput.addEventListener('mouseleave', () => pintar(nota));

        const form = document.getElementById('avalForm');
        const msg = document.getElementById('avalMsg');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nome = (document.getElementById('avalNome').value || '').trim();
                const texto = (document.getElementById('avalTexto').value || '').trim();
                if (!nome || !texto) { if (msg) msg.textContent = 'Preencha nome e comentário.'; return; }
                if (!nota) { if (msg) { msg.textContent = 'Escolha de 1 a 5 estrelas.'; msg.style.color = '#e0574a'; } return; }
                const btn = document.getElementById('avalEnviar');
                if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
                const rec = { produto: chave, nome, nota, texto, criado_em: new Date().toISOString() };
                await salvar(chave, rec);
                if (msg) { msg.style.color = '#2fa84f'; msg.textContent = 'Avaliação publicada. Obrigado!'; }
                form.reset(); nota = 0; pintar(0);
                if (btn) { btn.disabled = false; btn.textContent = 'Publicar avaliação'; }
                const reais = await carregar(chave);
                render(chave, reais);
            });
        }

        const reais = await carregar(chave);
        render(chave, reais);
    };
})();
