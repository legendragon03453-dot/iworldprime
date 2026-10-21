-- Tabelas de MARKETING: cupons de desconto + configurações (desconto Pix).
-- Rodar uma vez no SQL Editor do Supabase (projeto kiozwryulztunsrfqdus).
--
-- Segurança: RLS LIGADO e SEM policies públicas. Ninguém acessa pela chave
-- publishable. Todo acesso passa pelo servidor (/api/cupons.js) com a
-- service_role, que valida origem e/ou token de admin. Assim os códigos de
-- cupom não vazam e ninguém cria/edita cupom sem ser admin.

-- ---------- CUPONS ----------
create table if not exists public.cupons (
  id           uuid primary key default gen_random_uuid(),
  criado_em    timestamptz not null default now(),
  codigo       text not null unique,               -- sempre MAIÚSCULO (ex: APPLE10)
  tipo         text not null default 'percent',     -- 'percent' (%) ou 'fixo' (R$)
  valor        numeric not null,                    -- 10 = 10% ; 100 = R$100
  ativo        boolean not null default true,
  min_compra   numeric not null default 0,          -- valor mínimo do carrinho
  validade     date,                                -- opcional (null = sem validade)
  usos         integer not null default 0,          -- contador de usos
  descricao    text
);

alter table public.cupons enable row level security;
-- (sem policies: só o servidor com service_role enxerga/mexe)

-- ---------- CONFIGURAÇÕES (desconto Pix etc.) ----------
create table if not exists public.configuracoes (
  chave         text primary key,
  valor         text,
  atualizado_em timestamptz not null default now()
);

alter table public.configuracoes enable row level security;

-- Valor inicial do desconto Pix: 10%.
insert into public.configuracoes (chave, valor)
values ('desconto_pix', '10')
on conflict (chave) do nothing;
