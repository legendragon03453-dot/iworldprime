-- supabase-produtos.sql
-- Catálogo da iWorld Prime no Supabase.
-- Rode UMA vez no SQL Editor do projeto kiozwryulztunsrfqdus.
-- Idempotente: reexecutar não duplica (ON CONFLICT) e não apaga nada.

create extension if not exists "pgcrypto";

create table if not exists public.produtos (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  descricao    text,
  preco        numeric(12,2) not null default 0,
  categoria    text not null default 'Geral',
  subcategoria text,
  imagem       text,                 -- opcional; o site usa a foto oficial do modelo quando vazio
  tags         jsonb not null default '[]'::jsonb,
  slug         text,
  status       text not null default 'published',  -- 'published' aparece na loja; 'draft' fica oculto
  ordem        int  not null default 0,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- RLS: o site usa a chave PUBLISHABLE (anon). Ela só pode LER produtos publicados.
-- Escrita (admin) acontece no servidor via service_role, que ignora o RLS.
alter table public.produtos enable row level security;

drop policy if exists "leitura publica de publicados" on public.produtos;
create policy "leitura publica de publicados"
  on public.produtos for select
  to anon, authenticated
  using (status = 'published');

-- Nenhuma policy de insert/update/delete para anon: a loja não pode escrever.

insert into public.produtos
  (id, nome, descricao, preco, categoria, subcategoria, imagem, tags, slug, status, ordem)
values
  ('03f6b203-80ce-4a19-8870-f4421652180c', 'iPhone 18 Pro Max', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 1TB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 15499, 'iPhones', null, null, '[]'::jsonb, 'TVPKTDK252', 'published', 0),
  ('8103b474-5154-4870-b99e-242ec8e7cb4f', 'iPhone 18 Pro Max', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 512GB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 13499, 'iPhones', null, null, '[]'::jsonb, '8SWPP2GIDW', 'published', 1),
  ('45b42b3a-4c84-4590-8590-5bf5402fe140', 'iPhone 18 Pro Max', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 256GB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 11999, 'iPhones', null, null, '[]'::jsonb, '2KTTZUGIT2', 'published', 2),
  ('f5a9a271-4793-400f-93dd-787279e92416', 'iPhone 16 Pro Max', 'Condição: Novo. Especificações: 512GB - Todas as cores - Apple', 8599, 'iPhones', null, null, '[]'::jsonb, 'NJ5N35UY5W', 'published', 3),
  ('9f39912c-fe51-4658-bdfd-f03e423410db', 'iPhone 16 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 7899, 'iPhones', null, null, '[]'::jsonb, 'QUQ4GVD3NK', 'published', 4),
  ('450935b5-a163-446e-95ee-d207a8691d04', 'iPhone 15 Pro Max', 'Condição: Novo. Especificações: 512GB - Todas as cores - Apple', 7599, 'iPhones', null, null, '[]'::jsonb, 'M4K1RNWR9S', 'published', 5),
  ('dedd23d9-9675-41ac-908e-0c33637dca8d', 'iPhone 15 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 6899, 'iPhones', null, null, '[]'::jsonb, 'B72JKAX6IR', 'published', 6),
  ('871a7bb0-5b03-46ab-b631-48cbb25fc2b6', 'iPhone 14 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 5899, 'iPhones', null, null, '[]'::jsonb, 'ZUZAD95U4Y', 'published', 7),
  ('1281879f-0422-4f7b-9e87-568e80130ae9', 'iPhone 14 Pro Max', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 5399, 'iPhones', null, null, '[]'::jsonb, 'TK8GF9M9KJ', 'published', 8),
  ('d0ba0fea-44c3-41c1-970f-e187c34ec65c', 'iPhone 13 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 5199, 'iPhones', null, null, '[]'::jsonb, 'AYMJWT1NWB', 'published', 9),
  ('445c61d0-e39f-4560-a70f-fe058bc7000a', 'iPhone 13 Pro Max', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 4699, 'iPhones', null, null, '[]'::jsonb, 'KCVVO7U38W', 'published', 10),
  ('2670a397-438f-48ae-9471-4d4a06c065cd', 'iPhone 12 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 4399, 'iPhones', null, null, '[]'::jsonb, '3QIL51CWO5', 'published', 11),
  ('66b0b518-eee4-4bcb-924a-73c1c2ea60ee', 'iPhone 12 Pro Max', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 3899, 'iPhones', null, null, '[]'::jsonb, 'TBK050QGSB', 'published', 12),
  ('d5f7d187-86f4-45b5-9b66-6b49438489e7', 'iPhone 11 Pro Max', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 3799, 'iPhones', null, null, '[]'::jsonb, 'X5058LCJGY', 'published', 13),
  ('584bc1d6-ffcc-43dc-bc61-928b784eb06f', 'iPhone 11 Pro Max', 'Condição: Novo. Especificações: 64GB - Todas as cores - Apple', 3299, 'iPhones', null, null, '[]'::jsonb, 'UFRCMXSNBS', 'published', 14),
  ('75a3d545-0382-4383-b4ad-b9d7e6860683', 'DJI Osmo Pocket 4', 'Câmera de bolso com estabilização em 3 eixos, sensor de 1 polegada, gravação em 4K/120fps e tela giratória. Perfeita para criadores de conteúdo. Original, com nota fiscal e garantia.', 4999, 'Drones', null, null, '[]'::jsonb, 'RVCBAB83MT', 'published', 15),
  ('89f84562-4abe-412d-968e-e947f08b16a6', 'JBL GO 5', 'Caixa de som Bluetooth ultraportátil, à prova d&#x27;água (IP67), com som JBL Pro Sound e bateria para o dia todo. Original, com nota fiscal e garantia.', 399, 'Caixas de Som', null, null, '[]'::jsonb, '4RTX0FIINL', 'published', 16),
  ('a35170a8-54e0-46b5-93db-9993dc6d6d6d', 'JBL Party Box 120', 'Caixa de som portátil com som potente, luzes pulsantes e bateria de longa duração. Leve para qualquer lugar. Original, com nota fiscal e garantia.', 1799, 'Caixas de Som', null, null, '[]'::jsonb, 'IAVDIW9DFI', 'published', 17),
  ('5ab48990-3d8d-47b9-8db3-197dbc1e3f1f', 'JBL Party Box 320', 'Caixa de som Bluetooth com som JBL Pro, painel de luzes RGB e proteção IPX4. Ideal para festas dentro e fora de casa. Original, com nota fiscal e garantia.', 2999, 'Caixas de Som', null, null, '[]'::jsonb, 'KQBQCGF0G7', 'published', 18),
  ('05d8d6db-03ec-40da-b1a4-0b236e072802', 'JBL Party Box 330', 'Caixa de som Bluetooth potente com graves profundos e show de luzes. Bateria recarregável, resistência à água e conexão sem fio estável. Original, com nota fiscal e garantia.', 3299, 'Caixas de Som', null, null, '[]'::jsonb, 'PMMFQ46GD0', 'published', 19),
  ('01ddbf11-90f7-4c10-94ea-f964215c6413', 'PlayStation 5 Pro', 'O PlayStation mais poderoso: GPU avançada, upscaling por IA (PSSR), ray tracing aprimorado e SSD de 2TB. Original, com nota fiscal e garantia.', 7499, 'Playstation', null, null, '[]'::jsonb, '38322SA0W2', 'published', 20),
  ('9941ff37-bb82-4ec9-9671-d3bda143f3f3', 'PlayStation 5 Slim Digital', 'Console PS5 Slim Edição Digital (sem leitor). SSD ultrarrápido, gráficos em 4K e DualSense com feedback tátil. Original, com nota fiscal e garantia.', 3999, 'Playstation', null, null, '[]'::jsonb, 'UME1MB3PHJ', 'published', 21),
  ('f8baaae9-e7fc-4708-b417-2657ca1b0238', 'PlayStation 5 Slim', 'Console PS5 Slim com leitor de disco. SSD ultrarrápido, ray tracing, 4K a 120Hz e o controle DualSense com feedback tátil. Original, com nota fiscal e garantia.', 4499, 'Playstation', null, null, '[]'::jsonb, 'STBM9XAVZZ', 'published', 22),
  ('d66279bb-2a1f-4eaf-ac0d-16f7e80ab249', 'iPhone 15 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 256GB', 4299, 'iPhones Seminovos', null, null, '[]'::jsonb, '0M31M6RLMO', 'published', 23),
  ('245f6c91-91e1-42f0-9e6d-5adceedc1ec4', 'iPhone 15 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 128GB', 3799, 'iPhones Seminovos', null, null, '[]'::jsonb, 'MXRJBE20OE', 'published', 24),
  ('03950d59-65e3-420f-a062-deeeff6821f5', 'iPhone 14 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 256GB', 3699, 'iPhones Seminovos', null, null, '[]'::jsonb, 'PIJ9M34LF3', 'published', 25),
  ('c4e49362-c15a-4817-a3d9-69478cb07baf', 'iPhone 14 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 128GB', 3199, 'iPhones Seminovos', null, null, '[]'::jsonb, '3E5ZTZ959X', 'published', 26),
  ('3848db89-d85c-43c6-9de5-bc2e02861749', 'iPhone 13 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 256GB', 3199, 'iPhones Seminovos', null, null, '[]'::jsonb, '11M14HGUI5', 'published', 27),
  ('4c6ada24-a875-41ea-9909-9952a51bc099', 'iPhone 13 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 128GB', 2799, 'iPhones Seminovos', null, null, '[]'::jsonb, 'JR7BLUN704', 'published', 28),
  ('556d4fb7-8407-4a7e-bd32-97800784dd11', 'iPhone 12 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 128GB', 2599, 'iPhones Seminovos', null, null, '[]'::jsonb, 'AQTGF1VFN4', 'published', 29),
  ('18eb8781-aa54-4e66-b013-88de269b1083', 'iPhone 12 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 64GB', 2299, 'iPhones Seminovos', null, null, '[]'::jsonb, 'RV4M76I4SG', 'published', 30),
  ('c3411e72-b075-4288-8473-612ac66ffb1b', 'iPhone 11 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 128GB', 2199, 'iPhones Seminovos', null, null, '[]'::jsonb, '0P2AT04RTK', 'published', 31),
  ('7cfb080a-d7c9-4af9-bbba-476acaaaf461', 'iPhone 11 Seminovo', 'Seminovo · Revisado, testado e com garantia iWorld Prime. Bateria saudável e sem detalhes na tela. · 64GB', 1899, 'iPhones Seminovos', null, null, '[]'::jsonb, 'C5BD6OJZIW', 'published', 32),
  ('68787ea5-bb48-43f4-ac14-0a17c95e70f8', 'Carregador USB-C 20W', 'Carregador de parede USB-C de 20W com carregamento rápido para iPhone e iPad. Original. (Foto ilustrativa)', 149.9, 'Acessórios', null, null, '[]'::jsonb, 'Q8D8JMNRPH', 'published', 33),
  ('7341ea56-c04b-4150-9e2f-f097829c763e', 'Capa Transparente MagSafe', 'Capa transparente com compatibilidade MagSafe, proteção antimpacto e acabamento anti-amarelamento. (Foto ilustrativa)', 129.9, 'Acessórios', null, null, '[]'::jsonb, 'KJVNOEFY4I', 'published', 34),
  ('e1e56479-a4bf-4a7e-b2b0-0ec3ffbd726f', 'Película de Vidro 3D', 'Película de vidro temperado com proteção total da tela, borda 3D e alta transparência. Aplicação sem bolhas. (Foto ilustrativa)', 49.9, 'Acessórios', null, null, '[]'::jsonb, '06RXJ1QMD9', 'published', 35),
  ('005a9700-3b21-4f43-b659-25c25ea15b13', 'AirPods Pro 2 (USB-C)', 'Fone de ouvido sem fio com Cancelamento Ativo de Ruído, áudio espacial e estojo MagSafe USB-C. Original, lacrado e com nota fiscal.', 1899, 'Acessórios', null, null, '[]'::jsonb, 'DZF0ZD9MG0', 'published', 36),
  ('32520009-0a13-49d9-8c9a-7ed29a675858', 'MacBook Pro M1 Max (2021) 16pol 32GB', 'Seminovo · Chip Apple M1 Max · 32GB RAM · SSD 1TB · Tela 16&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 10039, 'Macs Seminovos', null, null, '[]'::jsonb, '5MMMK7R3PP', 'published', 37),
  ('03c799dd-06ef-4bfa-9355-32d78844eb78', 'MacBook Pro M1 Max (2021) 16pol 16GB', 'Seminovo · Chip Apple M1 Max · 16GB RAM · SSD 1TB · Tela 16&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 9979, 'Macs Seminovos', null, null, '[]'::jsonb, '71SQADNEYX', 'published', 38),
  ('28306c65-cbdd-4b72-bad2-175acaaf6704', 'MacBook Pro M1 Pro (2021) 14pol 1TB', 'Seminovo · Chip Apple M1 Pro · 16GB RAM · SSD 1TB · Tela 14&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 6079, 'Macs Seminovos', null, null, '[]'::jsonb, '5NC8HEAXVI', 'published', 39),
  ('e32f6718-dad1-4ad8-bb24-439ef0e3804c', 'MacBook Pro M1 Pro (2021) 16pol 512GB', 'Seminovo · Chip Apple M1 Pro · 16GB RAM · SSD 512GB · Tela 16&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 5669, 'Macs Seminovos', null, null, '[]'::jsonb, '4E2IM7OFCC', 'published', 40),
  ('61dbcaef-2a9c-4d46-9b37-64c45c89ba3b', 'MacBook Pro M1 Pro (2021) 14pol 512GB', 'Seminovo · Chip Apple M1 Pro · 16GB RAM · SSD 512GB · Tela 14&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 5609, 'Macs Seminovos', null, null, '[]'::jsonb, '84U8EN5B1G', 'published', 41),
  ('7735963e-b327-48a1-9b2e-7f687b49f2b9', 'MacBook Pro M1 (2020) 13pol 512GB', 'Seminovo · Chip Apple M1 · 8GB RAM · SSD 512GB · Tela 13&quot; · Space Gray · Revisado, testado e com garantia iWorld Prime.', 5169, 'Macs Seminovos', null, null, '[]'::jsonb, 'TQOXOD6KU2', 'published', 42),
  ('b88ed489-9b50-49c4-8ad1-f58ec7995e54', 'MacBook Pro M2 (2022) 13pol 256GB', 'Seminovo · Chip Apple M2 · 8GB RAM · SSD 256GB · Tela 13&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 4519, 'Macs Seminovos', null, null, '[]'::jsonb, 'GDB4UGMY0F', 'published', 43),
  ('dcfc71fa-6858-4524-b863-5cbee9a8f26a', 'MacBook Air M2 (2022) 256GB', 'Seminovo · Chip Apple M2 · 8GB RAM · SSD 256GB · Tela 13.6&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 4449, 'Macs Seminovos', null, null, '[]'::jsonb, 'WGO7LRX12T', 'published', 44),
  ('32692528-f54c-44fd-a9b0-99b97aa028b7', 'MacBook Pro M1 (2020) 13pol 256GB', 'Seminovo · Chip Apple M1 · 8GB RAM · SSD 256GB · Tela 13&quot; · Space Gray · Revisado, testado e com garantia iWorld Prime.', 4269, 'Macs Seminovos', null, null, '[]'::jsonb, 'V5ENGHO9GE', 'published', 45),
  ('5b0a0bcf-2a5b-4470-a58d-0b2e63ff9239', 'MacBook Air M1 (2020) 512GB', 'Seminovo · Chip Apple M1 · 16GB RAM · SSD 512GB · Tela 13.3&quot; · Prateado · Revisado, testado e com garantia iWorld Prime.', 3989, 'Macs Seminovos', null, null, '[]'::jsonb, 'JVWTYW07RW', 'published', 46),
  ('c53df7b2-6f13-4402-a50b-17a356c1f059', 'MacBook Air M1 (2020) 256GB', 'Seminovo · Chip Apple M1 · 8GB RAM · SSD 256GB · Tela 13.3&quot; · Cinza Espacial · Revisado, testado e com garantia iWorld Prime.', 3429, 'Macs Seminovos', null, null, '[]'::jsonb, 'L6A01COU8X', 'published', 47),
  ('db1b3b2a-829c-4047-aaad-cf36cf330b47', 'Produto Teste R$1', 'Produto interno de teste da iWorld Prime. Nao e para venda ao publico. Usado apenas para testar o fluxo de checkout com valor de R$1.', 1, 'Teste', null, null, '[]'::jsonb, 'FBNHA6033L', 'draft', 48),
  ('67e5f9e1-deca-4774-a1f7-7bb8b77064a6', 'iPhone 18 Pro', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 1TB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 14499, 'iPhones', null, null, '[]'::jsonb, '6C76DCIHIF', 'published', 49),
  ('18da66ee-910c-4188-ae58-ad986b5f4a77', 'iPhone 18 Pro', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 512GB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 12499, 'iPhones', null, null, '[]'::jsonb, 'X00QPYAIHR', 'published', 50),
  ('e6fbdb3b-69fe-4cc8-8baf-b4c5e612dba8', 'iPhone 18 Pro', 'PRÉ-VENDA · Lançamento em setembro de 2026. Reserve o seu agora. Condição: Novo. Especificações: 256GB - Cereja-escuro, Cinza-escuro, Azul-claro e Prateado - Apple', 10999, 'iPhones', null, null, '[]'::jsonb, '2JJ9ODK8G1', 'published', 51),
  ('e8c108c7-c938-449c-bd85-9e5ffba6fc4e', 'Dji Lito X1 Fly More Combo ( Com tela )', 'Condição: Novo. Especificações: Cinza - DJI', 7890, 'Drones', null, null, '[]'::jsonb, 'CES5EOJFME', 'published', 52),
  ('93de2a98-e24f-4cc5-becf-b212ba4c23de', 'Drone DJI Neo 2 Fly More Combo (Sem tela) BR', 'Condição: Novo. Especificações: Cinza - DJI', 4590, 'Drones', null, null, '[]'::jsonb, '9O1TV4S29C', 'published', 53),
  ('52981ecd-3ce1-4db4-bc4f-39052677b72a', 'iPad 10', 'Condição: Novo. Especificações: 64GB - Todas as cores - Apple', 2399, 'iPads', null, null, '[]'::jsonb, 'HAMYMPTGH3', 'published', 54),
  ('b4c5be19-e988-4285-95e5-c7dfddb45a0a', 'iPad 11', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 2999, 'iPads', null, null, '[]'::jsonb, 'WKXC0MGBNS', 'published', 55),
  ('820c2297-cd99-4603-9783-f33013b3d997', 'iPhone 15', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 4299, 'iPhones', null, null, '[]'::jsonb, '00HH80CHF4', 'published', 56),
  ('8bde6aff-9ab5-4bdf-939b-37279424ee67', 'iPhone 15', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 4999, 'iPhones', null, null, '[]'::jsonb, 'OGIX2TE4TC', 'published', 57),
  ('0e912b55-93b3-42b3-a222-e9d070e9c022', 'iPhone 15 Pro', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 6000, 'iPhones', null, null, '[]'::jsonb, '87V1BF6225', 'published', 58),
  ('a7bd38ef-88bf-4eaf-8592-3429817406f6', 'iPhone 16', 'Condição: Novo. Especificações: 128GB - Todas as cores - Apple', 5199, 'iPhones', null, null, '[]'::jsonb, 'Q7IOODLD1L', 'published', 59),
  ('acaffadb-cd1c-478a-8892-8f606bc6e320', 'iPhone 16', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 5800, 'iPhones', null, null, '[]'::jsonb, 'GGCY8FI9VV', 'published', 60),
  ('630b9be7-9998-4172-83de-776e45207367', 'iPhone 17', 'Condição: Novo. Especificações: 256GB - Preto, Branco - Apple', 6599, 'iPhones', null, null, '[]'::jsonb, 'MTVVEA1X8E', 'published', 61),
  ('55a6b6ad-8c06-48f4-aba0-50044cdbde22', 'iPhone 17 Pro', 'Condição: Novo. Especificações: 256GB - Cosmic Orange, Azul e Branco - Apple', 8999, 'iPhones', null, null, '[]'::jsonb, 'W3MMGUESCF', 'published', 62),
  ('03b50ee8-dae2-42d3-924f-0c27c6255fca', 'iPhone 17 Pro Max', 'Condição: Novo. Especificações: 256GB - Cosmic Orange, Azul e Silver - Apple', 9599, 'iPhones', null, null, '[]'::jsonb, '4BCVXEXL2B', 'published', 63),
  ('92e51115-a8c0-40f1-bc25-7d291bf406b1', 'iPhone 17 Pro Max', 'Condição: Novo. Especificações: 512GB - Cosmic Orange, Azul , Branco - Apple', 10999, 'iPhones', null, null, '[]'::jsonb, 'TBSVB6KH1A', 'published', 64),
  ('add00b1e-95d1-4fce-b413-dbc0e8be9ef2', 'iPhone 17 Pro Max', 'Condição: Novo. Especificações: 1TB - Orange, Prata ou Azul - Apple', 12999, 'iPhones', null, null, '[]'::jsonb, '8PXHLILG92', 'published', 65),
  ('5ed28660-4c76-4566-ba0a-ba29322d3f19', 'iPhone Air', 'Condição: Novo. Especificações: 256GB - Preto, Branco, Dourado e Estelelar - Apple', 6999, 'iPhones', null, null, '[]'::jsonb, '1D9CNFONA4', 'published', 66),
  ('3111caa5-9de0-46f1-bfa0-0396d3f2417b', 'JBL BOOMBOX 4', 'Condição: Novo. Especificações: Preta - JBL', 2499, 'Caixas de Som', null, null, '[]'::jsonb, '1DZLANTSUG', 'published', 67),
  ('791f9b38-5d7a-49eb-89c4-3e8a2175b731', 'JBL Party Box 520', 'Condição: Novo. Especificações: Preto - JBL', 4199, 'Caixas de Som', null, null, '[]'::jsonb, 'RYHWS0N2LH', 'published', 68),
  ('51fd3fef-f318-4ad6-a554-fc818e166064', 'JBL PARTY BOX 720', 'Condição: Novo. Especificações: PRETO - JBL', 4999, 'Caixas de Som', null, null, '[]'::jsonb, 'ADKPIEJ8MV', 'published', 69),
  ('30c31114-7c85-4518-a0a4-9252591ce362', 'Macbook Air M4', 'Condição: Novo. Especificações: 256GB - Todas as cores - Apple', 7800, 'Macs', null, null, '[]'::jsonb, 'HIY0459ZR4', 'published', 70),
  ('34d4c40d-b199-4e38-8855-4d7243cf0e63', 'Osmo Pocket 3 Creator Combo', 'Condição: Novo. Especificações: Preto - DJI', 5490, 'Drones', null, null, '[]'::jsonb, '8JCAX7LZWL', 'published', 71),
  ('54d138c3-9c1c-4880-b8ee-6491abdfe4a2', 'Osmo Pocket Standard', 'Condição: Novo. Especificações: Preto - DJI', 4590, 'Drones', null, null, '[]'::jsonb, 'WUOINUF72O', 'published', 72),
  ('640b607e-5038-41e9-8337-8f6910273221', 'Ray Ban Meta Display', 'Condição: Novo. Especificações: Preto - Meta', 7599, 'Acessórios', null, null, '[]'::jsonb, '6KPBPL3EMQ', 'published', 73)
on conflict (id) do nothing;
