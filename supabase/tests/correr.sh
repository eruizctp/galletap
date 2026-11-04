#!/usr/bin/env bash
# Aplica todas las migraciones sobre un Postgres vacío que imita Supabase y
# corre las pruebas de reglas. Usa las variables PG* estándar (PGHOST, PGUSER…).
set -euo pipefail
cd "$(dirname "$0")/../.."

archivos=(-f supabase/tests/stub_supabase.sql)
for m in supabase/migrations/*.sql; do archivos+=(-f "$m"); done
archivos+=(-f supabase/tests/flujo.sql -f supabase/tests/avisos.sql -f supabase/tests/google.sql)

salida=$(psql -v ON_ERROR_STOP=1 -q "${archivos[@]}" 2>&1)
echo "$salida"

revisar() {
  if ! grep -qE "$1" <<<"$salida"; then
    echo "FALLÓ: se esperaba /$1/"
    exit 1
  fi
}
revisar "t0 +\| Cerca 3km; $"
revisar "t20 +\| Cerca 3km; Medio 8km; $"
revisar "t40 +\| Cerca 3km; Medio 8km; $"
revisar "estado_tras_aceptar +\| completo"
revisar "estado_tras_retiro +\| abierto"
revisar "faltas_1 +\| 1 bloq=false"
revisar "faltas_2 +\| 2 bloq=true prom=1.00"
revisar "bloqueado_ve +\| 0"
revisar "quedan_tras_enviar"
revisar "google_sin_celular Agrega tu celular"
revisar "google_ve_su_celular 1"
revisar "otro_ve_celulares 0"
revisar "celular_invalido rechazado"
revisar "google_con_celular true"
revisar "contacto_google \\+56955555555"
echo "Todas las pruebas de la base pasaron ✓"
