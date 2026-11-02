// Radar de búsqueda: anillos que se expanden desde la cancha.
// Muestra los tres radios (5, 10 y 20 km) y resalta el que está activo.
const RADIOS = [5, 10, 20] as const;
const ESCALAS = [0.45, 0.72, 1];

export default function Radar({ km, tam = 220 }: { km?: number; tam?: number }) {
  const conEtiquetas = tam >= 140;
  const logo = Math.round(tam * 0.18);
  return (
    <div className="relative mx-auto shrink-0" style={{ width: tam, height: tam }} aria-hidden>
      {/* Anillos fijos de cada radio */}
      {RADIOS.map((r, i) => {
        const escala = ESCALAS[i];
        const activo = km === r;
        return (
          <div
            key={r}
            className={`absolute inset-0 m-auto rounded-full border ${activo ? "border-verde" : "border-borde-control/60"}`}
            style={{ width: `${escala * 100}%`, height: `${escala * 100}%` }}
          >
            {conEtiquetas && (
              <span
                className={`absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full px-1.5 text-[10px] font-bold ${activo ? "bg-verde text-sobre-verde" : "bg-fondo text-suave"}`}
              >
                {r} km
              </span>
            )}
          </div>
        );
      })}
      {/* Ondas que salen */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-verde"
          style={{ animation: `radar 3s var(--ease-salida) ${i}s infinite` }}
        />
      ))}
      {/* Barrido */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, rgb(184 245 61 / 0.28), transparent 25%)",
          animation: "girar 4s linear infinite",
          maskImage: "radial-gradient(circle, black 60%, transparent 71%)",
        }}
      />
      {/* La cancha al centro */}
      <img
        src="/logo.svg"
        alt=""
        className="absolute inset-0 m-auto drop-shadow-[0_0_14px_rgba(226,169,92,0.6)]"
        style={{ width: logo, height: logo }}
      />
    </div>
  );
}
