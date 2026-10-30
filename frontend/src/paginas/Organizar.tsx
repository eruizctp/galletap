import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import type { Partido } from "@/lib/tipos";
import TarjetaPartido from "@/componentes/TarjetaPartido";
import { Cargando } from "@/componentes/Aviso";
import ActivarAvisos from "@/componentes/ActivarAvisos";

type ConPostulaciones = Partido & { postulaciones: { estado: string }[] };

export default function Organizar() {
  const navegar = useNavigate();
  const { cargando, uid, perfil } = useSesion();
  const [partidos, setPartidos] = useState<ConPostulaciones[] | null>(null);

  useEffect(() => {
    if (!cargando && uid && !perfil) navegar("/perfil", { replace: true });
  }, [cargando, uid, perfil, navegar]);

  useEffect(() => {
    if (!uid) return;
    supabase()
      .from("partidos")
      .select("*, postulaciones(estado)")
      .eq("organizador_id", uid)
      .order("inicio", { ascending: false })
      .limit(20)
      .then(({ data }) => setPartidos((data ?? []) as ConPostulaciones[]));
  }, [uid]);

  if (cargando || partidos == null) return <Cargando />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organizar</h1>
      <ActivarAvisos />
      <Link to="/organizar/nuevo" className="btn text-lg">
        ➕ Me faltan jugadores
      </Link>
      <section className="space-y-3">
        <h2 className="font-semibold text-suave">Mis partidos</h2>
        {partidos.length === 0 && <p className="tarjeta text-suave">Aún no publicas partidos.</p>}
        {partidos.map((p) => {
          const pendientes = p.postulaciones.filter((a) => a.estado === "pendiente").length;
          const aceptados = p.postulaciones.filter((a) => a.estado === "aceptado").length;
          return (
            <TarjetaPartido
              key={p.id}
              {...p}
              faltan={p.estado === "abierto" ? p.cupos - aceptados : 0}
              pie={
                <p className="text-sm text-suave">
                  {p.estado === "cancelado"
                    ? "Cancelado"
                    : `${aceptados} confirmado${aceptados === 1 ? "" : "s"}${pendientes ? ` · ${pendientes} por responder 🔔` : ""}`}
                </p>
              }
            />
          );
        })}
      </section>
    </div>
  );
}
