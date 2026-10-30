import { Link } from "react-router";
import { NIVELES, horaPartido } from "@/lib/textos";
import type { Nivel } from "@/lib/tipos";
import { IconoPin } from "@/componentes/Iconos";

interface Props {
  id: string;
  cancha: string;
  inicio: string;
  formato: number;
  nivel: Nivel;
  faltan?: number;
  distanciaKm?: number;
  pie?: React.ReactNode;
}

// "hoy 21:00" → { dia: "hoy", hora: "21:00" }
function separarHora(iso: string) {
  const partes = horaPartido(iso).split(" ");
  const hora = partes.pop() ?? "";
  return { dia: partes.join(" "), hora };
}

export default function TarjetaPartido({ id, cancha, inicio, formato, nivel, faltan, distanciaKm, pie }: Props) {
  const { dia, hora } = separarHora(inicio);
  return (
    <article className="tarjeta tarjeta-viva space-y-4 overflow-hidden">
      {/* Franja de color a la izquierda: verde si busca gente */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${faltan ? "bg-verde shadow-[0_0_16px_var(--brillo)]" : "bg-borde-control"}`}
      />
      <Link to={`/partido/${id}`} className="flex items-stretch gap-4">
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-borde bg-fondo-2 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-suave">{dia}</span>
          <span className="titulo text-3xl">{hora}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="titulo truncate text-2xl">{cancha}</p>
            {faltan != null && faltan > 0 && (
              <span className="insignia-faltan">
                Falta{faltan > 1 ? "n" : ""} {faltan}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip">Fútbol {formato}</span>
            <span className="chip">{NIVELES[nivel]}</span>
            {distanciaKm != null && (
              <span className="chip text-texto">
                <IconoPin className="h-3.5 w-3.5 text-verde" />a {distanciaKm} km
              </span>
            )}
          </div>
        </div>
      </Link>
      {pie}
    </article>
  );
}
