// Simulador de troca (trade-in): o cliente escolhe o iPhone que TEM e o que
// QUER, e vê a diferença a pagar. Os preços do "quer" vêm do catálogo (sempre
// atualizados). O valor de avaliação do "tem" vem de uma tabela editável no
// admin (Supabase); se ainda não foi configurada, usa os valores base abaixo.
window.SimuladorTroca = (function () {

  // Valores BASE de avaliação (o que a loja paga pelo usado, em bom estado,
  // capacidade base). São um ponto de partida — o dono ajusta no admin.
  var AVALIACAO_PADRAO = [
    { modelo: 'iPhone 17 Pro Max', valor: 8500 },
    { modelo: 'iPhone 17 Pro', valor: 7000 },
    { modelo: 'iPhone 17', valor: 5200 },
    { modelo: 'iPhone 16 Pro Max', valor: 5200 },
    { modelo: 'iPhone 16 Pro', valor: 4150 },
    { modelo: 'iPhone 16 Plus', valor: 3700 },
    { modelo: 'iPhone 16', valor: 3400 },
    { modelo: 'iPhone 15 Pro Max', valor: 4200 },
    { modelo: 'iPhone 15 Pro', valor: 3350 },
    { modelo: 'iPhone 15 Plus', valor: 3100 },
    { modelo: 'iPhone 15', valor: 2900 },
    { modelo: 'iPhone 14 Pro Max', valor: 3200 },
    { modelo: 'iPhone 14 Pro', valor: 2850 },
    { modelo: 'iPhone 14 Plus', valor: 2500 },
    { modelo: 'iPhone 14', valor: 2400 },
    { modelo: 'iPhone 13 Pro Max', valor: 3000 },
    { modelo: 'iPhone 13 Pro', valor: 2200 },
    { modelo: 'iPhone 13', valor: 1750 },
    { modelo: 'iPhone 13 mini', valor: 1650 },
    { modelo: 'iPhone 12 Pro Max', valor: 2200 },
    { modelo: 'iPhone 12 Pro', valor: 1900 },
    { modelo: 'iPhone 12', valor: 1300 },
    { modelo: 'iPhone 12 mini', valor: 1200 },
    { modelo: 'iPhone 11 Pro Max', valor: 1600 },
    { modelo: 'iPhone 11 Pro', valor: 1300 },
    { modelo: 'iPhone 11', valor: 950 },
    { modelo: 'iPhone XS Max', valor: 900 },
    { modelo: 'iPhone XS', valor: 750 },
    { modelo: 'iPhone XR', valor: 700 },
    { modelo: 'iPhone X', valor: 600 },
    { modelo: 'iPhone SE (2ª/3ª geração)', valor: 700 }
  ];

  var WHATS = '5571992712952';

  function moeda(v) {
    return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Tabela de avaliação: usa a do admin (Supabase) se existir, senão a base.
  function getAvaliacao() {
    return fetch('/api/cupons?config=avaliacao')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && Array.isArray(d.avaliacao_troca) && d.avaliacao_troca.length) return d.avaliacao_troca;
        return AVALIACAO_PADRAO;
      })
      .catch(function () { return AVALIACAO_PADRAO; });
  }

  // Modelos que o cliente pode QUERER: iPhones novos do catálogo (a partir de).
  function getModelosQuer() {
    if (!window.LojaAPI || !LojaAPI.getProducts) return Promise.resolve([]);
    return LojaAPI.getProducts().then(function (produtos) {
      var mapa = {};
      (produtos || []).forEach(function (p) {
        var nome = p.name || '';
        var low = nome.toLowerCase();
        if (low.indexOf('iphone') === -1) return;
        if (low.indexOf('seminovo') !== -1) return;
        if (low.indexOf('ipad') !== -1) return;
        var preco = parseFloat(p.price);
        if (!isFinite(preco) || preco <= 0) return;
        if (!mapa[nome] || preco < mapa[nome]) mapa[nome] = preco;
      });
      return Object.keys(mapa)
        .map(function (nome) { return { modelo: nome, preco: mapa[nome] }; })
        .sort(function (a, b) { return a.preco - b.preco; });
    }).catch(function () { return []; });
  }

  function injectStyle() {
    if (document.getElementById('simEstilo')) return;
    var st = document.createElement('style');
    st.id = 'simEstilo';
    st.textContent = [
      '.sim-card{background:var(--bg-card,#14161c);border:1px solid var(--border-color,rgba(255,255,255,.08));border-radius:20px;padding:24px;max-width:560px;margin:0 auto;color:var(--text-primary,#fff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
      '.sim-campo{margin-bottom:16px;}',
      '.sim-campo label{display:block;font-size:13px;color:var(--text-secondary,#9aa0aa);margin-bottom:7px;font-weight:600;}',
      '.sim-campo select{width:100%;padding:14px;border-radius:12px;border:1px solid var(--border-color,rgba(255,255,255,.14));background:var(--bg-main,#0d0f14);color:var(--text-primary,#fff);font-size:15px;-webkit-appearance:none;appearance:none;cursor:pointer;}',
      '.sim-seta{text-align:center;color:#12a150;font-size:20px;margin:-4px 0 10px;}',
      '.sim-res{margin-top:8px;border-top:1px solid var(--border-color,rgba(255,255,255,.08));padding-top:16px;}',
      '.sim-linha{display:flex;justify-content:space-between;font-size:14px;color:var(--text-secondary,#c7ccd4);padding:5px 0;}',
      '.sim-linha b{color:var(--text-primary,#fff);}',
      '.sim-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:12px;border-top:1px solid var(--border-color,rgba(255,255,255,.08));}',
      '.sim-total span{font-size:15px;font-weight:600;}',
      '.sim-total strong{font-size:26px;font-weight:800;color:#12a150;}',
      '.sim-pix{font-size:13px;color:#12a150;text-align:right;margin-top:4px;}',
      '.sim-obs{font-size:12px;color:var(--text-secondary,#9aa0aa);margin-top:14px;line-height:1.5;}',
      '.sim-zap{display:flex;align-items:center;justify-content:center;gap:9px;background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px;border-radius:50px;margin-top:16px;}',
      '.sim-zap:hover{filter:brightness(.96);}' ].join('');
    document.head.appendChild(st);
  }

  // Monta o simulador dentro de um container.
  function montar(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    injectStyle();
    container.innerHTML = '<div class="sim-card"><p style="text-align:center;color:var(--text-secondary,#9aa0aa);margin:0;">Carregando simulador...</p></div>';

    Promise.all([getAvaliacao(), getModelosQuer()]).then(function (res) {
      var avaliacao = res[0], querList = res[1];
      if (!querList.length) {
        // Sem catálogo: cai numa lista fixa mínima para não travar.
        querList = [
          { modelo: 'iPhone 15', preco: 4799 }, { modelo: 'iPhone 16', preco: 5600 },
          { modelo: 'iPhone 17', preco: 6499 }, { modelo: 'iPhone 17 Pro', preco: 8799 },
          { modelo: 'iPhone 17 Pro Max', preco: 10699 }
        ];
      }

      var optsTem = '<option value="">Selecione seu iPhone atual</option>' + avaliacao.map(function (a, i) {
        return '<option value="' + i + '">' + a.modelo + '</option>';
      }).join('');
      var optsQuer = '<option value="">Selecione o iPhone que quer</option>' + querList.map(function (a, i) {
        return '<option value="' + i + '">' + a.modelo + '</option>';
      }).join('');

      container.innerHTML =
        '<div class="sim-card">' +
        '  <div class="sim-campo"><label><i class="fa-solid fa-mobile-screen-button"></i> Você tem</label><select id="simTem">' + optsTem + '</select></div>' +
        '  <div class="sim-seta"><i class="fa-solid fa-arrow-down-long"></i></div>' +
        '  <div class="sim-campo"><label><i class="fa-solid fa-star"></i> Você quer</label><select id="simQuer">' + optsQuer + '</select></div>' +
        '  <div class="sim-res" id="simResultado"><p style="text-align:center;color:var(--text-secondary,#9aa0aa);font-size:14px;margin:0;">Escolha os dois modelos para ver a diferença.</p></div>' +
        '</div>';

      var selTem = container.querySelector('#simTem');
      var selQuer = container.querySelector('#simQuer');
      var out = container.querySelector('#simResultado');

      function calcular() {
        var t = selTem.value, q = selQuer.value;
        if (t === '' || q === '') {
          out.innerHTML = '<p style="text-align:center;color:var(--text-secondary,#9aa0aa);font-size:14px;margin:0;">Escolha os dois modelos para ver a diferença.</p>';
          return;
        }
        var tem = avaliacao[+t], quer = querList[+q];
        var diff = quer.preco - tem.valor;
        var pixPct = window.DESCONTO_PIX || 10;
        var msg;

        var linhas =
          '<div class="sim-linha"><span>' + quer.modelo + ' (novo)</span><b>' + moeda(quer.preco) + '</b></div>' +
          '<div class="sim-linha"><span>Avaliação do seu ' + tem.modelo + '</span><b style="color:#12a150;">- ' + moeda(tem.valor) + '</b></div>';

        if (diff > 0) {
          var pix = Math.round(diff * (1 - pixPct / 100) * 100) / 100;
          msg = 'Olá! Quero trocar meu ' + tem.modelo + ' por um ' + quer.modelo + '. Simulei uma diferença de ' + moeda(diff) + '. Podemos avançar?';
          out.innerHTML = linhas +
            '<div class="sim-total"><span>Você paga a diferença</span><strong>' + moeda(diff) + '</strong></div>' +
            '<div class="sim-pix">ou ' + moeda(pix) + ' à vista no Pix (-' + pixPct + '%)</div>' +
            '<p class="sim-obs"><i class="fa-solid fa-circle-info"></i> Valor de avaliação sujeito à checagem do aparelho (estado, bateria e tela). Confirmamos tudo pelo WhatsApp.</p>' +
            '<a class="sim-zap" target="_blank" rel="noopener" href="https://wa.me/' + WHATS + '?text=' + encodeURIComponent(msg) + '"><i class="fa-brands fa-whatsapp"></i> Quero fazer essa troca</a>';
        } else {
          var sobra = Math.abs(diff);
          msg = 'Olá! Quero trocar meu ' + tem.modelo + ' por um ' + quer.modelo + '. Pela simulação meu aparelho cobre a troca. Podemos avançar?';
          out.innerHTML = linhas +
            '<div class="sim-total"><span>Seu aparelho cobre a troca</span><strong>' + (sobra > 0 ? '+' + moeda(sobra) : moeda(0)) + '</strong></div>' +
            '<p class="sim-obs"><i class="fa-solid fa-circle-info"></i> Seu iPhone vale mais que a diferença. ' + (sobra > 0 ? 'A sobra de ' + moeda(sobra) + ' pode virar crédito ou abater acessórios. ' : '') + 'Valor sujeito à avaliação do aparelho.</p>' +
            '<a class="sim-zap" target="_blank" rel="noopener" href="https://wa.me/' + WHATS + '?text=' + encodeURIComponent(msg) + '"><i class="fa-brands fa-whatsapp"></i> Quero fazer essa troca</a>';
        }
      }

      selTem.addEventListener('change', calcular);
      selQuer.addEventListener('change', calcular);
    });
  }

  return { montar: montar, getAvaliacao: getAvaliacao, AVALIACAO_PADRAO: AVALIACAO_PADRAO, moeda: moeda };
})();
