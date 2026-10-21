// catalogo-macs.js
// Modelos de MacBook com especificações e preços levantados em 26/08/2026.
//
// Serve de reserva enquanto o catálogo estiver vazio: a página de
// Macs mostra estes modelos em vez de ficar em branco. Assim que os produtos
// forem cadastrados, o catálogo real assume e este arquivo para de
// ser usado.
//
// ATENÇÃO AOS PREÇOS
// Não são preços definidos pela iWorld Prime. São o valor de mercado de cada
// configuração numa pesquisa feita em 26/08/2026, usados como ponto de
// partida a pedido — e para aparelhos SEMINOVOS. Antes do lançamento eles
// precisam ser revistos: margem, condição do aparelho e estoque real mudam
// esses números. É este o único lugar para editá-los.

const CATALOGO_MACS = [
    { nome: "MacBook Air M1 2020 13.3\"",
      chip: "M1", ano: "2020", tela: "13.3\"",
      cpu: "7 núcleos", ram: "8GB", ssd: "256GB", cor: "Cinza Espacial",
      preco: 3429.0, imagem: "IMAGES/PRODUCTS/macbook_air_m4.webp" },
    { nome: "MacBook Air M1 2020 13.3\"",
      chip: "M1", ano: "2020", tela: "13.3\"",
      cpu: "8 núcleos", ram: "16GB", ssd: "512GB", cor: "Prateado",
      preco: 3989.0, imagem: "IMAGES/PRODUCTS/macbook_air_m4.webp" },
    { nome: "MacBook Pro M1 2020 13\"",
      chip: "M1", ano: "2020", tela: "13\"",
      cpu: "8 núcleos", ram: "8GB", ssd: "256GB", cor: "Space Gray",
      preco: 4269.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Air M2 2022 13.6\"",
      chip: "M2", ano: "2022", tela: "13.6\"",
      cpu: "8 núcleos", ram: "8GB", ssd: "256GB", cor: "Prateado",
      preco: 4449.0, imagem: "IMAGES/PRODUCTS/macbook_air_m4.webp" },
    { nome: "MacBook Pro M2 2022 13\"",
      chip: "M2", ano: "2022", tela: "13\"",
      cpu: "10 núcleos", ram: "8GB", ssd: "256GB", cor: "Prateado",
      preco: 4519.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 2020 13\"",
      chip: "M1", ano: "2020", tela: "13\"",
      cpu: "8 núcleos", ram: "8GB", ssd: "512GB", cor: "Space Gray",
      preco: 5169.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 Pro 2021 14\"",
      chip: "M1 Pro", ano: "2021", tela: "14\"",
      cpu: "8 núcleos", ram: "16GB", ssd: "512GB", cor: "Prateado",
      preco: 5609.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 Pro 2021 16\"",
      chip: "M1 Pro", ano: "2021", tela: "16\"",
      cpu: "10 núcleos", ram: "16GB", ssd: "512GB", cor: "Prateado",
      preco: 5669.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 Pro 2021 14\"",
      chip: "M1 Pro", ano: "2021", tela: "14\"",
      cpu: "10 núcleos", ram: "16GB", ssd: "1TB", cor: "Prateado",
      preco: 6079.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 Max 2021 16\"",
      chip: "M1 Max", ano: "2021", tela: "16\"",
      cpu: "10 núcleos", ram: "16GB", ssd: "1TB", cor: "Prateado",
      preco: 9979.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
    { nome: "MacBook Pro M1 Max 2021 16\"",
      chip: "M1 Max", ano: "2021", tela: "16\"",
      cpu: "10 núcleos", ram: "32GB", ssd: "1TB", cor: "Prateado",
      preco: 10039.0, imagem: "IMAGES/PRODUCTS/macbook_pro.webp" },
];

window.CATALOGO_MACS = CATALOGO_MACS;
