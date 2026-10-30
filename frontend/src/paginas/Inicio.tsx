import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import CanchaAnimada from "@/componentes/CanchaAnimada";
import { IconoFlecha } from "@/componentes/Iconos";

const PASOS = [
  {
    n: "01",
    titulo: "Publicas",
    texto: "Cancha, hora y cuántos te faltan. 20 segundos.",
  },
  {
    n: "02",
    titulo: "Avisamos cerca",
    texto: "Primero a 5 km. Si nadie llega, 10 y luego 20 km.",
  },
  {
    n: "03",
    titulo: "Tú eliges",
    texto: "Ves nota y asistencia de cada jugador antes de aceptar.",
  },
];

export default function Inicio() {
  const navegar = useNavigate();

  // Si ya tiene sesión, directo a los partidos.
  useEffect(() => {
    supabase()
      .auth.getSession()
      .then(({ data }) => data.session && navegar("/partidos", { replace: true }));
  }, [navegar]);

  return (
    <div className="space-y-10 pb-28">
      <header className="aparece flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-9 w-9" />
          <span className="titulo text-2xl">
            Galleta<span className="text-caramelo">pp</span>
          </span>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-verde" style={{ animation: "pulso-insignia 1.6s infinite" }} />
          Piloto · Santiago
        </span>
      </header>

      <section aria-labelledby="titulo-portada" className="space-y-4">
        <h1 id="titulo-portada" className="titulo text-[clamp(3.2rem,15vw,4.6rem)]">
          <span className="aparece block" style={{ "--retraso": "80ms" } as React.CSSProperties}>
            ¿Te faltan
          </span>
          <span className="aparece block text-verde" style={{ "--retraso": "180ms" } as React.CSSProperties}>
            jugadores
          </span>
          <span className="aparece block" style={{ "--retraso": "280ms" } as React.CSSProperties}>
            pa' la pichanga?
          </span>
        </h1>
        <p className="aparece max-w-[34ch] text-lg text-suave" style={{ "--retraso": "380ms" } as React.CSSProperties}>
          Publica tu partido y avisamos al tiro a los jugadores cerca de la cancha. Fútbol 5, 6 y 7, el mismo día.
        </p>
      </section>

      <div className="aparece" style={{ "--retraso": "450ms" } as React.CSSProperties}>
        <CanchaAnimada />
      </div>

      <ol className="escalonado space-y-3">
        {PASOS.map((p) => (
          <li key={p.n} className="tarjeta flex items-start gap-4">
            <span className="titulo text-4xl text-caramelo">{p.n}</span>
            <div>
              <p className="titulo text-xl">{p.titulo}</p>
              <p className="text-sm text-suave">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-fondo via-fondo/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-md">
          <Link to="/ingresar" className="btn text-lg">
            Entrar con mi celular
            <IconoFlecha className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
