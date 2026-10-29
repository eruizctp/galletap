import Link from "next/link";

export default function Inicio() {
  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8">
      <div>
        <p className="text-5xl">⚽</p>
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
      <Link href="/ingresar" className="btn text-lg">
        Entrar con mi celular
      </Link>
    </div>
  );
}
