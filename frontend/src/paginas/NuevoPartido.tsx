import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { NIVELES, mensajeError } from "@/lib/textos";
import { buscarDireccion, obtenerUbicacion, type ResultadoDireccion } from "@/lib/ubicacion";
import type { Nivel } from "@/lib/tipos";
import { MensajeError } from "@/componentes/Aviso";
import { despertarAvisos } from "@/lib/despertarAvisos";

function fechaLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function Opciones<T extends string | number>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: { v: T; t: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {opciones.map((o) => (
        <button
          type="button"
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`btn-chico flex-1 border ${valor === o.v ? "border-verde bg-verde text-sobre-verde" : "border-borde-control bg-tarjeta"}`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

export default function NuevoPartido() {
  const navegar = useNavigate();
  const [cancha, setCancha] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ResultadoDireccion[]>([]);
  const [lugar, setLugar] = useState<ResultadoDireccion | null>(null);
  const [dia, setDia] = useState<"hoy" | "manana">("hoy");
  const [hora, setHora] = useState("21:00");
  const [formato, setFormato] = useState<5 | 6 | 7>(7);
  const [nivel, setNivel] = useState<Nivel>("recreativo");
  const [cupos, setCupos] = useState<1 | 2 | 3>(1);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function buscar() {
    setError(null);
    try {
      const r = await buscarDireccion(busqueda);
      setResultados(r);
      if (r.length === 0) setError("No encontramos esa dirección. Prueba con calle, número y comuna.");
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function aquiMismo() {
    setError(null);
    try {
      const p = await obtenerUbicacion();
      setLugar({ ...p, nombre: "Mi ubicación actual" });
      setResultados([]);
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cancha.trim().length < 2) return setError("Escribe el nombre de la cancha");
    if (!lugar) return setError("Indica dónde queda la cancha");
    const base = new Date();
    if (dia === "manana") base.setDate(base.getDate() + 1);
    const inicio = new Date(`${fechaLocal(base)}T${hora}`);
    if (inicio.getTime() <= Date.now()) return setError("Esa hora ya pasó");
    if (inicio.getTime() > Date.now() + 24 * 3_600_000) return setError("Solo partidos dentro de las próximas 24 horas");

    setEnviando(true);
    const { data, error } = await supabase().rpc("publicar_partido", {
      p_cancha: cancha.trim(),
      p_direccion: lugar.nombre,
      p_lat: lugar.lat,
      p_lng: lugar.lng,
      p_inicio: inicio.toISOString(),
      p_formato: formato,
      p_nivel: nivel,
      p_cupos: cupos,
      p_notas: notas.trim() || null,
    });
    setEnviando(false);
    if (error) return setError(mensajeError(error));
    despertarAvisos();
    navegar(`/partido/${data}`, { replace: true });
  }

  return (
    <form onSubmit={publicar} className="space-y-5">
      <h1 className="text-2xl font-bold">Me faltan jugadores</h1>

      <div>
        <p className="etiqueta">¿Cuántos te faltan?</p>
        <Opciones valor={cupos} onChange={setCupos} opciones={[1, 2, 3].map((n) => ({ v: n as 1 | 2 | 3, t: String(n) }))} />
      </div>

      <div>
        <label className="etiqueta" htmlFor="cancha">
          Cancha
        </label>
        <input
          id="cancha"
          className="campo"
          placeholder="Ej: Complejo Los Robles, cancha 3"
          value={cancha}
          onChange={(e) => setCancha(e.target.value)}
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <p className="etiqueta">¿Dónde queda?</p>
        {lugar ? (
          <div className="tarjeta flex items-center justify-between gap-2">
            <p className="text-sm">📍 {lugar.nombre}</p>
            <button type="button" className="btn-chico text-verde" onClick={() => setLugar(null)}>
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                className="campo"
                placeholder="Dirección y comuna"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscar();
                  }
                }}
              />
              <button type="button" className="btn-chico border border-borde-control" onClick={buscar}>
                Buscar
              </button>
            </div>
            {resultados.map((r) => (
              <button
                type="button"
                key={`${r.lat},${r.lng}`}
                className="tarjeta block w-full text-left text-sm"
                onClick={() => {
                  setLugar(r);
                  setResultados([]);
                }}
              >
                {r.nombre}
              </button>
            ))}
            <button type="button" className="btn-sec" onClick={aquiMismo}>
              Estoy en la cancha (usar mi ubicación)
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="etiqueta">Día</p>
          <Opciones
            valor={dia}
            onChange={setDia}
            opciones={[
              { v: "hoy", t: "Hoy" },
              { v: "manana", t: "Mañana" },
            ]}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="hora">
            Hora
          </label>
          <input id="hora" type="time" className="campo py-2" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>

      <div>
        <p className="etiqueta">Formato</p>
        <Opciones
          valor={formato}
          onChange={setFormato}
          opciones={[5, 6, 7].map((n) => ({ v: n as 5 | 6 | 7, t: `Fútbol ${n}` }))}
        />
      </div>

      <div>
        <p className="etiqueta">Nivel</p>
        <Opciones
          valor={nivel}
          onChange={setNivel}
          opciones={Object.entries(NIVELES).map(([v, t]) => ({ v: v as Nivel, t }))}
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="notas">
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          className="campo"
          rows={2}
          maxLength={300}
          placeholder="Ej: necesitamos arquero, se paga $3.000 en la cancha"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <MensajeError texto={error} />
      <button className="btn text-lg" disabled={enviando}>
        {enviando ? "Publicando…" : "Publicar y buscar jugadores"}
      </button>
      <p className="text-center text-sm text-suave">
        Avisamos primero a 5 km. Si nadie se apunta, a los 15 min ampliamos a 10 km y a los 30 min a 20 km.
      </p>
    </form>
  );
}
