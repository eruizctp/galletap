-- Galletapp: ingreso con Google en vez de SMS.
-- Google no entrega un celular verificado, así que cada jugador escribe el suyo
-- en el perfil. Se necesita para coordinar por WhatsApp: sin celular no se
-- puede publicar ni postular.
--
-- Va en una tabla aparte porque los perfiles los ve cualquier usuario y el
-- celular solo se entrega entre organizador y confirmados (contactos_partido).

create table public.celulares (
  id uuid primary key references public.perfiles (id) on delete cascade,
  celular text not null check (celular ~ '^\+569[0-9]{8}$'),
  actualizado_en timestamptz not null default now()
);
alter table public.celulares enable row level security;
create policy "ver mi celular" on public.celulares
  for select to authenticated using (id = auth.uid());
create policy "guardar mi celular" on public.celulares
  for insert to authenticated with check (id = auth.uid());
create policy "cambiar mi celular" on public.celulares
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.celulares to authenticated;

-- Celular para coordinar: el del perfil, o el del login por SMS en cuentas antiguas.
create or replace function public.celular_de(uid uuid)
returns text
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(
    (select c.celular from celulares c where c.id = uid),
    (select u.phone::text from auth.users u where u.id = uid and u.phone <> '')
  );
$$;
revoke execute on function public.celular_de(uuid) from public, anon, authenticated;

-- Regla: para publicar o postular hay que tener celular.
create or replace function public.exigir_celular()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  -- tg_argv[0]: la columna con el usuario (organizador_id o jugador_id).
  uid uuid := (to_jsonb(new) ->> tg_argv[0])::uuid;
begin
  if celular_de(uid) is null then
    raise exception 'Agrega tu celular en el perfil para coordinar por WhatsApp';
  end if;
  return new;
end;
$$;
revoke execute on function public.exigir_celular() from public, anon, authenticated;

create trigger partidos_exigir_celular before insert on public.partidos
  for each row execute function public.exigir_celular('organizador_id');
create trigger postulaciones_exigir_celular before insert on public.postulaciones
  for each row execute function public.exigir_celular('jugador_id');

-- Teléfonos para coordinar: solo entre organizador y jugadores aceptados.
create or replace function public.contactos_partido(p_partido uuid)
returns table (jugador_id uuid, nombre text, telefono text, rol text)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if not es_participante(p_partido, auth.uid()) then raise exception 'No autorizado'; end if;
  return query
    select pr.id, pr.nombre, celular_de(pr.id), 'organizador'::text
      from partidos p join perfiles pr on pr.id = p.organizador_id
      where p.id = p_partido
    union all
    select pr.id, pr.nombre, celular_de(pr.id), 'jugador'::text
      from postulaciones a join perfiles pr on pr.id = a.jugador_id
      where a.partido_id = p_partido and a.estado = 'aceptado';
end;
$$;
