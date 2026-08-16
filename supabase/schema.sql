-- ============================================================================
-- APRUMO — banco de dados
--
-- Como usar: abra o Supabase → SQL Editor → New query → cole ESTE ARQUIVO
-- INTEIRO → Run. Pode rodar mais de uma vez sem medo, nada é apagado.
--
-- Cada tabela guarda o dono da linha em user_id e tem RLS ligada, então uma
-- conta nunca enxerga a linha de outra — mesmo com a chave pública exposta no
-- navegador, que é como o app funciona.
-- ============================================================================

-- ---------------------------------------------------------------- perfil ----
create table if not exists public.perfis (
  user_id uuid primary key references auth.users on delete cascade,
  nome text not null default '',
  meta_min_dia integer not null default 240,
  meta_questoes_semana integer not null default 300,
  meta_ativo_pct integer not null default 60,
  escalas jsonb not null default '{"PUCRS":100,"UFRGS":30,"ENEM":1000}'::jsonb,
  criado_em timestamptz not null default now()
);

-- -------------------------------------------------------------- matérias ----
create table if not exists public.materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  cor text not null default '#5C7A2E',
  ordem integer not null default 0,
  arquivada boolean not null default false,
  criado_em timestamptz not null default now()
);

-- --------------------------------------------------------- sessões de estudo -
create table if not exists public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  materia_id uuid not null references public.materias on delete cascade,
  inicio timestamptz not null default now(),
  minutos integer not null check (minutos > 0 and minutos <= 1440),
  atividade text not null,
  tipo text not null check (tipo in ('ativo', 'passivo')),
  assunto text,
  anotacao text,
  criado_em timestamptz not null default now()
);

-- --------------------------------------------------------------- questões ----
create table if not exists public.questoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  materia_id uuid not null references public.materias on delete cascade,
  data date not null default current_date,
  total integer not null check (total > 0),
  acertos integer not null check (acertos >= 0),
  origem text,
  assunto text,
  criado_em timestamptz not null default now(),
  constraint acertos_ate_o_total check (acertos <= total)
);

-- --------------------------------------------------------------- redações ----
create table if not exists public.redacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null default current_date,
  banca text not null check (banca in ('PUCRS', 'UFRGS', 'ENEM')),
  nota numeric(7, 2) not null check (nota >= 0),
  nota_max numeric(7, 2) not null check (nota_max > 0),
  tema text,
  competencias jsonb,
  observacoes text,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------ grade do cursinho ----
create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  dia integer not null check (dia between 0 and 6),
  inicio text not null,
  fim text not null,
  materia_id uuid references public.materias on delete set null,
  titulo text not null default '',
  professor text,
  local text,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- tarefas ----
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  titulo text not null,
  detalhe text,
  data date,
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  concluida boolean not null default false,
  materia_id uuid references public.materias on delete set null,
  ordem integer not null default 0,
  criada_em timestamptz not null default now()
);

-- -------------------------------------------------------------- anotações ----
create table if not exists public.anotacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  titulo text not null default '',
  corpo text not null default '',
  categoria text not null default 'geral' check (categoria in ('melhorar', 'erro', 'ideia', 'geral')),
  materia_id uuid references public.materias on delete set null,
  fixada boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

-- ----------------------------------------------------------------- provas ----
create table if not exists public.provas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  data date not null,
  criado_em timestamptz not null default now()
);

-- ============================================================================
-- Índices: as consultas do app sempre filtram por dono e ordenam por data.
-- ============================================================================
create index if not exists sessoes_user_inicio_idx on public.sessoes (user_id, inicio desc);
create index if not exists questoes_user_data_idx on public.questoes (user_id, data desc);
create index if not exists redacoes_user_data_idx on public.redacoes (user_id, data desc);
create index if not exists tarefas_user_data_idx on public.tarefas (user_id, data);
create index if not exists aulas_user_dia_idx on public.aulas (user_id, dia, inicio);
create index if not exists anotacoes_user_idx on public.anotacoes (user_id, atualizada_em desc);
create index if not exists materias_user_idx on public.materias (user_id, ordem);
create index if not exists provas_user_idx on public.provas (user_id, data);

-- ============================================================================
-- RLS — cada conta só enxerga as próprias linhas.
-- ============================================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'materias', 'sessoes', 'questoes', 'redacoes',
    'aulas', 'tarefas', 'anotacoes', 'provas'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "dono_le" on public.%I', t);
    execute format('drop policy if exists "dono_insere" on public.%I', t);
    execute format('drop policy if exists "dono_altera" on public.%I', t);
    execute format('drop policy if exists "dono_apaga" on public.%I', t);

    execute format('create policy "dono_le" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "dono_insere" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "dono_altera" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "dono_apaga" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- perfis usa user_id como chave primária, então a política olha essa coluna.
alter table public.perfis enable row level security;
drop policy if exists "dono_le" on public.perfis;
drop policy if exists "dono_insere" on public.perfis;
drop policy if exists "dono_altera" on public.perfis;
create policy "dono_le" on public.perfis for select using (auth.uid() = user_id);
create policy "dono_insere" on public.perfis for insert with check (auth.uid() = user_id);
create policy "dono_altera" on public.perfis for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Pronto. Volte para o app e crie a conta.
-- ============================================================================
