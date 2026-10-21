-- supabase-capa-woov-azul.sql
-- Cadastra a "Capa para iPhone 17 Pro - Woov - Azul - Gshield" (GS-14280).
-- Rode UMA vez no SQL Editor do projeto kiozwryulztunsrfqdus.
-- Idempotente: reexecutar não duplica (ON CONFLICT) e não apaga nada.
--
-- A coluna `imagem` guarda a foto de capa; as outras 7 fotos da galeria estão
-- em LojaAPI.GALERIAS (loja-api.js), indexadas por esta mesma foto de capa.
-- A tag "Azul" vira a opção de cor na página do produto.

insert into public.produtos
  (id, nome, descricao, preco, categoria, subcategoria, imagem, tags, slug, status, ordem)
values
  ('e6980b21-72bc-4e35-aa49-dc4ed19865bc',
   'Capa para iPhone 17 Pro - Woov - Azul - Gshield',
   $desc$Para o iPhone 17 Pro, a Capa Woov Azul da Gshield combina um acabamento em tecido de microssarja sustentável com tecnologia MagSafe e proteção estrutural completa.

O diferencial da Woov está na superfície em tecido micro twill, produzido com 68% de poliéster reciclado. A textura é única, confortável ao toque e altamente durável, pensada para resistir ao uso contínuo sem desgastar nem comprometer a praticidade no dia a dia.

Além da textura sofisticada, o acabamento proporciona grip firme e natural, ajudando a evitar escorregões e oferecendo mais controle ao segurar o celular. A Capa Woov Azul torna o iPhone 17 Pro mais seguro nas mãos sem adicionar volume excessivo.

As bordas elevadas protegem a tela e o conjunto de câmeras ao apoiar o aparelho em superfícies, enquanto o revestimento interno em microfibra macia evita riscos e marcas no corpo do celular, preservando o acabamento original por mais tempo.

A tecnologia MagSafe integrada garante conexão magnética precisa com carregadores sem fio e acessórios compatíveis, sem necessidade de remover a capa para carregar. A Capa Woov Azul une consciência ambiental, proteção eficiente e praticidade magnética em um único acessório para o iPhone 17 Pro.

ESPECIFICAÇÕES
• Marca: Gshield
• Material: Tecido de microssarja (micro twill) feito com 68% de poliéster reciclado
• Dimensões: Dimensões exatas do aparelho
• Proteção: Contra impactos e riscos
• Cor: Azul

COMPATIBILIDADE
• iPhone 17 Pro

ITENS INCLUSOS
• 1x Capa protetora

GARANTIA
• 3 meses de garantia contra defeitos de fabricação e garantia vitalícia contra amarelamento
• Com decorrer do uso a capa pode apresentar arranhões pelo contato diário com superfícies$desc$,
   149.97,
   'Acessórios',
   null,
   '/IMAGES/PRODUCTS/capa_woov_azul_iphone_17_pro_1.jpg',
   '["Azul"]'::jsonb,
   'GS14280W17',
   'published',
   34)
on conflict (id) do nothing;
