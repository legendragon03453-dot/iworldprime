-- ===========================================================================
-- Avaliações dos clientes — iWorld Prime
--
--     ref:        kiozwryulztunsrfqdus
--     SQL Editor: https://supabase.com/dashboard/project/kiozwryulztunsrfqdus/sql/new
--
-- Sem rodar isto, o site ainda funciona: a avaliação fica salva só no navegador
-- de quem escreveu (localStorage). Depois de rodar, as avaliações passam a ser
-- COMPARTILHADAS — todo visitante vê as dos outros.
--
-- Cole tudo e clique em Run. Pode rodar mais de uma vez.
-- ===========================================================================

create table if not exists public.avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  produto     text not null,                 -- chave do modelo, ex: "iphone-13"
  nome        text not null,
  nota        smallint not null,
  texto       text not null,
  criado_em   timestamptz not null default now(),
  constraint nota_valida  check (nota between 1 and 5),
  constraint nome_tam     check (char_length(nome)  between 1 and 40),
  constraint texto_tam    check (char_length(texto) between 1 and 600)
);

create index if not exists idx_avaliacoes_produto on public.avaliacoes (produto, criado_em desc);

alter table public.avaliacoes enable row level security;

drop policy if exists "avaliacao: leitura publica" on public.avaliacoes;
drop policy if exists "avaliacao: qualquer um publica" on public.avaliacoes;

-- Leitura pública: qualquer visitante vê as avaliações.
create policy "avaliacao: leitura publica"
  on public.avaliacoes for select
  to anon, authenticated
  using ( true );

-- Escrita pública, mas só INSERT (ninguém edita/apaga avaliação dos outros pela
-- API). Os CHECK da tabela barram nota fora de 1–5 e textos gigantes.
create policy "avaliacao: qualquer um publica"
  on public.avaliacoes for insert
  to anon, authenticated
  with check (
    char_length(nome)  between 1 and 40 and
    char_length(texto) between 1 and 600 and
    nota between 1 and 5
  );

-- Conferência
select count(*) as total_avaliacoes from public.avaliacoes;
