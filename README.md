# Galletapp ⚽

Web móvil para completar pichangas (fútbol 5, 6 y 7) a las que les faltan 1 a 3 jugadores el mismo día.
Piloto gratis en Santiago.

## Cómo funciona

- **Organizador:** publica cancha, hora (próximas 24 h), formato, nivel y cuántos faltan. Acepta o rechaza a quienes se apuntan, marca asistencia y califica.
- **Jugador:** entra con su cuenta de Google, deja su celular para coordinar por WhatsApp, arma un perfil simple (nombre, foto, posición, distancia máxima, zona) y se apunta a partidos cerca.
- **Búsqueda que se amplía:** un partido se muestra y se avisa a jugadores a 5 km; a los 15 min, a 10 km; a los 30 min, a 20 km. Nunca más lejos que la distancia máxima del jugador.
- **Confianza:** calificaciones de 1 a 5 entre participantes. Si un confirmado no llega, cuenta como falta y una nota de 1. Con 2 faltas en 90 días queda bloqueado 14 días.
- **Contacto:** organizador y confirmados ven sus teléfonos y se escriben por WhatsApp. El pago se hace directo al organizador.
- **Avisos:** notificaciones en el celular (web push) cuando hay un partido cerca, alguien se apunta, te confirman, alguien se baja o se cancela.

## Estructura

Sigue la misma forma de trabajo que Cierra, con Supabase en lugar de un backend propio:

| Pieza | Qué usa |
|---|---|
| Pantallas | React + Vite + TypeScript + Tailwind (`frontend/`) |
| Hosting | Vercel, con vista previa por PR |
| Base de datos, login con Google y fotos | Supabase (Postgres) |
| Lógica de negocio | Funciones en la base (`supabase/migrations`) |
| Avisos | Función de Vercel `frontend/api/avisos.ts` + `pg_cron` |
| Errores | Sentry |
| Pruebas | GitHub Actions, obligatorio para unir |

**Ambiente:** por ahora uno solo, `main`, con un proyecto de Supabase y Vercel. Un ambiente de prueba separado (`staging`) se suma al lanzar al público.
Flujo: rama de trabajo → PR a `main` (con vista previa de Vercel) → unir. Las migraciones se aplican solas al unir.

Reglas para quien programe: ver [CLAUDE.md](CLAUDE.md).

## Puesta en marcha (una vez)

1. **Supabase:** crea un proyecto `galletapp` en región São Paulo.
   **Login con Google:** en Google Cloud Console → APIs y servicios crea la pantalla de consentimiento (externa) y un
   *ID de cliente OAuth* tipo "Aplicación web" con origen `https://galletapp.vercel.app` y URI de redirección
   `https://<ref>.supabase.co/auth/v1/callback`. Pega el Client ID y el Secret en Supabase → Authentication →
   Sign In / Providers → Google. En Authentication → URL Configuration agrega como Redirect URLs
   `https://galletapp.vercel.app/ingresar` y `https://galletapp-*-eruiz-6997s-projects.vercel.app/**` (vistas previas).
2. **GitHub:** en Settings → Secrets and variables → Actions agrega `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` y `SUPABASE_ACCESS_TOKEN`.
   Luego en Actions → Migraciones → Run workflow para crear las tablas.
3. **Reglas de rama:** en Settings → Rules, protege `main`: exigir PR y los checks `frontend` y `base-de-datos`.
4. **Vercel:** importa el repo con *Root Directory* `frontend`. Production Branch: `main`.
   Variables (de `frontend/.env.example`) para *Production* y *Preview*.
   Claves de avisos: `npx web-push generate-vapid-keys`.
5. **Avisos periódicos:** en el proyecto Supabase activa `pg_cron` y `pg_net` y ejecuta:

   ```sql
   select cron.schedule('avisos-galletapp', '*/5 * * * *', $$
     select net.http_post(
       url := 'https://DOMINIO-DE-LA-APP/api/avisos',
       headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET')
     )
   $$);
   ```

## Desarrollo local

```sh
cd frontend
cp .env.example .env.local   # completar con el proyecto de Supabase
npm install
npm run dev                  # http://localhost:5173
```

Pruebas de la base (necesita un Postgres 16 local vacío y las variables `PG*`):

```sh
./supabase/tests/correr.sh
```

## Fuera de esta versión

Buscar equipo rival y pagos dentro de la app quedan para una segunda etapa.
