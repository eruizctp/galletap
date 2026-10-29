-- Prueba de avisos: se ejecuta después de flujo.sql.
\set ON_ERROR_STOP 1
insert into public.suscripciones_push (endpoint, usuario_id, p256dh, auth)
  select 'https://push/' || id, id, 'k', 'a' from public.perfiles;
-- Partido nuevo de "Nueva" (publicado recién, radio 5 km): solo avisa a "Cerca" si no está bloqueado.
update public.perfiles set bloqueado_hasta = null where nombre = 'Cerca 3km';
select clave, (select nombre from public.perfiles where id = usuario_id) as para, titulo, cuerpo
  from public.avisos_por_enviar() order by 1, 2;
insert into public.avisos_enviados select clave, usuario_id from public.avisos_por_enviar();
select count(*) as quedan_tras_enviar from public.avisos_por_enviar();
select (select cupos_libres(p)) as libres, cancha from public.partidos p order by cancha;
