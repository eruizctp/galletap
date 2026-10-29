# Galletapp ⚽

Web móvil para completar pichangas (fútbol 5, 6 y 7) a las que les faltan 1 a 3 jugadores el mismo día.
Piloto gratis en Santiago.

## Cómo funciona

- **Organizador:** publica cancha, hora (próximas 24 h), formato, nivel y cuántos faltan. Acepta o rechaza a quienes se apuntan, marca asistencia y califica.
- **Jugador:** entra con su celular (código por SMS), arma un perfil simple (nombre, foto, posición, distancia máxima, zona) y se apunta a partidos cerca.
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
| Base de datos, login por SMS y fotos | Supabase (Postgres) |
| Lógica de negocio | Funciones en la base (`supabase/migrations`) |
| Avisos | Función de Vercel `frontend/api/avisos.ts` + `pg_cron` |
| Errores | Sentry |
| Pruebas | GitHub Actions, obligatorio para unir |

**Ambientes:** `staging` (prueba) y `main` (producción), cada uno con su propio proyecto de Supabase y sus variables en Vercel.
Flujo: rama de trabajo → PR a `staging` → probar → PR `staging → main`. Las migraciones se aplican solas al unir.

Reglas para quien programe: ver [CLAUDE.md](CLAUDE.md).

## Puesta en marcha (una vez)

1. **Supabase:** crea dos proyectos en región São Paulo: `galletapp-staging` y `galletapp`.
   En cada uno: Authentication → Sign In / Providers → Phone, actívalo y conecta un proveedor de SMS (Twilio, Vonage o MessageBird).
   Para probar sin pagar SMS, agrega números de prueba con código fijo en "Test phone numbers".
2. **GitHub:** en Settings → Environments crea `staging` y `produccion`, cada uno con los secretos `SUPABASE_PROJECT_REF` y `SUPABASE_DB_PASSWORD`.
   En Settings → Secrets agrega `SUPABASE_ACCESS_TOKEN`. Luego en Actions → Migraciones → Run workflow, una vez por rama, para crear las tablas.
3. **Reglas de rama:** en Settings → Rules, protege `staging` y `main`: exigir PR y los checks `frontend` y `base-de-datos`.
4. **Vercel:** importa el repo con *Root Directory* `frontend`. Production Branch: `main`.
   Variables (de `frontend/.env.example`): las de producción para *Production* y las de staging para *Preview*.
   Claves de avisos: `npx web-push generate-vapid-keys`.
5. **Avisos periódicos:** en cada proyecto Supabase activa `pg_cron` y `pg_net` y ejecuta:

   ```sql
   select cron.schedule('avisos-galletapp', '*/5 * * * *', $$
     select net.http_post(
       url := 'https://DOMINIO-DEL-AMBIENTE/api/avisos',
       headers := jsonb_build_object('Authorization', 'Bearer CRON_SECRET_DEL_AMBIENTE')
     )
   $$);
   ```

## Desarrollo local

```sh
cd frontend
cp .env.example .env.local   # completar con el proyecto staging
npm install
npm run dev                  # http://localhost:5173
```

Pruebas de la base (necesita un Postgres 16 local vacío y las variables `PG*`):

```sh
./supabase/tests/correr.sh
```

## Fuera de esta versión

Buscar equipo rival y pagos dentro de la app quedan para una segunda etapa.
