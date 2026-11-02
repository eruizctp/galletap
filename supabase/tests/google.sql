-- Prueba del ingreso con Google: sin celular verificado, el celular va en
-- public.celulares y solo lo ve su dueño. Se ejecuta después de avisos.sql.
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-00000000000b', null);
insert into public.perfiles (id, nombre, distancia_max_km, lat, lng)
  values ('00000000-0000-0000-0000-00000000000b', 'Con Google', 10, -33.4560, -70.5970);
select set_config('test.uid', '00000000-0000-0000-0000-00000000000b', false);

-- Sin celular no puede publicar.
do $$ begin
  perform public.publicar_partido('Sin celular', null, -33.4560, -70.5970, now() + interval '2 hours', 5::smallint, 'recreativo', 1::smallint);
  raise notice 'google_sin_celular publico';
exception when others then
  raise notice 'google_sin_celular %', sqlerrm;
end $$;

-- Guarda su celular como usuario normal (con RLS) y ya puede publicar.
grant select, insert, update, delete on all tables in schema public to authenticated;
set role authenticated;
insert into public.celulares (id, celular) values ('00000000-0000-0000-0000-00000000000b', '+56955555555');
select 'google_ve_su_celular ' || count(*) as r from public.celulares;
-- Otro usuario no ve ese celular.
select set_config('test.uid', '00000000-0000-0000-0000-000000000001', false);
select 'otro_ve_celulares ' || count(*) as r from public.celulares;
-- Un celular con formato inválido se rechaza.
select set_config('test.uid', '00000000-0000-0000-0000-000000000001', false);
do $$ begin
  insert into public.celulares (id, celular) values ('00000000-0000-0000-0000-000000000001', '12345');
  raise notice 'celular_invalido aceptado';
exception when check_violation then
  raise notice 'celular_invalido rechazado';
end $$;
reset role;

select set_config('test.uid', '00000000-0000-0000-0000-00000000000b', false);
select 'google_con_celular ' || (public.publicar_partido('Con celular', null, -33.4560, -70.5970,
  now() + interval '2 hours', 5::smallint, 'recreativo', 1::smallint) is not null) as r;
select 'contacto_google ' || telefono as r from public.contactos_partido(
  (select id from public.partidos where cancha = 'Con celular'));
