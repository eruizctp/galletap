import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import { ESTADOS, mensajeError } from "@/lib/textos";
import { obtenerUbicacion, type Punto } from "@/lib/ubicacion";
import type { EstadoPostulacion, Partido, PartidoCercano } from "@/lib/tipos";
import TarjetaPartido from "@/componentes/TarjetaPartido";
import { Cargando, MensajeError } from "@/componentes/Aviso";
import ActivarAvisos from "@/componentes/ActivarAvisos";
import { despertarAvisos } from "@/lib/despertarAvisos";
import Radar from "@/componentes/Radar";

interface MiPostulacion {
  id: string;
  estado: EstadoPostulacion;
  partido: Partido;
}

export default function Jugar() {
  const navegar = useNavigate();
  const { cargando, uid, perfil } = useSesion();
  const [punto, setPunto] = useState<Punto | null>(null);
  const [partidos, setPartidos] = useState<PartidoCercano[] | null>(null);
  const [mios, setMios] = useState<MiPostulacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && uid && !perfil) navegar("/perfil", { replace: true });
  }, [cargando, uid, perfil, navegar]);

  // Ubicación: la del celular si la da; si no, la guardada en el perfil.
  useEffect(() => {
    if (!perfil) return;
    obtenerUbicacion()
      .then(setPunto)
      .catch(() => {
        if (perfil.lat != null && perfil.lng != null) setPunto({ lat: perfil.lat, lng: perfil.lng });
        else setError("Activa la ubicación o guarda tu zona en el perfil para ver partidos cerca.");
      });
  }, [perfil]);

  const cargar = useCallback(async () => {
    if (!punto || !uid) return;
    const [cercanos, propias] = await Promise.all([
      supabase().rpc("partidos_cercanos", {
        p_lat: punto.lat,
        p_lng: punto.lng,
      }),
      supabase()
        .from("postulaciones")
        .select("id, estado, partido:partidos(*)")
        .eq("jugador_id", uid)
        .in("estado", ["pendiente", "aceptado"])
        .order("creado_en", { ascending: false })
        .limit(10),
    ]);
    if (cercanos.error) setError(mensajeError(cercanos.error));
    else setPartidos(cercanos.data as PartidoCercano[]);
    const hace3h = Date.now() - 3 * 3_600_000;
    setMios(
      ((propias.data ?? []) as unknown as MiPostulacion[]).filter(
        (m) => m.partido && m.partido.estado !== "cancelado" && new Date(m.partido.inicio).getTime() > hace3h,
      ),
    );
  }, [punto, uid]);

  // Se recarga cada minuto: el radio de búsqueda crece con el tiempo.
  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60_000);
    return () => clearInterval(t);
  }, [cargar]);

  async function apuntarme(id: string) {
    if (!punto) return;
    setOcupado(id);
    setError(null);
    const { error } = await supabase().rpc("postular", {
      p_partido: id,
      p_lat: punto.lat,
      p_lng: punto.lng,
    });
    setOcupado(null);
    if (error) setError(mensajeError(error));
    else despertarAvisos();
    await cargar();
  }

  if (cargando || !perfil) return <Cargando />;
  const bloqueado = perfil.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date();
  const disponibles = (partidos ?? []).filter((p) => p.mi_estado == null || p.mi_estado === "retirado");

  return (
    <div className="space-y-8">
      <header className="aparece">
        <p className="sobretitulo">Hola, {perfil.nombre.split(" ")[0]}</p>
        <h1 className="titulo mt-1 text-5xl">
          ¿Jugamos <span className="text-verde">hoy?</span>
        </h1>
      </header>

      <ActivarAvisos />

      {mios.length > 0 && (
        <section className="space-y-3" aria-labelledby="mis-partidos">
          <h2 id="mis-partidos" className="sobretitulo">
            Mis partidos
          </h2>
          <div className="escalonado space-y-3">
            {mios.map((m) => (
              <TarjetaPartido
                key={m.id}
                {...m.partido}
                pie={
                  <p
                    className={`flex items-center gap-2 text-sm font-bold ${m.estado === "aceptado" ? "text-verde" : "text-suave"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${m.estado === "aceptado" ? "bg-verde" : "bg-caramelo"}`}
                      style={{ animation: "pulso-insignia 1.6s infinite" }}
                    />
                    {ESTADOS[m.estado]}
                  </p>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="cerca">
        <h2 id="cerca" className="sobretitulo">
          Cerca tuyo, buscando gente
        </h2>
        {bloqueado ? (
          <p className="tarjeta border-alerta-texto/30 bg-alerta-fondo text-alerta-texto">
            Tu cuenta está bloqueada temporalmente por faltas. Revisa tu{" "}
            <Link to="/perfil" className="font-bold underline">
              perfil
            </Link>
            .
          </p>
        ) : (
          <>
            <MensajeError texto={error} />
            {partidos == null && !error && <Cargando />}
            {partidos != null && disponibles.length === 0 && (
              <div className="tarjeta aparece space-y-5 py-8 text-center">
                <Radar tam={180} />
                <div>
                  <p className="titulo text-2xl">Cancha tranquila por ahora</p>
                  <p className="mt-1 text-sm text-suave">
                    No hay partidos buscando jugadores cerca. Te avisamos apenas aparezca uno.
                  </p>
                </div>
              </div>
            )}
            <div className="escalonado space-y-3">
              {disponibles.map((p) => (
                <TarjetaPartido
                  key={p.id}
                  {...p}
                  nivel={p.nivel}
                  faltan={p.cupos_libres}
                  distanciaKm={p.distancia_km}
                  pie={
                    <button className="btn" disabled={ocupado === p.id} onClick={() => apuntarme(p.id)}>
                      {ocupado === p.id ? "Enviando…" : "Me apunto"}
                    </button>
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
