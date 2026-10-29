-- Galletapp: esquema inicial
-- Perfiles, partidos, postulaciones, calificaciones y faltas.
-- Todas las acciones que cambian estado pasan por funciones (RPC) para
-- aplicar las reglas del negocio en un solo lugar.

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

-- Distancia en km entre dos puntos (fórmula de haversine).
create or replace function public.distancia_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8
language sql immutable
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Radio de búsqueda de un partido según el tiempo que lleva publicado:
-- 5 km los primeros 15 min, 10 km hasta los 30 min, luego 20 km.
create or replace function public.radio_actual_km(publicado timestamptz, ahora timestamptz default now())
returns int
language sql stable
as $$
  select case
    when ahora - publicado < interval '15 minutes' then 5
    when ahora - publicado < interval '30 minutes' then 10
    else 20
  end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 60),
  foto_url text,
  posicion text not null default 'cualquiera'
    check (posicion in ('arquero', 'defensa', 'medio', 'delantero', 'cualquiera')),
  distancia_max_km int not null default 10 check (distancia_max_km between 1 and 20),
  lat float8,
  lng float8,
  calificacion_promedio numeric(3, 2),
  calificaciones_total int not null default 0,
  faltas int not null default 0,
  bloqueado_hasta timestamptz,
  creado_en timestamptz not null default now()
);

create table public.partidos (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references public.perfiles (id) on delete cascade,
  cancha text not null check (char_length(cancha) between 2 and 80),
  direccion text,
  lat float8 not null,
  lng float8 not null,
  inicio timestamptz not null,
  formato smallint not null check (formato in (5, 6, 7)),
  nivel text not null check (nivel in ('recreativo', 'intermedio', 'competitivo')),
  cupos smallint not null check (cupos between 1 and 3),
  notas text check (char_length(notas) <= 300),
  estado text not null default 'abierto' check (estado in ('abierto', 'completo', 'cancelado')),
  creado_en timestamptz not null default now()
);
create index partidos_inicio_idx on public.partidos (inicio) where estado = 'abierto';

create table public.postulaciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partidos (id) on delete cascade,
  jugador_id uuid not null references public.perfiles (id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptado', 'rechazado', 'retirado')),
  asistio boolean,
  creado_en timestamptz not null default now(),
  unique (partido_id, jugador_id)
);

create table public.calificaciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partidos (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id) on delete cascade,
  calificado_id uuid not null references public.perfiles (id) on delete cascade,
  puntaje smallint not null check (puntaje between 1 and 5),
  creado_en timestamptz not null default now(),
  unique (partido_id, autor_id, calificado_id),
  check (autor_id <> calificado_id)
);

-- ---------------------------------------------------------------------------
-- Seguridad (RLS): lectura limitada; escrituras directas solo en perfil propio
-- y partidos propios. El resto, vía funciones.
-- ---------------------------------------------------------------------------

alter table public.perfiles enable row level security;
alter table public.partidos enable row level security;
alter table public.postulaciones enable row level security;
alter table public.calificaciones enable row level security;

create policy "perfiles visibles para usuarios" on public.perfiles
  for select to authenticated using (true);
create policy "crear perfil propio" on public.perfiles
  for insert to authenticated with check (id = auth.uid());
create policy "editar perfil propio" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Campos que solo el sistema cambia: el usuario no puede tocarlos.
revoke update (calificacion_promedio, calificaciones_total, faltas, bloqueado_hasta)
  on public.perfiles from authenticated;
revoke insert (calificacion_promedio, calificaciones_total, faltas, bloqueado_hasta)
  on public.perfiles from authenticated;

create policy "partidos visibles para usuarios" on public.partidos
  for select to authenticated using (true);

create policy "postulaciones propias o de mis partidos" on public.postulaciones
  for select to authenticated using (
    jugador_id = auth.uid()
    or exists (select 1 from public.partidos p where p.id = partido_id and p.organizador_id = auth.uid())
  );

create policy "calificaciones visibles" on public.calificaciones
  for select to authenticated using (autor_id = auth.uid() or calificado_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reglas internas
-- ---------------------------------------------------------------------------

create or replace function public.esta_bloqueado(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select bloqueado_hasta > now() from perfiles where id = uid), false);
$$;

-- Recalcula si el partido está completo según los aceptados.
create or replace function public.actualizar_estado_partido(p_partido uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  aceptados int;
begin
  select count(*) into aceptados from postulaciones
    where partido_id = p_partido and estado = 'aceptado';
  update partidos set estado = case when aceptados >= cupos then 'completo' else 'abierto' end
    where id = p_partido and estado <> 'cancelado';
end;
$$;

-- Recalcula el promedio de un jugador.
create or replace function public.recalcular_calificacion(p_jugador uuid)
returns void
language sql security definer set search_path = public
as $$
  update perfiles set
    calificacion_promedio = (select round(avg(puntaje)::numeric, 2) from calificaciones where calificado_id = p_jugador),
    calificaciones_total = (select count(*) from calificaciones where calificado_id = p_jugador)
  where id = p_jugador;
$$;

-- ---------------------------------------------------------------------------
-- Funciones públicas (RPC)
-- ---------------------------------------------------------------------------

-- Publicar un partido (solo para las próximas 24 horas).
create or replace function public.publicar_partido(
  p_cancha text, p_direccion text, p_lat float8, p_lng float8,
  p_inicio timestamptz, p_formato smallint, p_nivel text, p_cupos smallint, p_notas text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  nuevo uuid;
begin
  if auth.uid() is null then raise exception 'Debes ingresar'; end if;
  if not exists (select 1 from perfiles where id = auth.uid()) then
    raise exception 'Completa tu perfil antes de publicar';
  end if;
  if esta_bloqueado(auth.uid()) then raise exception 'Tu cuenta está bloqueada temporalmente'; end if;
  if p_inicio <= now() or p_inicio > now() + interval '24 hours' then
    raise exception 'El partido debe ser dentro de las próximas 24 horas';
  end if;
  insert into partidos (organizador_id, cancha, direccion, lat, lng, inicio, formato, nivel, cupos, notas)
    values (auth.uid(), p_cancha, p_direccion, p_lat, p_lng, p_inicio, p_formato, p_nivel, p_cupos, p_notas)
    returning id into nuevo;
  return nuevo;
end;
$$;

-- Cancelar un partido propio.
create or replace function public.cancelar_partido(p_partido uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update partidos set estado = 'cancelado'
    where id = p_partido and organizador_id = auth.uid() and inicio > now();
  if not found then raise exception 'No puedes cancelar este partido'; end if;
end;
$$;

-- Partidos que un jugador puede ver desde su ubicación: próximas 24 h,
-- dentro del radio actual del partido y de la distancia máxima del jugador.
create or replace function public.partidos_cercanos(p_lat float8, p_lng float8)
returns table (
  id uuid, cancha text, direccion text, inicio timestamptz, formato smallint, nivel text,
  cupos smallint, cupos_libres int, notas text, distancia_km float8, radio_km int,
  organizador_nombre text, organizador_calificacion numeric, mi_estado text
)
language plpgsql stable security definer set search_path = public
as $$
declare
  maxkm int;
begin
  if auth.uid() is null then raise exception 'Debes ingresar'; end if;
  select distancia_max_km into maxkm from perfiles where perfiles.id = auth.uid();
  if maxkm is null then raise exception 'Completa tu perfil'; end if;
  if esta_bloqueado(auth.uid()) then return; end if;

  return query
  select p.id, p.cancha, p.direccion, p.inicio, p.formato, p.nivel, p.cupos,
    (p.cupos - (select count(*) from postulaciones a where a.partido_id = p.id and a.estado = 'aceptado'))::int,
    p.notas,
    round(distancia_km(p_lat, p_lng, p.lat, p.lng)::numeric, 1)::float8,
    radio_actual_km(p.creado_en),
    o.nombre, o.calificacion_promedio,
    (select a.estado from postulaciones a where a.partido_id = p.id and a.jugador_id = auth.uid())
  from partidos p
  join perfiles o on o.id = p.organizador_id
  where p.estado = 'abierto'
    and p.organizador_id <> auth.uid()
    and p.inicio > now() and p.inicio <= now() + interval '24 hours'
    and distancia_km(p_lat, p_lng, p.lat, p.lng) <= least(radio_actual_km(p.creado_en), maxkm)
  order by p.inicio;
end;
$$;

-- Postularse a un partido. Se valida de nuevo el radio con la ubicación dada.
create or replace function public.postular(p_partido uuid, p_lat float8, p_lng float8)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from partidos_cercanos(p_lat, p_lng) c where c.id = p_partido) then
    raise exception 'Este partido no está disponible para ti';
  end if;
  insert into postulaciones (partido_id, jugador_id) values (p_partido, auth.uid())
    on conflict (partido_id, jugador_id) do update set estado = 'pendiente'
    where postulaciones.estado = 'retirado';
end;
$$;

-- El jugador se retira de un partido.
create or replace function public.retirarse(p_partido uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update postulaciones set estado = 'retirado'
    where partido_id = p_partido and jugador_id = auth.uid() and estado in ('pendiente', 'aceptado');
  perform actualizar_estado_partido(p_partido);
end;
$$;

-- El organizador acepta o rechaza una postulación.
create or replace function public.responder_postulacion(p_postulacion uuid, p_aceptar boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_partido partidos;
  libres int;
begin
  select p.* into v_partido from partidos p join postulaciones a on a.partido_id = p.id
    where a.id = p_postulacion and p.organizador_id = auth.uid();
  if v_partido.id is null then raise exception 'No autorizado'; end if;

  if p_aceptar then
    select v_partido.cupos - count(*) into libres from postulaciones
      where partido_id = v_partido.id and estado = 'aceptado';
    if libres <= 0 then raise exception 'El partido ya está completo'; end if;
  end if;

  update postulaciones set estado = case when p_aceptar then 'aceptado' else 'rechazado' end
    where id = p_postulacion and estado = 'pendiente';
  perform actualizar_estado_partido(v_partido.id);
end;
$$;

-- El organizador marca si un jugador aceptado llegó. Si no llegó cuenta como
-- falta y una calificación de 1. Con 2 faltas en 90 días: bloqueo de 14 días.
create or replace function public.marcar_asistencia(p_postulacion uuid, p_asistio boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_jugador uuid;
  v_partido uuid;
  v_anterior boolean;
  faltas_recientes int;
begin
  select a.jugador_id, a.partido_id, a.asistio into v_jugador, v_partido, v_anterior
    from postulaciones a join partidos p on p.id = a.partido_id
    where a.id = p_postulacion and p.organizador_id = auth.uid()
      and a.estado = 'aceptado' and p.inicio <= now();
  if v_jugador is null then raise exception 'No puedes marcar asistencia aún'; end if;

  update postulaciones set asistio = p_asistio where id = p_postulacion;

  if p_asistio = false then
    insert into calificaciones (partido_id, autor_id, calificado_id, puntaje)
      values (v_partido, auth.uid(), v_jugador, 1)
      on conflict (partido_id, autor_id, calificado_id) do update set puntaje = 1;
  elsif v_anterior = false then
    -- Corrección: se había marcado falta por error.
    delete from calificaciones
      where partido_id = v_partido and autor_id = auth.uid() and calificado_id = v_jugador and puntaje = 1;
  end if;

  select count(*) into faltas_recientes
    from postulaciones a join partidos p on p.id = a.partido_id
    where a.jugador_id = v_jugador and a.asistio = false and p.inicio > now() - interval '90 days';

  update perfiles set
    faltas = faltas_recientes,
    bloqueado_hasta = case
      when faltas_recientes >= 2 and p_asistio = false then now() + interval '14 days'
      else bloqueado_hasta end
    where id = v_jugador;

  perform recalcular_calificacion(v_jugador);
end;
$$;

-- Calificar a otro participante (organizador o jugador aceptado) después del
-- inicio del partido y hasta 3 días después.
create or replace function public.calificar(p_partido uuid, p_calificado uuid, p_puntaje smallint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_partido partidos;
begin
  select * into v_partido from partidos where id = p_partido;
  if v_partido.id is null or v_partido.inicio > now() or v_partido.inicio < now() - interval '3 days' then
    raise exception 'Este partido no se puede calificar';
  end if;
  if not public.es_participante(p_partido, auth.uid()) or not public.es_participante(p_partido, p_calificado) then
    raise exception 'Solo entre participantes del partido';
  end if;
  insert into calificaciones (partido_id, autor_id, calificado_id, puntaje)
    values (p_partido, auth.uid(), p_calificado, p_puntaje)
    on conflict (partido_id, autor_id, calificado_id) do update set puntaje = excluded.puntaje;
  perform recalcular_calificacion(p_calificado);
end;
$$;

create or replace function public.es_participante(p_partido uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from partidos where id = p_partido and organizador_id = uid)
      or exists (select 1 from postulaciones where partido_id = p_partido and jugador_id = uid and estado = 'aceptado');
$$;

-- Teléfonos para coordinar: solo entre organizador y jugadores aceptados.
create or replace function public.contactos_partido(p_partido uuid)
returns table (jugador_id uuid, nombre text, telefono text, rol text)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if not es_participante(p_partido, auth.uid()) then raise exception 'No autorizado'; end if;
  return query
    select pr.id, pr.nombre, u.phone::text, 'organizador'::text
      from partidos p join perfiles pr on pr.id = p.organizador_id join auth.users u on u.id = pr.id
      where p.id = p_partido
    union all
    select pr.id, pr.nombre, u.phone::text, 'jugador'::text
      from postulaciones a join perfiles pr on pr.id = a.jugador_id join auth.users u on u.id = pr.id
      where a.partido_id = p_partido and a.estado = 'aceptado';
end;
$$;

-- Las funciones internas no se exponen.
revoke execute on function public.actualizar_estado_partido(uuid) from public, anon, authenticated;
revoke execute on function public.recalcular_calificacion(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Almacenamiento de fotos de perfil (bucket público "fotos").
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true)
  on conflict (id) do nothing;

create policy "subir foto propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "reemplazar foto propia" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
