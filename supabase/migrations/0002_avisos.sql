-- Galletapp: cupos libres visibles para todos y avisos al celular (web push).

-- Cupos libres de un partido. PostgREST lo expone como columna calculada:
-- select=*,cupos_libres
create or replace function public.cupos_libres(p public.partidos)
returns int
language sql stable security definer set search_path = public
as $$
  select p.cupos - (select count(*) from postulaciones a where a.partido_id = p.id and a.estado = 'aceptado')::int;
$$;

-- Suscripciones de avisos de cada usuario (una por navegador/celular).
create table public.suscripciones_push (
  endpoint text primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);
alter table public.suscripciones_push enable row level security;
create policy "mis suscripciones" on public.suscripciones_push
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Registro de avisos ya enviados, para no repetir.
create table public.avisos_enviados (
  clave text not null,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  enviado_en timestamptz not null default now(),
  primary key (clave, usuario_id)
);
alter table public.avisos_enviados enable row level security;

-- Avisos que falta enviar. Lo llama el proceso de avisos con la clave de
-- servicio (no lo pueden llamar los usuarios).
create or replace function public.avisos_por_enviar()
returns table (clave text, usuario_id uuid, titulo text, cuerpo text, url text)
language sql stable security definer set search_path = public
as $$
  with pendientes as (
    -- Partido cerca: según la zona guardada del jugador y el radio actual.
    select 'cerca:' || p.id as clave, j.id as usuario_id,
      'Falta' || case when cupos_libres(p) > 1 then 'n ' else ' ' end || cupos_libres(p) || ' para fútbol ' || p.formato as titulo,
      p.cancha || ' · ' || to_char(p.inicio at time zone 'America/Santiago', 'HH24:MI') ||
        ' · a ' || round(distancia_km(j.lat, j.lng, p.lat, p.lng)::numeric, 1) || ' km' as cuerpo,
      '/partido/' || p.id as url
    from partidos p
    join perfiles j on j.id <> p.organizador_id and j.lat is not null
    where p.estado = 'abierto'
      and p.inicio > now() and p.inicio <= now() + interval '24 hours'
      and (j.bloqueado_hasta is null or j.bloqueado_hasta < now())
      and distancia_km(j.lat, j.lng, p.lat, p.lng) <= least(radio_actual_km(p.creado_en), j.distancia_max_km)
      and not exists (select 1 from postulaciones a where a.partido_id = p.id and a.jugador_id = j.id)

    union all
    -- Alguien se apuntó: avisar al organizador.
    select 'postulacion:' || a.id, p.organizador_id,
      j.nombre || ' quiere jugar', p.cancha || ' · ' || to_char(p.inicio at time zone 'America/Santiago', 'HH24:MI'),
      '/partido/' || p.id
    from postulaciones a join partidos p on p.id = a.partido_id join perfiles j on j.id = a.jugador_id
    where a.estado = 'pendiente' and p.inicio > now()

    union all
    -- Te aceptaron.
    select 'aceptado:' || a.id, a.jugador_id,
      '¡Quedaste! ⚽', p.cancha || ' · ' || to_char(p.inicio at time zone 'America/Santiago', 'HH24:MI'),
      '/partido/' || p.id
    from postulaciones a join partidos p on p.id = a.partido_id
    where a.estado = 'aceptado' and p.inicio > now()

    union all
    -- Un confirmado se bajó: avisar al organizador.
    select 'retiro:' || a.id, p.organizador_id,
      j.nombre || ' no puede ir', 'Volvimos a buscar jugadores para ' || p.cancha,
      '/partido/' || p.id
    from postulaciones a join partidos p on p.id = a.partido_id join perfiles j on j.id = a.jugador_id
    where a.estado = 'retirado' and p.inicio > now()

    union all
    -- Partido cancelado: avisar a quienes se apuntaron.
    select 'cancelado:' || p.id, a.jugador_id,
      'Partido cancelado', p.cancha || ' · ' || to_char(p.inicio at time zone 'America/Santiago', 'HH24:MI'),
      '/partidos'
    from partidos p join postulaciones a on a.partido_id = p.id
    where p.estado = 'cancelado' and a.estado in ('pendiente', 'aceptado') and p.inicio > now()
  )
  select x.* from pendientes x
  where exists (select 1 from suscripciones_push s where s.usuario_id = x.usuario_id)
    and not exists (select 1 from avisos_enviados e where e.clave = x.clave and e.usuario_id = x.usuario_id);
$$;

revoke execute on function public.avisos_por_enviar() from public, anon, authenticated;
