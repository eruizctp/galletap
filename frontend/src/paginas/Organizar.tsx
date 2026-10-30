import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import type { Partido } from "@/lib/tipos";
import TarjetaPartido from "@/componentes/TarjetaPartido";
import { Cargando } from "@/componentes/Aviso";
import ActivarAvisos from "@/componentes/ActivarAvisos";
import { IconoCampana, IconoMas } from "@/componentes/Iconos";

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
    <div className="space-y-8">
      <header className="aparece">
        <p className="sobretitulo">Organizar</p>
        <h1 className="titulo mt-1 text-5xl">
          Arma tu <span className="text-verde">equipo</span>
        </h1>
      </header>

      <Link
        to="/organizar/nuevo"
        className="aparece group relative block overflow-hidden rounded-[32px] bg-verde p-6 text-sobre-verde shadow-[0_24px_60px_-20px_var(--brillo)] transition-transform duration-300 active:scale-[0.98]"
        style={{ "--retraso": "100ms" } as React.CSSProperties}
      >
        <img
          src="/logo.svg"
          alt=""
          className="absolute -right-6 -top-6 h-36 w-36 opacity-90 transition-transform duration-700 group-hover:rotate-45"
          style={{ animation: "flotar 4s ease-in-out infinite" }}
        />
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] opacity-70">Nuevo partido</p>
        <p className="titulo mt-2 max-w-[11ch] text-4xl">Me faltan jugadores</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-sobre-verde px-4 py-2 text-sm font-extrabold text-verde">
          <IconoMas className="h-4 w-4" />
          Publicar
        </span>
      </Link>

      <ActivarAvisos />

      <section className="space-y-3" aria-labelledby="mis-publicados">
        <h2 id="mis-publicados" className="sobretitulo">
          Mis partidos
        </h2>
        {partidos.length === 0 && (
          <p className="tarjeta text-center text-suave">Aún no publicas partidos. El primero se arma en 20 segundos.</p>
        )}
        <div className="escalonado space-y-3">
          {partidos.map((p) => {
            const pendientes = p.postulaciones.filter((a) => a.estado === "pendiente").length;
            const aceptados = p.postulaciones.filter((a) => a.estado === "aceptado").length;
            return (
              <TarjetaPartido
                key={p.id}
                {...p}
                faltan={p.estado === "abierto" ? p.cupos - aceptados : 0}
                pie={
                  p.estado === "cancelado" ? (
                    <p className="text-sm font-bold text-peligro">Cancelado</p>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-suave">
                        <strong className="text-texto">{aceptados}</strong> confirmado{aceptados === 1 ? "" : "s"}
                      </span>
                      {pendientes > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-caramelo/15 px-2.5 py-1 font-bold text-caramelo">
                          <IconoCampana
                            className="h-4 w-4"
                            style={{
                              animation: "flotar 1.2s ease-in-out infinite",
                            }}
                          />
                          {pendientes} por responder
                        </span>
                      )}
                    </div>
                  )
                }
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
