-- Tabela de banners das paginas de categoria
-- Rode no painel do Supabase: SQL Editor > New query > Run.
--
-- O site ja funciona sem isto: o banners.js tem um padrao embutido para cada
-- categoria. Esta tabela existe para o painel poder trocar banner, titulo,
-- subtitulo e botao sem precisar de deploy.
--
-- IMPORTANTE: rode antes o supabase-rls.sql. Ele liga o RLS na tabela profiles
-- e cria a trava de role, das quais a politica de escrita aqui depende.

create table if not exists public.banners (
  categoria     text primary key,
  imagem_url    text,
  titulo        text,
  subtitulo     text,
  cta_texto     text,
  cta_link      text,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);

alter table public.banners enable row level security;

drop policy if exists "banner: leitura publica" on public.banners;
drop policy if exists "banner: escrita admin"   on public.banners;

-- Banner aparece para visitante deslogado, entao a leitura e publica de
-- proposito. Nao ha nada sigiloso aqui: e a arte do topo da categoria.
create policy "banner: leitura publica"
  on public.banners for select
  to anon, authenticated
  using ( true );

-- Escrita so para quem tem role de admin na tabela profiles.
create policy "banner: escrita admin"
  on public.banners for all
  to authenticated
  using ( public.e_admin() )
  with check ( public.e_admin() );

-- Funcao separada para a politica nao ler profiles diretamente (o RLS de
-- profiles bloquearia a consulta). SECURITY DEFINER roda como dono da funcao.
create or replace function public.e_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('ceo', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- Como liberar o painel para editar
-- ---------------------------------------------------------------------------
-- 1. Supabase > Authentication > Users > Add user
--    Crie o usuario com o e-mail do admin e uma senha nova
--    (NAO reaproveite a senha que estava exposta no admin-login.html).
--
-- 2. Copie o UUID do usuario criado e rode, trocando os dois valores:
--
--      insert into public.profiles (id, email, full_name, role)
--      values ('COLE-O-UUID-AQUI', 'sac@iworldprime.com.br', 'James Nobre', 'ceo')
--      on conflict (id) do update set role = 'ceo';
--
-- 3. Pronto: esse usuario passa a poder salvar banners pelo painel.
--    Qualquer outra pessoa so consegue ler.

-- ---------------------------------------------------------------------------
-- Conferencia
-- ---------------------------------------------------------------------------
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'banners';
