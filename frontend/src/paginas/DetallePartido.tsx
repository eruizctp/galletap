import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import { ESTADOS, NIVELES, POSICIONES, enlaceWhatsapp, estrellas, horaPartido, mensajeError } from "@/lib/textos";
import { obtenerUbicacion } from "@/lib/ubicacion";
import { despertarAvisos } from "@/lib/despertarAvisos";
import type { Contacto, Partido, Perfil, Postulacion } from "@/lib/tipos";
import Avatar from "@/componentes/Avatar";
import Estrellas from "@/componentes/Estrellas";
import { Cargando, MensajeError } from "@/componentes/Aviso";

type PartidoConOrganizador = Partido & { organizador: Perfil; cupos_libres: number };
type PostulacionConJugador = Postulacion & { jugador: Perfil };

function radioActual(creado: string, ahora: number) {
  const min = (ahora - new Date(creado).getTime()) / 60_000;
  return min < 15 ? 5 : min < 30 ? 10 : 20;
}

export default function DetallePartido() {
  const { id } = useParams() as { id: string };
  const { cargando, uid } = useSesion();
  const [partido, setPartido] = useState<PartidoConOrganizador | null>(null);
  const [postulaciones, setPostulaciones] = useState<PostulacionConJugador[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [misNotas, setMisNotas] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const [ahora, setAhora] = useState(0);

  const cargar = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase()
      .from("partidos")
      .select("*, cupos_libres, organizador:perfiles(*)")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      setNoExiste(true);
      return;
    }
    setAhora(Date.now());
    setPartido(data as PartidoConOrganizador);
    const [pos, con, cal] = await Promise.all([
      supabase()
        .from("postulaciones")
        .select("*, jugador:perfiles(*)")
        .eq("partido_id", id)
        .order("creado_en"),
      supabase().rpc("contactos_partido", { p_partido: id }),
      supabase().from("calificaciones").select("calificado_id, puntaje").eq("partido_id", id).eq("autor_id", uid),
    ]);
    setPostulaciones((pos.data ?? []) as PostulacionConJugador[]);
    setContactos(con.error ? [] : (con.data as Contacto[]));
    setMisNotas(Object.fromEntries((cal.data ?? []).map((c) => [c.calificado_id, c.puntaje])));
  }, [id, uid]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30_000);
    return () => clearInterval(t);
  }, [cargar]);

  async function accion(fn: string, args: Record<string, unknown>) {
    setError(null);
    const { error } = await supabase().rpc(fn, args);
    if (error) setError(mensajeError(error));
    else despertarAvisos();
    await cargar();
  }

  async function apuntarme() {
    try {
      const p = await obtenerUbicacion();
      await accion("postular", { p_partido: id, p_lat: p.lat, p_lng: p.lng });
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function compartir() {
    const texto = `Nos falta${partido!.cupos > 1 ? "n" : ""} ${partido!.cupos} para fútbol ${partido!.formato} ${horaPartido(partido!.inicio)} en ${partido!.cancha}. Apúntate en Galletapp:`;
    const url = window.location.href;
    if (navigator.share) await navigator.share({ text: texto, url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`);
  }

  if (noExiste) return <p className="py-10 text-center text-suave">Este partido no existe.</p>;
  if (cargando || !partido) return <Cargando />;

  const soyOrganizador = partido.organizador_id === uid;
  const mia = postulaciones.find((p) => p.jugador_id === uid);
  const yaEmpezo = new Date(partido.inicio).getTime() <= ahora;
  const aceptados = postulaciones.filter((p) => p.estado === "aceptado");
  const pendientes = postulaciones.filter((p) => p.estado === "pendiente");
  const libres = partido.cupos_libres;
  const participo = soyOrganizador || mia?.estado === "aceptado";
  const puedeCalificar =
    participo && yaEmpezo && ahora - new Date(partido.inicio).getTime() < 3 * 86_400_000;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{partido.cancha}</h1>
        <p className="text-lg text-suave">
          {horaPartido(partido.inicio)} · Fútbol {partido.formato} · {NIVELES[partido.nivel]}
        </p>
        {partido.direccion && (
          <a
            className="mt-1 block text-sm text-verde underline"
            href={`https://www.google.com/maps/search/?api=1&query=${partido.lat},${partido.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            📍 {partido.direccion}
          </a>
        )}
        {partido.notas && <p className="tarjeta mt-3">{partido.notas}</p>}
      </div>

      <div className="tarjeta flex items-center gap-3">
        <Avatar nombre={partido.organizador.nombre} foto={partido.organizador.foto_url} />
        <div>
          <p className="font-semibold">{partido.organizador.nombre}</p>
          <p className="text-sm text-suave">Organiza · {estrellas(partido.organizador.calificacion_promedio)}</p>
        </div>
      </div>

      <div className="tarjeta text-center">
        {partido.estado === "cancelado" ? (
          <p className="font-semibold text-peligro">Partido cancelado</p>
        ) : libres > 0 ? (
          <>
            <p className="text-xl font-bold">
              Falta{libres > 1 ? "n" : ""} {libres} de {partido.cupos}
            </p>
            {soyOrganizador && !yaEmpezo && (
              <p className="text-sm text-suave">Buscando jugadores a {radioActual(partido.creado_en, ahora)} km de la cancha</p>
            )}
          </>
        ) : (
          <p className="text-xl font-bold text-verde">¡Equipo completo! ✅</p>
        )}
      </div>

      <MensajeError texto={error} />

      {/* Vista del jugador */}
      {!soyOrganizador && partido.estado !== "cancelado" && (
        <div className="space-y-2">
          {mia && mia.estado !== "retirado" ? (
            <>
              <p className={`text-center font-semibold ${mia.estado === "aceptado" ? "text-verde" : "text-suave"}`}>
                {ESTADOS[mia.estado]}
              </p>
              {!yaEmpezo && (mia.estado === "pendiente" || mia.estado === "aceptado") && (
                <button className="btn-sec" onClick={() => accion("retirarse", { p_partido: id })}>
                  {mia.estado === "aceptado" ? "No puedo ir (avisar)" : "Retirar postulación"}
                </button>
              )}
            </>
          ) : (
            !yaEmpezo &&
            libres > 0 && (
              <button className="btn text-lg" onClick={apuntarme}>
                Me apunto
              </button>
            )
          )}
        </div>
      )}

      {/* Vista del organizador: postulaciones por responder */}
      {soyOrganizador && !yaEmpezo && partido.estado !== "cancelado" && (
        <>
          <button className="btn-sec" onClick={compartir}>
            📣 Compartir en WhatsApp
          </button>
          <section className="space-y-3">
            <h2 className="font-semibold text-suave">Quieren jugar ({pendientes.length})</h2>
            {pendientes.length === 0 && <p className="text-sm text-suave">Aún nadie. Te avisaremos cuando alguien se apunte.</p>}
            {pendientes.map((p) => (
              <div key={p.id} className="tarjeta space-y-3">
                <FilaJugador jugador={p.jugador} />
                <div className="flex gap-2">
                  <button
                    className="btn-chico flex-1 bg-verde text-sobre-verde"
                    disabled={libres <= 0}
                    onClick={() => accion("responder_postulacion", { p_postulacion: p.id, p_aceptar: true })}
                  >
                    Aceptar
                  </button>
                  <button
                    className="btn-chico flex-1 border border-borde-control"
                    onClick={() => accion("responder_postulacion", { p_postulacion: p.id, p_aceptar: false })}
                  >
                    No esta vez
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* Confirmados: contacto, asistencia y calificación */}
      {participo && contactos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-suave">Confirmados</h2>
          {contactos
            .filter((c) => c.jugador_id !== uid)
            .map((c) => {
              const post = aceptados.find((a) => a.jugador_id === c.jugador_id);
              const perfil = c.rol === "organizador" ? partido.organizador : post?.jugador;
              return (
                <div key={c.jugador_id} className="tarjeta space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {perfil ? <FilaJugador jugador={perfil} rol={c.rol} /> : <p>{c.nombre}</p>}
                    {c.telefono && !yaEmpezo && (
                      <a
                        className="btn-chico shrink-0 bg-verde text-sobre-verde"
                        href={enlaceWhatsapp(c.telefono, `Hola ${c.nombre}, te escribo por el partido en ${partido.cancha}`)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                  {soyOrganizador && yaEmpezo && post && (
                    <div className="flex gap-2">
                      <button
                        className={`btn-chico flex-1 border ${post.asistio === true ? "border-verde bg-verde text-sobre-verde" : "border-borde-control"}`}
                        onClick={() => accion("marcar_asistencia", { p_postulacion: post.id, p_asistio: true })}
                      >
                        Llegó
                      </button>
                      <button
                        className={`btn-chico flex-1 border ${post.asistio === false ? "border-peligro bg-peligro text-tarjeta" : "border-borde-control"}`}
                        onClick={() => accion("marcar_asistencia", { p_postulacion: post.id, p_asistio: false })}
                      >
                        No llegó
                      </button>
                    </div>
                  )}
                  {puedeCalificar && post?.asistio !== false && (
                    <Estrellas
                      valor={misNotas[c.jugador_id] ?? 0}
                      onChange={(n) =>
                        accion("calificar", { p_partido: id, p_calificado: c.jugador_id, p_puntaje: n })
                      }
                    />
                  )}
                </div>
              );
            })}
        </section>
      )}

      {soyOrganizador && !yaEmpezo && partido.estado !== "cancelado" && (
        <button
          className="btn-chico w-full text-peligro"
          onClick={() => confirm("¿Cancelar el partido? Se avisará a los confirmados.") && accion("cancelar_partido", { p_partido: id })}
        >
          Cancelar partido
        </button>
      )}
    </div>
  );
}

function FilaJugador({ jugador, rol }: { jugador: Perfil; rol?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar nombre={jugador.nombre} foto={jugador.foto_url} />
      <div>
        <p className="font-semibold">
          {jugador.nombre}
          {rol === "organizador" && <span className="chip ml-2">Organiza</span>}
        </p>
        <p className="text-sm text-suave">
          {POSICIONES[jugador.posicion]} · {estrellas(jugador.calificacion_promedio)}
          {jugador.faltas > 0 && ` · ${jugador.faltas} falta${jugador.faltas > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}
