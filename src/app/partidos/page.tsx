"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import { ESTADOS, mensajeError } from "@/lib/textos";
import { obtenerUbicacion, type Punto } from "@/lib/ubicacion";
import type { EstadoPostulacion, Partido, PartidoCercano } from "@/lib/tipos";
import TarjetaPartido from "@/components/TarjetaPartido";
import { Cargando, MensajeError } from "@/components/Aviso";
import ActivarAvisos from "@/components/ActivarAvisos";
import { despertarAvisos } from "@/lib/despertarAvisos";

interface MiPostulacion {
  id: string;
  estado: EstadoPostulacion;
  partido: Partido;
}

export default function Jugar() {
  const router = useRouter();
  const { cargando, uid, perfil } = useSesion();
  const [punto, setPunto] = useState<Punto | null>(null);
  const [partidos, setPartidos] = useState<PartidoCercano[] | null>(null);
  const [mios, setMios] = useState<MiPostulacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && uid && !perfil) router.replace("/perfil");
  }, [cargando, uid, perfil, router]);

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
      supabase().rpc("partidos_cercanos", { p_lat: punto.lat, p_lng: punto.lng }),
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
    const { error } = await supabase().rpc("postular", { p_partido: id, p_lat: punto.lat, p_lng: punto.lng });
    setOcupado(null);
    if (error) setError(mensajeError(error));
    else despertarAvisos();
    await cargar();
  }

  if (cargando || !perfil) return <Cargando />;
  const bloqueado = perfil.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date();
  const disponibles = (partidos ?? []).filter((p) => p.mi_estado == null || p.mi_estado === "retirado");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hola, {perfil.nombre.split(" ")[0]} 👋</h1>

      <ActivarAvisos />

      {mios.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-suave">Mis partidos</h2>
          {mios.map((m) => (
            <TarjetaPartido
              key={m.id}
              {...m.partido}
              pie={<p className={m.estado === "aceptado" ? "font-semibold text-verde" : "text-suave"}>{ESTADOS[m.estado]}</p>}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-suave">Partidos cerca que necesitan gente</h2>
        {bloqueado ? (
          <p className="tarjeta text-suave">
            Tu cuenta está bloqueada temporalmente por faltas. Revisa tu <Link href="/perfil" className="underline">perfil</Link>.
          </p>
        ) : (
          <>
            <MensajeError texto={error} />
            {partidos == null && !error && <Cargando />}
            {partidos != null && disponibles.length === 0 && (
              <p className="tarjeta text-suave">
                No hay partidos buscando jugadores cerca de ti ahora. Te avisaremos cuando aparezca uno.
              </p>
            )}
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
          </>
        )}
      </section>
    </div>
  );
}
