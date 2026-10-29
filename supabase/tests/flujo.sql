-- Prueba del flujo completo. Ejecutar sobre stub_supabase.sql + migraciones.
\set ON_ERROR_STOP 1
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', '+56911111111'),
  ('00000000-0000-0000-0000-000000000001', '+56922222222'),
  ('00000000-0000-0000-0000-000000000002', '+56933333333'),
  ('00000000-0000-0000-0000-000000000003', '+56944444444');
insert into public.perfiles (id, nombre, distancia_max_km, lat, lng) values
  ('00000000-0000-0000-0000-00000000000a', 'Organizador', 10, -33.4560, -70.5970),
  ('00000000-0000-0000-0000-000000000001', 'Cerca 3km', 20, -33.4560, -70.5648),
  ('00000000-0000-0000-0000-000000000002', 'Medio 8km', 20, -33.4560, -70.5110),
  ('00000000-0000-0000-0000-000000000003', 'Lejos 15km max10', 10, -33.4560, -70.4360);

create temp table r (k text, v text);
create function pg_temp.yo(u text) returns void language sql as $$ select set_config('test.uid', u, false) $$;
create function pg_temp.vistos() returns text language plpgsql as $$
declare pr record; res text := '';
begin
  for pr in select * from public.perfiles where nombre <> 'Organizador' order by nombre loop
    perform set_config('test.uid', pr.id::text, false);
    if exists (select 1 from public.partidos_cercanos(pr.lat, pr.lng)) then res := res || pr.nombre || '; '; end if;
  end loop;
  return res;
end $$;

select pg_temp.yo('00000000-0000-0000-0000-00000000000a');
insert into r select 'partido', public.publicar_partido('Cancha Ñuñoa', null, -33.4560, -70.5970,
  now() + interval '3 hours', 7::smallint, 'intermedio', 2::smallint);

-- Minuto 0: radio 5 km
insert into r select 't0', pg_temp.vistos();
-- Minuto 20: radio 10 km
update public.partidos set creado_en = now() - interval '20 minutes';
insert into r select 't20', pg_temp.vistos();
-- Minuto 40: radio 20 km, pero "Lejos" tiene máximo 10 km
update public.partidos set creado_en = now() - interval '40 minutes';
insert into r select 't40', pg_temp.vistos();

-- Postulan dos y el organizador acepta ambos -> completo
select pg_temp.yo('00000000-0000-0000-0000-000000000001');
select public.postular((select v::uuid from r where k='partido'), -33.4560, -70.5648);
select pg_temp.yo('00000000-0000-0000-0000-000000000002');
select public.postular((select v::uuid from r where k='partido'), -33.4560, -70.5110);
select pg_temp.yo('00000000-0000-0000-0000-00000000000a');
select public.responder_postulacion(id, true) from public.postulaciones;
insert into r select 'estado_tras_aceptar', estado from public.partidos;
insert into r select 'contactos', string_agg(telefono, ',' order by telefono)
  from public.contactos_partido((select v::uuid from r where k='partido'));

-- Uno se retira -> vuelve a abierto
select pg_temp.yo('00000000-0000-0000-0000-000000000002');
select public.retirarse((select v::uuid from r where k='partido'));
insert into r select 'estado_tras_retiro', estado from public.partidos;

-- Pasa el partido; "Cerca" no llegó. Simulamos dos partidos con falta.
update public.partidos set inicio = now() - interval '1 hour';
select pg_temp.yo('00000000-0000-0000-0000-00000000000a');
select public.marcar_asistencia(id, false) from public.postulaciones where estado = 'aceptado';
insert into r select 'faltas_1', faltas || ' bloq=' || (bloqueado_hasta is not null) from public.perfiles where nombre = 'Cerca 3km';

insert into public.partidos (organizador_id, cancha, lat, lng, inicio, formato, nivel, cupos)
  values ('00000000-0000-0000-0000-00000000000a', 'Otra', -33.456, -70.597, now() - interval '2 hours', 5, 'recreativo', 1);
insert into public.postulaciones (partido_id, jugador_id, estado)
  select id, '00000000-0000-0000-0000-000000000001', 'aceptado' from public.partidos where cancha = 'Otra';
select public.marcar_asistencia(a.id, false) from public.postulaciones a join public.partidos p on p.id=a.partido_id where p.cancha='Otra';
insert into r select 'faltas_2', faltas || ' bloq=' || (bloqueado_hasta > now()) || ' prom=' || calificacion_promedio from public.perfiles where nombre = 'Cerca 3km';

-- Jugador califica al organizador
select pg_temp.yo('00000000-0000-0000-0000-000000000001');
select public.calificar((select v::uuid from r where k='partido'), '00000000-0000-0000-0000-00000000000a', 5::smallint);
insert into r select 'org_calif', calificacion_promedio::text from public.perfiles where nombre='Organizador';

-- Bloqueado no ve partidos
select pg_temp.yo('00000000-0000-0000-0000-00000000000a');
select public.publicar_partido('Nueva', null, -33.4560, -70.5970, now() + interval '2 hours', 5::smallint, 'recreativo', 1::smallint);
select pg_temp.yo('00000000-0000-0000-0000-000000000001');
insert into r select 'bloqueado_ve', count(*)::text from public.partidos_cercanos(-33.4560, -70.5648);

select * from r where k <> 'partido';
-- Esperado: t0=Cerca; t20=Cerca,Medio; t40=Cerca,Medio (Lejos supera su máximo de 10 km)
