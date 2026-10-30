export function Cargando() {
  return <p className="py-10 text-center text-suave">Cargando…</p>;
}

export function MensajeError({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return <p className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">{texto}</p>;
}
