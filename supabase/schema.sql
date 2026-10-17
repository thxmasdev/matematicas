-- ==============================================================================
-- MATEMÁTICA UNSE 2027 — ESQUEMA DE BASE DE DATOS EN SUPABASE
-- ==============================================================================
-- Copia y pega este script en el "SQL Editor" de tu proyecto de Supabase y haz
-- clic en "RUN". Configurará las tablas, índices, políticas públicas RLS y el
-- trigger automático que actualiza el Scoreboard global en tiempo real.
-- ==============================================================================

-- 1. Tabla de Historial de Intentos de Ejercicios
create table if not exists public.exercise_history (
  id text primary key,
  module_id integer not null,
  topic_id text not null,
  template_id text not null,
  fingerprint text not null,
  difficulty text not null,
  seed text not null,
  timestamp bigint not null,
  correct boolean not null,
  user_answer text not null,
  time_ms integer not null default 0,
  session_id text not null,
  user_name text not null default 'Usuario Anónimo',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 2. Tabla del Scoreboard Global y Perfiles de Aspirantes
create table if not exists public.scoreboard_profiles (
  user_name text primary key,
  score integer not null default 0,
  correct_count integer not null default 0,
  total_attempts integer not null default 0,
  accuracy integer not null default 0,
  total_time_ms bigint not null default 0,
  modules_played integer[] not null default '{}',
  last_active bigint not null default 0,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. Índices para consultas de alta velocidad en el Leaderboard
create index if not exists idx_scoreboard_score on public.scoreboard_profiles (score desc, accuracy desc);
create index if not exists idx_history_user on public.exercise_history (user_name);
create index if not exists idx_history_module on public.exercise_history (module_id);
create index if not exists idx_history_timestamp on public.exercise_history (timestamp desc);

-- 4. Habilitar Row Level Security (RLS)
alter table public.exercise_history enable row level security;
alter table public.scoreboard_profiles enable row level security;

-- 5. Políticas públicas (anónimas) de lectura y escritura para la app educativa
-- Historial: Lectura e Inserción libre para usuarios anónimos/estudiantes
drop policy if exists "Permitir lectura publica de historial" on public.exercise_history;
create policy "Permitir lectura publica de historial"
  on public.exercise_history for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir insercion de historial" on public.exercise_history;
create policy "Permitir insercion de historial"
  on public.exercise_history for insert
  to anon, authenticated
  with check (true);

-- Scoreboard: Lectura libre, Inserción y Actualización pública
drop policy if exists "Permitir lectura publica de scoreboard" on public.scoreboard_profiles;
create policy "Permitir lectura publica de scoreboard"
  on public.scoreboard_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir upsert de scoreboard" on public.scoreboard_profiles;
create policy "Permitir upsert de scoreboard"
  on public.scoreboard_profiles for all
  to anon, authenticated
  using (true)
  with check (true);

-- 6. Trigger automático: Al insertar un ejercicio, actualiza el Scoreboard al instante
create or replace function public.handle_exercise_history_insert()
returns trigger as $$
declare
  v_pts integer := 1;
begin
  if new.correct then
    v_pts := case new.difficulty
      when 'facil' then 10
      when 'intermedio' then 25
      when 'dificil' then 50
      when 'avanzado' then 100
      else 10
    end;
  else
    v_pts := 1;
  end if;

  insert into public.scoreboard_profiles (
    user_name,
    score,
    correct_count,
    total_attempts,
    accuracy,
    total_time_ms,
    modules_played,
    last_active,
    updated_at
  )
  values (
    new.user_name,
    v_pts,
    case when new.correct then 1 else 0 end,
    1,
    case when new.correct then 100 else 0 end,
    coalesce(new.time_ms, 0),
    array[new.module_id],
    new.timestamp,
    now()
  )
  on conflict (user_name) do update set
    score = scoreboard_profiles.score + v_pts,
    correct_count = scoreboard_profiles.correct_count + (case when new.correct then 1 else 0 end),
    total_attempts = scoreboard_profiles.total_attempts + 1,
    accuracy = round(((scoreboard_profiles.correct_count + (case when new.correct then 1 else 0 end))::numeric / (scoreboard_profiles.total_attempts + 1)::numeric) * 100),
    total_time_ms = scoreboard_profiles.total_time_ms + coalesce(new.time_ms, 0),
    modules_played = array(
      select distinct unnest(scoreboard_profiles.modules_played || array[new.module_id])
      order by 1
    ),
    last_active = greatest(scoreboard_profiles.last_active, new.timestamp),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_exercise_history_created on public.exercise_history;
create trigger on_exercise_history_created
  after insert on public.exercise_history
  for each row execute function public.handle_exercise_history_insert();

-- 7. Datos iniciales de Aspirantes UNSE para que el Scoreboard esté poblado y activo
insert into public.scoreboard_profiles (user_name, score, correct_count, total_attempts, accuracy, total_time_ms, modules_played, last_active)
values
  ('Lucas_Ingenieria', 920, 44, 48, 92, 2700000, array[1,2,3,4,5,6,7], 1729000000000),
  ('Valen_FCEyT', 760, 35, 39, 90, 2100000, array[1,2,3,4,5,7], 1728950000000),
  ('MateMaster27', 610, 29, 34, 85, 1800000, array[1,2,3,5,6], 1728900000000),
  ('Santiagueño_UNSE', 480, 23, 27, 85, 1500000, array[1,2,3,4], 1728850000000),
  ('Camila_S', 360, 18, 22, 82, 1200000, array[1,2,3], 1728800000000),
  ('Matias_Exactas', 250, 13, 16, 81, 900000, array[1,2], 1728750000000)
on conflict (user_name) do nothing;
