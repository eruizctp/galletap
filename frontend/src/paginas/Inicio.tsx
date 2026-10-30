import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";

export default function Inicio() {
  const navegar = useNavigate();

  // Si ya tiene sesión, directo a los partidos.
  useEffect(() => {
    supabase()
      .auth.getSession()
      .then(({ data }) => data.session && navegar("/partidos", { replace: true }));
  }, [navegar]);

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8">
      <div>
        <img src="/logo.svg" alt="" className="h-20 w-20" />
        <h1 className="mt-4 text-3xl font-bold">¿Te faltan jugadores para la pichanga?</h1>
        <p className="mt-3 text-lg text-suave">
          Publica tu partido y Galletapp avisa a jugadores cerca de la cancha. Si no hay nadie, busca más lejos.
        </p>
      </div>
      <ul className="space-y-2 text-suave">
        <li>✅ Para fútbol 5, 6 y 7, el mismo día</li>
        <li>✅ Tú eliges quién juega</li>
        <li>✅ Jugadores con calificación y asistencia</li>
      </ul>
      <Link to="/ingresar" className="btn text-lg">
        Entrar con mi celular
      </Link>
    </div>
  );
}
