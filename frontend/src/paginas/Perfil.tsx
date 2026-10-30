import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { useSesion } from "@/lib/useSesion";
import { POSICIONES, estrellas, mensajeError } from "@/lib/textos";
import { obtenerUbicacion } from "@/lib/ubicacion";
import type { Posicion } from "@/lib/tipos";
import Avatar from "@/componentes/Avatar";
import { Cargando, MensajeError } from "@/componentes/Aviso";
import { IconoCheck, IconoPin } from "@/componentes/Iconos";

export default function PaginaPerfil() {
  const navegar = useNavigate();
  const { cargando, uid, perfil } = useSesion();
  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState<Posicion>("cualquiera");
  const [distancia, setDistancia] = useState(10);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre);
    setPosicion(perfil.posicion);
    setDistancia(perfil.distancia_max_km);
    setFoto(perfil.foto_url);
    if (perfil.lat != null && perfil.lng != null) setPunto({ lat: perfil.lat, lng: perfil.lng });
  }, [perfil]);

  if (cargando) return <Cargando />;
  if (!uid) return null;

  async function subirFoto(archivo: File) {
    setError(null);
    const ruta = `${uid}/foto`;
    const { error } = await supabase().storage.from("fotos").upload(ruta, archivo, {
      upsert: true,
      contentType: archivo.type,
    });
    if (error) {
      setError(mensajeError(error));
      return;
    }
    const { data } = supabase().storage.from("fotos").getPublicUrl(ruta);
    setFoto(`${data.publicUrl}?v=${Date.now()}`);
  }

  async function usarUbicacion() {
    setError(null);
    try {
      setPunto(await obtenerUbicacion());
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardado(false);
    if (nombre.trim().length < 2) {
      setError("Escribe tu nombre");
      return;
    }
    setGuardando(true);
    const { error } = await supabase()
      .from("perfiles")
      .upsert({
        id: uid,
        nombre: nombre.trim(),
        posicion,
        distancia_max_km: distancia,
        foto_url: foto,
        lat: punto?.lat ?? null,
        lng: punto?.lng ?? null,
      });
    setGuardando(false);
    if (error) {
      setError(mensajeError(error));
      return;
    }
    if (!perfil) navegar("/partidos", { replace: true });
    else setGuardado(true);
  }

  async function salir() {
    await supabase().auth.signOut();
    navegar("/", { replace: true });
  }

  const bloqueado = perfil?.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date();

  return (
    <form onSubmit={guardar} className="space-y-7">
      <header className="aparece">
        <p className="sobretitulo">{perfil ? "Tu ficha" : "Último paso"}</p>
        <h1 className="titulo mt-1 text-5xl">
          {perfil ? (
            <>
              Mi <span className="text-verde">perfil</span>
            </>
          ) : (
            <>
              Crea tu <span className="text-verde">ficha</span>
            </>
          )}
        </h1>
      </header>

      {perfil && (
        <div className="escalonado grid grid-cols-2 gap-3">
          <div className="tarjeta text-center">
            <p className="titulo text-4xl text-estrella">{estrellas(perfil.calificacion_promedio)}</p>
            <p className="mt-1 text-xs text-suave">{perfil.calificaciones_total} calificaciones</p>
          </div>
          <div className="tarjeta text-center">
            <p className={`titulo text-4xl ${perfil.faltas > 0 ? "text-peligro" : "text-verde"}`}>{perfil.faltas}</p>
            <p className="mt-1 text-xs text-suave">faltas (últimos 90 días)</p>
          </div>
        </div>
      )}
      {bloqueado && (
        <p className="rounded-xl bg-alerta-fondo px-4 py-3 text-sm text-alerta-texto">
          Tu cuenta está bloqueada hasta el {new Date(perfil!.bloqueado_hasta!).toLocaleDateString("es-CL")} por faltar
          a 2 partidos.
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="rounded-full bg-gradient-to-br from-verde to-caramelo p-[3px] shadow-[0_0_30px_-8px_var(--brillo)]">
          <div className="rounded-full bg-fondo p-[3px]">
            <Avatar nombre={nombre || "?"} foto={foto} tam={80} />
          </div>
        </div>
        <label className="btn-chico cursor-pointer border border-borde-control hover:border-verde">
          {foto ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])}
          />
        </label>
      </div>

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre o apodo
        </label>
        <input
          id="nombre"
          className="campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="posicion">
          Posición
        </label>
        <select
          id="posicion"
          className="campo"
          value={posicion}
          onChange={(e) => setPosicion(e.target.value as Posicion)}
        >
          {Object.entries(POSICIONES).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="etiqueta" htmlFor="distancia">
          Hasta dónde voy a jugar
        </label>
        <p className="titulo mb-2 text-4xl">
          <span key={distancia} className="rebota inline-block text-verde">
            {distancia}
          </span>{" "}
          km
        </p>
        <input
          id="distancia"
          type="range"
          min={1}
          max={20}
          value={distancia}
          onChange={(e) => setDistancia(Number(e.target.value))}
          className="w-full accent-verde"
        />
      </div>

      <div>
        <p className="etiqueta">Mi zona</p>
        <button type="button" className="btn-sec" onClick={usarUbicacion}>
          <IconoPin className="h-5 w-5 text-verde" />
          {punto ? "Ubicación guardada · actualizar" : "Usar mi ubicación"}
        </button>
        <p className="mt-2 text-sm text-suave">
          Se usa para avisarte de partidos cerca cuando no compartes tu ubicación en el momento.
        </p>
      </div>

      <MensajeError texto={error} />
      {guardado && (
        <p className="aparece flex items-center gap-2 text-sm font-bold text-verde" role="status">
          <IconoCheck className="h-5 w-5" /> Guardado
        </p>
      )}
      <button className="btn" disabled={guardando}>
        {guardando ? "Guardando…" : perfil ? "Guardar" : "Listo, quiero jugar"}
      </button>
      {perfil && (
        <button type="button" className="btn-sec" onClick={salir}>
          Cerrar sesión
        </button>
      )}
    </form>
  );
}
