-- supabase-pedidos.sql
-- Tabela de PEDIDOS (dados do cliente + itens). Rode UMA vez no SQL Editor do
-- projeto kiozwryulztunsrfqdus.
--
-- Segurança: o RLS fica LIGADO e SEM nenhuma policy para o público (anon).
-- Ou seja, ninguém consegue ler nem escrever pedidos com a chave publishable —
-- só o SERVIDOR, que usa a service_role (ela ignora o RLS). Assim:
--   - o checkout grava o pedido pelo servidor (/api/mercadopago);
--   - o admin lê os pedidos pelo servidor (/api/pedidos);
--   - um cliente NUNCA vê os dados (nome, telefone, endereço) de outro.

create extension if not exists "pgcrypto";

create table if not exists public.pedidos (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),

  -- Dados do cliente
  nome          text,
  email         text,
  telefone      text,          -- WhatsApp / telefone
  cep           text,
  endereco      text,          -- rua / logradouro
  numero        text,
  complemento   text,
  bairro        text,
  cidade        text,
  estado        text,

  -- Pedido
  itens         jsonb not null default '[]'::jsonb,   -- [{id, nome, quantidade, preco}]
  total         numeric(12,2) not null default 0,
  status        text not null default 'aguardando_pagamento', -- aguardando_pagamento | pago | pendente | cancelado

  -- Mercado Pago
  mp_preference_id text,
  mp_payment_id    text
);

alter table public.pedidos enable row level security;
-- Nenhuma policy: público (anon/authenticated) não lê nem escreve. Só service_role.

create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em desc);
