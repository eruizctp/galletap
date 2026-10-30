import { Link } from "react-router";
import { NIVELES, horaPartido } from "@/lib/textos";
import type { Nivel } from "@/lib/tipos";

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

export default function TarjetaPartido({ id, cancha, inicio, formato, nivel, faltan, distanciaKm, pie }: Props) {
  return (
    <div className="tarjeta space-y-2">
      <Link to={`/partido/${id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">{cancha}</p>
            <p className="text-suave">
              {horaPartido(inicio)} · Fútbol {formato}
            </p>
          </div>
          {faltan != null && faltan > 0 && (
            <span className="shrink-0 rounded-full bg-verde px-3 py-1 text-sm font-semibold text-sobre-verde">
              Falta{faltan > 1 ? "n" : ""} {faltan}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip">{NIVELES[nivel]}</span>
          {distanciaKm != null && <span className="chip">a {distanciaKm} km</span>}
        </div>
      </Link>
      {pie}
    </div>
  );
}
