# iWorld Prime

Loja online da **iWorld Prime** (iPhones, Macs, JBL, PlayStation, drones e acessórios), com loja física em Salvador/BA.

- **Site:** https://www.iworldprime.com.br
- **Hospedagem:** Vercel (projeto `i-world-prime`)
- **Banco de dados:** Supabase (projeto `kiozwryulztunsrfqdus`)
- **Pagamento:** Mercado Pago Checkout Pro (Pix, cartão e boleto)

O site é HTML, CSS e JavaScript puro, sem build e sem framework. As únicas partes que rodam no servidor são as funções da pasta `api/`, que a Vercel executa sozinha.

---

## Sumário

1. [Estrutura do projeto](#estrutura-do-projeto)
2. [Como colocar no ar](#como-colocar-no-ar)
3. [Variáveis de ambiente](#variáveis-de-ambiente)
4. [Banco de dados (Supabase)](#banco-de-dados-supabase)
5. [Painel administrativo](#painel-administrativo)
6. [Checkout e pedidos](#checkout-e-pedidos)
7. [Segurança](#segurança)
8. [SEO](#seo)
9. [Rodar localmente](#rodar-localmente)
10. [Manutenção do dia a dia](#manutenção-do-dia-a-dia)

---

## Estrutura do projeto

```
├── index.html               Página inicial
├── loja.html                Catálogo completo
├── iphone.html, macs.html, jbl.html, playstation.html,
│   drones.html, acessorios.html, hollyland.html   Páginas de categoria
├── colecao.html             Coleções
├── detalhes.html            Página do produto
├── carrinho.html            Carrinho e dados de entrega
├── sucesso.html             Retorno após o pagamento
├── simulador.html           Simulador de parcelas / troca
├── suporte.html             Suporte e contato
├── login.html, clientes.html   Área do cliente
│
├── admin*.html              Painel administrativo (produtos, pedidos, marketing,
│                            banners/CMS, equipe, estatísticas, histórico)
├── admin-auth.js            Guarda de acesso das telas do admin
├── admin-sidebar.js         Menu lateral do admin
├── admin-style.css          Estilo do admin
│
├── global.js                Header, footer, carrinho e funções comuns
├── loja-api.js              Leitura do catálogo (Supabase) + galerias de fotos
├── detalhes.js              Lógica da página do produto
├── banners.js               Banners das categorias (com padrão embutido)
├── avaliacoes.js            Avaliações dos clientes
├── simulador.js, colecao.js, clientes.js, catalogo-macs.js, movimento.js, script.js
├── seo.js                   Metadados e dados estruturados (Schema.org)
├── supabase.js              Cliente Supabase do navegador (chave pública)
├── style.css                Estilo do site
│
├── api/                     Funções serverless (Vercel)
│   ├── admin-login.js       Login do painel (senha só no servidor)
│   ├── produtos.js          Escrita no catálogo (só com token de admin)
│   ├── pedidos.js           Leitura de pedidos (só admin)
│   ├── cupons.js            Cupons de desconto e desconto Pix
│   ├── mercadopago.js       Criação do checkout + webhook de pagamento
│   └── sitemap.js           /sitemap.xml gerado a partir do catálogo
│
├── supabase-*.sql           Scripts de criação das tabelas (ver abaixo)
├── scripts/gerar-admin.js   Gera sal/hash da senha de um administrador
├── vercel.json              Rotas, URLs limpas e cabeçalhos de segurança
├── robots.txt, llms.txt     Indexação (buscadores e IAs)
│
├── IMAGES/                  Logos, banners, vídeos do hero e fotos de produto
├── IMAGENS I WORLD/         Fotos dos produtos
└── PRODUCT COLLECTION/      Arte das coleções
```

As URLs não têm `.html` (`cleanUrls` no `vercel.json`): `/loja`, `/iphone`, `/admin`, etc.

---

## Como colocar no ar

### Opção A — Vercel ligada ao GitHub (recomendado)

1. Em https://vercel.com/new, importe este repositório.
2. **Framework Preset:** `Other`. Deixe *Build Command* e *Output Directory* vazios.
3. Cadastre as [variáveis de ambiente](#variáveis-de-ambiente) antes do primeiro deploy.
4. Clique em **Deploy**. A partir daí, cada `git push` na branch `main` publica o site.
5. Em **Settings → Domains**, adicione `iworldprime.com.br` e `www.iworldprime.com.br` e configure o DNS como a Vercel indicar.

### Opção B — Vercel CLI

```bash
npm i -g vercel
vercel link          # vincula a pasta ao projeto i-world-prime
vercel --prod        # publica em produção
```

> Depois de alterar variáveis de ambiente na Vercel, faça um novo deploy: elas só valem a partir do próximo.

---

## Variáveis de ambiente

Ficam **só na Vercel** (Settings → Environment Variables). O modelo está em [`.env.example`](.env.example). Nunca coloque esses valores no código.

| Variável | Para que serve | Onde conseguir |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | Acesso do servidor ao banco (ignora o RLS) | Supabase → Project Settings → API Keys → chave **secret** |
| `MP_ACCESS_TOKEN` | Criar pagamentos e confirmar o status | Mercado Pago → Suas integrações → Credenciais de **produção** |
| `ADMIN_SESSAO_SECRET` | Assina o token de login do painel | Texto aleatório longo (comando abaixo) |
| `ADMIN_EMAIL` | E-mail do administrador | Você define |
| `ADMIN_SAL` / `ADMIN_HASH` | Senha do administrador, em hash | `node scripts/gerar-admin.js "senha"` |
| `ADMIN_EMAIL_2…8`, `ADMIN_SAL_2…8`, `ADMIN_HASH_2…8` | Administradores extras (opcional) | Mesmo processo |

Gerar o segredo de sessão:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Gerar a senha de um administrador:

```bash
node scripts/gerar-admin.js "uma-senha-forte-aqui"
# ADMIN_SAL=...
# ADMIN_HASH=...
```

A chave **pública** do Supabase (`sb_publishable_...`) e a URL do projeto ficam em `supabase.js` e `api/sitemap.js`. Ela pode ficar no navegador porque o RLS limita o que ela lê.

---

## Banco de dados (Supabase)

Projeto `kiozwryulztunsrfqdus`. Os scripts são idempotentes: rodar de novo não duplica nem apaga nada. Para montar o banco do zero, rode no **SQL Editor**, nesta ordem:

| Ordem | Arquivo | O que cria |
|---|---|---|
| 1 | `supabase-rls.sql` | Tabela `profiles` (clientes), RLS e trava de cargos |
| 2 | `supabase-produtos.sql` | Tabela `produtos` + catálogo inicial |
| 3 | `supabase-pedidos.sql` | Tabela `pedidos` (só o servidor lê e escreve) |
| 4 | `supabase-cupons.sql` | Tabelas `cupons` e `configuracoes` (desconto Pix: 10%) |
| 5 | `supabase-banners.sql` | Tabela `banners` das categorias |
| 6 | `supabase-reviews.sql` | Avaliações compartilhadas dos clientes |
| 7 | `supabase-capa-woov-azul.sql` | Exemplo de cadastro de produto (Capa Woov Azul) |

**Tabelas e quem acessa:**

- `produtos`: o público lê só os **publicados**; escrita só pelo admin, via `/api/produtos`.
- `pedidos`, `cupons`, `configuracoes`: sem acesso público nenhum; só o servidor (`service_role`).
- `banners`, `reviews`, `profiles`: regras próprias, descritas no topo de cada SQL.

**Fotos de produto:** cada produto tem uma foto de capa (coluna `imagem`). Fotos extras da galeria ficam em `LojaAPI.GALERIAS`, no `loja-api.js`, indexadas pela foto de capa.

---

## Painel administrativo

Acesse **https://www.iworldprime.com.br/admin-login** com o e-mail e a senha cadastrados nas variáveis de ambiente.

| Tela | O que faz |
|---|---|
| `/admin` | Visão geral |
| `/admin-produtos` | Cadastrar, editar, publicar e ordenar produtos |
| `/admin-pedidos` | Pedidos recebidos e status do pagamento |
| `/admin-marketing` | Cupons de desconto e desconto do Pix |
| `/admin-cms` | Banners, títulos e textos das categorias |
| `/admin-equipe` | Equipe |
| `/admin-estatisticas` | Estatísticas |
| `/admin-historico` | Histórico de alterações |
| `/admin-configuracoes` | Configurações gerais |

- A sessão dura **12 horas**; depois disso o painel pede login de novo.
- **Trocar a senha:** gere novo sal/hash com `scripts/gerar-admin.js`, atualize `ADMIN_SAL` e `ADMIN_HASH` na Vercel e faça redeploy.
- **Derrubar todas as sessões abertas:** troque o `ADMIN_SESSAO_SECRET` e faça redeploy.
- **Novo administrador:** cadastre `ADMIN_EMAIL_2`, `ADMIN_SAL_2` e `ADMIN_HASH_2` (até `_8`).

---

## Checkout e pedidos

1. O cliente monta o carrinho e preenche os dados de entrega em `/carrinho`.
2. O navegador envia **só os ids e as quantidades** para `/api/mercadopago`.
3. O servidor relê preço e nome de cada produto no Supabase (o preço do navegador é ignorado), aplica cupom/desconto Pix, grava o pedido e cria o checkout no Mercado Pago.
4. O cliente paga no ambiente do Mercado Pago (Pix, cartão ou boleto) e volta para `/sucesso`.
5. O Mercado Pago avisa o servidor (webhook), que **consulta a API do Mercado Pago** para confirmar o status antes de atualizar o pedido.

O Access Token do Mercado Pago nunca chega ao navegador.

---

## Segurança

- Segredos só nas variáveis de ambiente da Vercel; o código não guarda senha, token nem chave secreta.
- Login do admin com senha em PBKDF2 (120 mil iterações), comparação em tempo constante e token assinado com validade.
- RLS ligado em todas as tabelas do Supabase.
- Preço sempre recalculado no servidor.
- `/api/mercadopago` e `/api/cupons` só aceitam chamadas da própria loja.
- Cabeçalhos no `vercel.json`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff` e outros.

**Se for incluir um script novo** (pixel, chat, analytics), adicione o domínio dele na `Content-Security-Policy` do `vercel.json`. Sem isso o navegador bloqueia o script.

> Exportações antigas do banco (pasta `backup/`) **não** ficam no repositório, porque contêm dados pessoais de clientes (LGPD).

---

## SEO

- `seo.js`: título, descrição, Open Graph e dados estruturados (Schema.org) por página.
- `/sitemap.xml`: gerado na hora a partir dos produtos publicados (`api/sitemap.js`).
- `robots.txt`: libera o site e bloqueia `/admin*` e `/api/`.
- `llms.txt`: resumo da loja para buscadores de IA (ChatGPT, Claude, Perplexity, Gemini).

Ao criar uma página pública nova, inclua-a em `STATIC_PAGES` no `api/sitemap.js`.

---

## Rodar localmente

Só as páginas (sem as funções da `api/`):

```bash
npx serve .
```

Com as funções da `api/` funcionando (precisa das variáveis de ambiente):

```bash
vercel link
vercel env pull .env.local
vercel dev
```

---

## Manutenção do dia a dia

| Quero... | Como |
|---|---|
| Cadastrar/editar produto, preço ou estoque | Painel → **Produtos** |
| Criar cupom ou mudar o desconto do Pix | Painel → **Marketing** |
| Trocar banner ou texto de categoria | Painel → **CMS** |
| Adicionar fotos extras na galeria de um produto | `LojaAPI.GALERIAS` em `loja-api.js` + deploy |
| Mudar WhatsApp, endereço ou textos fixos | Arquivos HTML / `global.js` + deploy |
| Ver os pedidos | Painel → **Pedidos** (ou tabela `pedidos` no Supabase) |
| Ver erros das funções | Vercel → projeto → **Logs** |

Arquivos `.js` e `.css` são chamados com versão (ex.: `detalhes.js?v=26`). Ao alterar um deles, aumente o número no HTML correspondente para os navegadores não usarem a versão antiga em cache.

---

## Contato da loja

- WhatsApp: (71) 99271-2952
- Loja física: Av. Tancredo Neves, 1632, Caminho das Árvores, Salvador/BA
