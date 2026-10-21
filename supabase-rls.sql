-- ===========================================================================
-- Estrutura + RLS do iWorld Prime — PROJETO NOVO
--
--     ref:        kiozwryulztunsrfqdus   (conta sac@iworldprime)
--     SQL Editor: https://supabase.com/dashboard/project/kiozwryulztunsrfqdus/sql/new
--
-- O projeto esta vazio, entao aqui a estrutura ja nasce com RLS ligado — em
-- vez de criar tudo aberto e proteger depois.
--
-- Cole TUDO e clique em Run. Roda mais de uma vez sem problema.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- BLOCO 1 — tabela de clientes
-- Cada linha e o perfil de um usuario autenticado. A chave primaria aponta
-- para auth.users, entao o perfil morre junto com a conta.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  role               text not null default 'cliente',
  whatsapp           text,
  whatsapp_business  text,
  points_pos         integer not null default 0,
  points_neg         integer not null default 0,
  cargos             text,
  tag                text,
  created_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil proprio: leitura" on public.profiles;
drop policy if exists "perfil proprio: escrita" on public.profiles;

-- Cada pessoa enxerga e edita apenas a propria linha. Sem policy de select
-- para `anon`, ninguem deslogado lista nada — que era exatamente o furo do
-- projeto antigo, onde um GET devolvia email, nome e whatsapp de todos.
create policy "perfil proprio: leitura"
  on public.profiles for select
  to authenticated
  using ( auth.uid() = id );

create policy "perfil proprio: escrita"
  on public.profiles for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Sem policy de INSERT nem DELETE: quem cria o perfil e o gatilho do bloco 2,
-- e ninguem apaga perfil pela API publica.


-- ---------------------------------------------------------------------------
-- BLOCO 2 — criar o perfil automaticamente no cadastro
-- Sem isto, quem se cadastra fica sem linha em profiles e o site quebra ao
-- tentar ler os dados da conta.
-- ---------------------------------------------------------------------------

create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$func$;

drop trigger if exists trg_criar_perfil on auth.users;

create trigger trg_criar_perfil
  after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();


-- ---------------------------------------------------------------------------
-- BLOCO 3 — trava de escalacao de privilegio
-- A policy de update deixa a pessoa editar a propria linha, e existe a coluna
-- `role`. Sem esta trava, um cliente faria
-- PATCH /profiles?id=eq.<seu_id> {"role":"ceo"} e viraria admin.
-- ---------------------------------------------------------------------------

create or replace function public.impedir_mudanca_de_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.role is distinct from old.role then
    raise exception 'Alterar role pela API nao e permitido';
  end if;
  return new;
end;
$func$;

drop trigger if exists trg_impedir_mudanca_de_role on public.profiles;

create trigger trg_impedir_mudanca_de_role
  before update on public.profiles
  for each row execute function public.impedir_mudanca_de_role();


-- ---------------------------------------------------------------------------
-- BLOCO 4 — banners das paginas de categoria
-- E o que faz o Studio de Banners do painel publicar de verdade, em vez de
-- salvar so no navegador de quem editou.
-- ---------------------------------------------------------------------------

create table if not exists public.banners (
  categoria      text primary key,
  imagem_url     text,
  titulo         text,
  subtitulo      text,
  cta_texto      text,
  cta_link       text,
  atualizado_em  timestamptz not null default now()
);

alter table public.banners enable row level security;

drop policy if exists "banner: leitura publica" on public.banners;

-- Leitura publica de proposito: o banner aparece para visitante deslogado e
-- nao ha nada sigiloso nele. A escrita fica fora da API — quem grava e o
-- painel, pelo servidor.
create policy "banner: leitura publica"
  on public.banners for select
  to anon, authenticated
  using ( true );


-- ---------------------------------------------------------------------------
-- BLOCO 5 — conferencia
-- rowsecurity deve vir 't' nas duas linhas.
-- ---------------------------------------------------------------------------

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'banners')
order by tablename;
