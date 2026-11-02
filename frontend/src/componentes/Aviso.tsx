export function Cargando() {
  return (
    <div className="flex flex-col items-center gap-3 py-16" role="status">
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-x-0 top-0 mx-auto h-12 w-12"
          style={{ animation: "flotar 900ms ease-in-out infinite" }}
        >
          <img src="/logo.svg" alt="" className="h-12 w-12" style={{ animation: "girar 1.8s linear infinite" }} />
        </div>
        <div className="absolute bottom-0 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/50 blur-[2px]" />
      </div>
      <p className="sobretitulo">Calentando…</p>
    </div>
  );
}

export function MensajeError({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p
      role="alert"
      className="aparece rounded-2xl border border-peligro/30 bg-error-fondo px-4 py-3 text-sm text-error-texto"
    >
      {texto}
    </p>
  );
}

// Explosión de confeti en colores de la marca. Se dibuja una vez al montar.
const COLORES = ["var(--verde)", "var(--caramelo)", "var(--texto)", "var(--estrella)"];
const PIEZAS = 22;

export function Confeti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: PIEZAS }, (_, i) => {
        const angulo = (i / PIEZAS) * Math.PI * 2;
        const dist = 90 + (i % 4) * 28;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-sm"
            style={
              {
                background: COLORES[i % COLORES.length],
                "--dx": `${Math.round(Math.cos(angulo) * dist)}px`,
                "--dy": `${Math.round(Math.sin(angulo) * dist)}px`,
                "--rot": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animation: `confeti 1.1s var(--ease-salida) ${(i % 5) * 30}ms both`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
