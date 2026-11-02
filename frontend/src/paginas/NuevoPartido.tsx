import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { NIVELES, mensajeError } from "@/lib/textos";
import { buscarDireccion, obtenerUbicacion, type ResultadoDireccion } from "@/lib/ubicacion";
import type { Nivel } from "@/lib/tipos";
import { MensajeError } from "@/componentes/Aviso";
import { despertarAvisos } from "@/lib/despertarAvisos";
import { IconoCamiseta, IconoPin } from "@/componentes/Iconos";
import Radar from "@/componentes/Radar";

function fechaLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Control segmentado: una píldora verde se desliza hasta la opción elegida.
function Opciones<T extends string | number>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: { v: T; t: string }[];
  onChange: (v: T) => void;
}) {
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.v === valor),
  );
  return (
    <div className="relative flex rounded-2xl border border-borde-control bg-fondo-2 p-1" role="radiogroup">
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-xl bg-verde shadow-[0_0_20px_-6px_var(--brillo)]"
        style={{
          width: `calc((100% - 0.5rem) / ${opciones.length})`,
          transform: `translateX(${indice * 100}%)`,
          transition: "transform 380ms var(--ease-rebote)",
        }}
      />
      {opciones.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={valor === o.v}
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`relative flex-1 rounded-xl px-2 py-2.5 text-sm font-extrabold transition-colors duration-300 ${
            valor === o.v ? "text-sobre-verde" : "text-suave hover:text-texto"
          }`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

// Elegir cuántos faltan tocando camisetas.
function ElegirCupos({ valor, onChange }: { valor: 1 | 2 | 3; onChange: (v: 1 | 2 | 3) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Cuántos te faltan">
      {([1, 2, 3] as const).map((n) => {
        const activo = n <= valor;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={valor === n}
            key={n}
            onClick={() => onChange(n)}
            className={`flex flex-col items-center gap-1 rounded-3xl border-2 py-4 transition-all duration-300 active:scale-95 ${
              activo
                ? "border-verde bg-verde/10 text-verde shadow-[0_0_30px_-12px_var(--brillo)]"
                : "border-dashed border-borde-control text-suave"
            }`}
          >
            <IconoCamiseta
              className={`h-9 w-9 transition-transform duration-500 ${activo ? "scale-110" : "scale-90 opacity-60"}`}
              style={activo ? { transitionTimingFunction: "var(--ease-rebote)" } : undefined}
            />
            <span className="titulo text-3xl">{n}</span>
          </button>
        );
      })}
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
    if (inicio.getTime() > Date.now() + 24 * 3_600_000)
      return setError("Solo partidos dentro de las próximas 24 horas");

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
    <form onSubmit={publicar} className="space-y-7">
      <header className="aparece">
        <p className="sobretitulo">Nuevo partido</p>
        <h1 className="titulo mt-1 text-5xl">
          Me faltan <span className="text-verde">{cupos}</span>
        </h1>
      </header>

      <div>
        <p className="etiqueta">¿Cuántos te faltan?</p>
        <ElegirCupos valor={cupos} onChange={setCupos} />
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
          <div className="tarjeta aparece flex items-center justify-between gap-2 border-verde/40">
            <p className="flex items-center gap-2 text-sm">
              <IconoPin className="h-5 w-5 shrink-0 text-verde" />
              {lugar.nombre}
            </p>
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
              <button type="button" className="btn-chico shrink-0 border border-borde-control px-4" onClick={buscar}>
                Buscar
              </button>
            </div>
            {resultados.map((r) => (
              <button
                type="button"
                key={`${r.lat},${r.lng}`}
                className="tarjeta tarjeta-viva aparece block w-full text-left text-sm"
                onClick={() => {
                  setLugar(r);
                  setResultados([]);
                }}
              >
                {r.nombre}
              </button>
            ))}
            <button type="button" className="btn-sec" onClick={aquiMismo}>
              <IconoPin className="h-5 w-5 text-verde" />
              Estoy en la cancha
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-3">
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
          <input
            id="hora"
            type="time"
            className="campo titulo py-2 text-center text-2xl"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="etiqueta">Formato</p>
        <Opciones
          valor={formato}
          onChange={setFormato}
          opciones={[5, 6, 7].map((n) => ({ v: n as 5 | 6 | 7, t: `F${n}` }))}
        />
      </div>

      <div>
        <p className="etiqueta">Nivel</p>
        <Opciones
          valor={nivel}
          onChange={setNivel}
          opciones={Object.entries(NIVELES).map(([v, t]) => ({
            v: v as Nivel,
            t,
          }))}
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
      <div className="tarjeta flex items-center gap-4">
        <Radar tam={84} />
        <p className="text-sm text-suave">
          Avisamos primero a <strong className="text-texto">5 km</strong>. Si nadie se apunta, a los 15 min ampliamos a{" "}
          <strong className="text-texto">10 km</strong> y a los 30 min a <strong className="text-texto">20 km</strong>.
        </p>
      </div>
      <button className="btn text-lg" disabled={enviando}>
        {enviando ? "Publicando…" : "Publicar y buscar jugadores"}
      </button>
    </form>
  );
}
