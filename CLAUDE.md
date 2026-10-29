# Galletapp — manual para agentes

Web móvil para completar pichangas (fútbol 5, 6 y 7) a las que les faltan 1 a 3 jugadores el mismo día. Piloto gratis en Santiago. Usuario principal: el organizador. Se escribe en español (Chile), en código, commits, PRs y textos de la app.

## Estructura (igual a Cierra, con Supabase en vez de backend propio)

```
.github/workflows/   ci.yml (obligatorio) · migraciones.yml (aplica migraciones por ambiente)
frontend/            React + Vite + TypeScript + Tailwind, publicado en Vercel
  src/paginas/       una pantalla por archivo
  src/componentes/   piezas reutilizables
  src/lib/           cliente Supabase, tipos, textos, ubicación
  api/avisos.ts      función de Vercel que envía los avisos web push
  vercel.json        rutas y cabeceras de seguridad (CSP)
supabase/
  migrations/        cambios de base versionados (Supabase CLI), en orden de fecha
  tests/             pruebas de reglas sobre Postgres (correr.sh)
  config.toml        configuración local de Supabase CLI
```

## Ambientes y ramas

- `staging` → ambiente de prueba (proyecto Supabase "galletapp-staging", Vercel preview de staging).
- `main` → producción (proyecto Supabase "galletapp", dominio principal en Vercel).
- Flujo: rama de trabajo → PR a `staging` → probar → PR `staging → main`.
- Nunca se trabaja directo en `staging` ni `main`.

## Reglas

- **La lógica de negocio vive en la base**, como funciones RPC `security definer` en `supabase/migrations`. El frontend solo las llama. Nada de reglas solo en el frontend.
- **Cambios de base solo con una migración nueva** (`supabase migration new <nombre>`), nunca editando una migración ya unida ni a mano en el panel. `migraciones.yml` las aplica sola al unir a `staging` o `main`.
- Toda regla nueva va con su prueba en `supabase/tests/flujo.sql` (o un archivo nuevo) y su verificación en `correr.sh`.
- Las tablas tienen RLS activo. Los teléfonos solo se entregan entre organizador y confirmados (`contactos_partido`).
- Variables `VITE_*` son públicas (van al navegador). Las claves secretas (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`) solo en Vercel, sin prefijo.
- Antes de abrir un PR: `cd frontend && npm run typecheck && npm run lint && npm run build`, y `supabase/tests/correr.sh` con un Postgres local.

## Reglas del producto (decididas con Eduardo, 2026-10-29)

- Partidos solo dentro de las próximas 24 h; 1 a 3 cupos; nivel recreativo / intermedio / competitivo.
- Radio de búsqueda: 5 km los primeros 15 min, 10 km hasta los 30 min, luego 20 km; nunca más que la distancia máxima del jugador (1–20 km).
- Organizador acepta o rechaza; al llenarse los cupos el partido queda completo.
- No llegar = falta + nota 1. Dos faltas en 90 días = bloqueo de 14 días.
- Sin pagos en la app. Fuera de esta etapa: buscar equipo rival y pagos.

## Trampas conocidas

- Supabase no manda SMS reales sin un proveedor (Twilio, Vonage, MessageBird). Para probar, usar los números de prueba (`auth.sms.test_otp` en config.toml y en el panel).
- En iPhone los avisos web push solo funcionan si la app se agregó a la pantalla de inicio.
- El cron de avisos (`pg_cron` + `pg_net` llamando a `/api/avisos`) se configura una vez por proyecto Supabase; ver README.
