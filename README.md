# Galletapp ⚽

Web móvil para completar pichangas (fútbol 5, 6 y 7) a las que les faltan 1 a 3 jugadores el mismo día.
Piloto gratis en Santiago.

## Cómo funciona

- **Organizador:** publica cancha, hora (próximas 24 h), formato, nivel y cuántos faltan. Acepta o rechaza a quienes se apuntan, marca asistencia y califica.
- **Jugador:** entra con su celular (código por SMS), arma un perfil simple (nombre, foto, posición, distancia máxima, zona) y se apunta a partidos cerca.
- **Búsqueda que se amplía:** un partido se muestra y se avisa a jugadores a 5 km; a los 15 min, a 10 km; a los 30 min, a 20 km. Nunca más lejos que la distancia máxima del jugador.
- **Confianza:** calificaciones de 1 a 5 entre participantes. Si un jugador confirmado no llega, cuenta como falta y una nota de 1. Con 2 faltas en 90 días queda bloqueado 14 días.
- **Contacto:** organizador y confirmados ven sus teléfonos y se escriben por WhatsApp. El pago se hace directo al organizador.
- **Avisos:** notificaciones en el celular (web push) cuando hay un partido cerca, alguien se apunta, te confirman, alguien se baja o se cancela.

## Tecnología

- [Next.js](https://nextjs.org) (App Router) + Tailwind, en Vercel.
- [Supabase](https://supabase.com): Postgres, login por SMS, almacenamiento de fotos.
- Las reglas del negocio viven en la base de datos (`supabase/migrations`), como funciones que llama la app.

## Puesta en marcha

1. **Supabase:** crea un proyecto (región São Paulo) y ejecuta en el SQL Editor, en orden,
   `supabase/migrations/0001_inicio.sql` y `supabase/migrations/0002_avisos.sql`.
2. **Login por SMS:** en Authentication → Sign In / Providers → Phone, actívalo y conecta un proveedor de SMS (Twilio, Vonage o MessageBird).
   Para probar sin pagar SMS, agrega números de prueba con un código fijo en "Test phone numbers".
3. **Claves de avisos:** `npx web-push generate-vapid-keys`.
4. **Variables:** copia `.env.example` a `.env.local` y complétalo. Las mismas van en Vercel → Settings → Environment Variables.
5. **Local:** `npm install` y `npm run dev`, luego abre http://localhost:3000.
6. **Avisos periódicos:** en Supabase activa las extensiones `pg_cron` y `pg_net` y ejecuta:

   ```sql
   select cron.schedule('avisos-galletapp', '*/5 * * * *', $$
     select net.http_post(
       url := 'https://TU-APP.vercel.app/api/avisos',
       headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET')
     )
   $$);
   ```

## Pruebas de la base de datos

Las reglas (radio, cupos, faltas, bloqueo, calificaciones, avisos) se prueban en un Postgres local que imita lo mínimo de Supabase:

```sh
createdb galletapp_test
psql -d galletapp_test -v ON_ERROR_STOP=1 \
  -f supabase/tests/stub_supabase.sql \
  -f supabase/migrations/0001_inicio.sql -f supabase/migrations/0002_avisos.sql \
  -f supabase/tests/flujo.sql -f supabase/tests/avisos.sql
```

## Fuera de esta versión

Buscar equipo rival y pagos dentro de la app quedan para una segunda etapa.
