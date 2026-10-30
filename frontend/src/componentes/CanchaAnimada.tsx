import { useEffect, useState } from "react";
import Cupos from "@/componentes/Cupos";

const TOTAL = 3;
const PASO_MS = 1100;

function sinMovimiento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Escena de la portada: la cancha se dibuja, cae la pelota, sale el radar
// y los cupos se van llenando uno a uno (en bucle), que es justo lo que hace la app.
export default function CanchaAnimada() {
  const [llenos, setLlenos] = useState(0);

  useEffect(() => {
    if (sinMovimiento()) {
      setLlenos(TOTAL);
      return;
    }
    const t = setInterval(() => setLlenos((n) => (n >= TOTAL + 1 ? 0 : n + 1)), PASO_MS);
    return () => clearInterval(t);
  }, []);

  const ocupados = Math.min(llenos, TOTAL);
  const completo = ocupados === TOTAL;

  return (
    <div className="relative" aria-hidden>
      {/* Focos del estadio */}
      <div
        className="absolute -left-10 -top-24 h-72 w-40 origin-top bg-gradient-to-b from-verde/30 to-transparent blur-2xl"
        style={{ animation: "foco 6s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-10 -top-24 h-72 w-40 origin-top bg-gradient-to-b from-caramelo/30 to-transparent blur-2xl"
        style={{ animation: "foco 7s ease-in-out 1s infinite reverse" }}
      />

      <div className="relative overflow-hidden rounded-[32px] border border-borde bg-gradient-to-b from-tarjeta-2 to-fondo-2 p-5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
        {/* Cancha en perspectiva */}
        <div className="[perspective:700px]">
          <svg
            viewBox="0 0 300 180"
            className="mx-auto w-full [transform:rotateX(38deg)]"
            fill="none"
            stroke="var(--texto)"
            strokeOpacity="0.55"
            strokeWidth="2"
          >
            {["M10 10h280v160H10z", "M150 10v160", "M10 55h40v70H10M290 55h-40v70h40"].map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                style={{
                  animation: `trazar 1.2s var(--ease-salida) ${200 + i * 250}ms forwards`,
                }}
              />
            ))}
            <circle
              cx="150"
              cy="90"
              r="28"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              style={{
                animation: "trazar 1.2s var(--ease-salida) 700ms forwards",
              }}
            />
            {/* Ondas del radar desde el centro */}
            {[0, 1].map((i) => (
              <circle
                key={i}
                cx="150"
                cy="90"
                r="80"
                stroke="var(--verde)"
                strokeOpacity="0.9"
                style={{
                  transformOrigin: "150px 90px",
                  animation: `radar 2.6s var(--ease-salida) ${1.4 + i * 1.3}s infinite both`,
                }}
              />
            ))}
          </svg>
        </div>

        {/* Pelota-galleta que cae al centro */}
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
          <div className="rebota" style={{ "--retraso": "900ms" } as React.CSSProperties}>
            <div style={{ animation: "flotar 3s ease-in-out 1.8s infinite" }}>
              <img src="/logo.svg" alt="" className="h-16 w-16 drop-shadow-[0_8px_18px_rgba(226,169,92,0.55)]" />
            </div>
          </div>
        </div>

        {/* Marcador de cupos */}
        <div className="relative mt-2 space-y-3 text-center">
          <p className="titulo text-2xl" aria-live="off">
            {completo ? (
              <span className="text-verde">¡Equipo completo!</span>
            ) : (
              <>
                Faltan <span className="text-verde">{TOTAL - ocupados}</span>
              </>
            )}
          </p>
          <Cupos total={TOTAL} ocupados={ocupados} />
        </div>
      </div>
    </div>
  );
}
