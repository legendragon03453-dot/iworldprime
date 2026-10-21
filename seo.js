// SEO técnico do site: meta tags dinâmicas (description, Open Graph, Twitter),
// canonical e blocos Schema.org (JSON-LD). Carregado em todas as páginas antes
// do script.js. As páginas chamam iWorldSEO.applySEO({...}) com os dados delas.
(function () {
  var SITE_URL = 'https://www.iworldprime.com.br';
  var SITE_NAME = 'iWorld Prime';
  var DEFAULT_IMAGE = SITE_URL + '/IMAGES/LOGO%20COMPLETA%20ESCURA.webp';

  function setMeta(attr, key, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  function setLink(rel, href) {
    var el = document.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function setJsonLd(id, data) {
    var list = Array.isArray(data) ? data : [data];
    list.forEach(function (item, i) {
      var elId = id + (i > 0 ? '-' + i : '');
      var el = document.getElementById(elId);
      if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = elId;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(item);
    });
  }

  function applySEO(opts) {
    var path = opts.path || location.pathname;
    var image = opts.image || DEFAULT_IMAGE;
    var type = opts.type || 'website';

    if (opts.title) document.title = opts.title;
    setMeta('name', 'description', opts.description);
    setMeta('property', 'og:title', opts.title);
    setMeta('property', 'og:description', opts.description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', SITE_URL + path);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'pt_BR');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', opts.title);
    setMeta('name', 'twitter:description', opts.description);
    setMeta('name', 'twitter:image', image);
    setLink('canonical', SITE_URL + path);

    if (opts.jsonLd) setJsonLd('seo-jsonld', opts.jsonLd);
  }

  // Título + descrição de SEO por categoria (usados nas páginas de coleção).
  // A chave é o nome que banners.js devolve em categoriaAtual().
  var CATEGORIA_SEO = {
    'iPhones': {
      title: 'iPhones Originais com Nota Fiscal e Garantia | iWorld Prime',
      description: 'Compre iPhone original com procedência, homologação Anatel e nota fiscal. iPhone 15, 16, 17, 18 Pro, Pro Max e Duo, novos e seminovos. Frete grátis para todo o Brasil.'
    },
    'Macs': {
      title: 'MacBook Air e MacBook Pro com Garantia | iWorld Prime',
      description: 'MacBook Air e MacBook Pro com chip Apple silicon, nota fiscal e garantia. Desempenho e bateria para o dia inteiro. Frete grátis para todo o Brasil.'
    },
    'JBL': {
      title: 'Caixas de Som JBL PartyBox e Boombox | iWorld Prime',
      description: 'JBL PartyBox e Boombox com som potente, graves profundos e show de luzes. Produtos originais com nota fiscal e garantia. Frete grátis para todo o Brasil.'
    },
    'Acessórios': {
      title: 'Acessórios para iPhone e Apple | iWorld Prime',
      description: 'Películas, capas, carregadores e fones originais para proteger e completar seu iPhone. Nota fiscal e garantia. Frete grátis para todo o Brasil.'
    },
    'Drones': {
      title: 'Drones DJI e Câmeras de Ação | iWorld Prime',
      description: 'Drones DJI Neo 2, Lito X1 e câmeras Osmo Pocket com imagem estabilizada. Produtos originais com nota fiscal e garantia. Frete grátis para todo o Brasil.'
    },
    'Playstation': {
      title: 'PlayStation 5 Original | iWorld Prime',
      description: 'PlayStation 5 com SSD ultrarrápido, feedback tátil e biblioteca de jogos. Produto original com nota fiscal e garantia. Frete grátis para todo o Brasil.'
    },
    'iPads': {
      title: 'iPad Original com Nota Fiscal e Garantia | iWorld Prime',
      description: 'iPad original com procedência, nota fiscal e garantia. Potência de computador na leveza de um tablet. Frete grátis para todo o Brasil.'
    }
  };

  function categoriaSEO(cat, details) {
    var padrao = CATEGORIA_SEO[cat];
    if (padrao) return padrao;
    return {
      title: (details && details.titulo ? details.titulo : cat) + ' | ' + SITE_NAME,
      description: (details && details.subtitulo) || (SITE_NAME + ' — produtos Apple originais com nota fiscal e garantia. Frete grátis para todo o Brasil.')
    };
  }

  window.iWorldSEO = {
    applySEO: applySEO,
    categoriaSEO: categoriaSEO,
    SITE_URL: SITE_URL,
    SITE_NAME: SITE_NAME,
    DEFAULT_IMAGE: DEFAULT_IMAGE
  };
})();
