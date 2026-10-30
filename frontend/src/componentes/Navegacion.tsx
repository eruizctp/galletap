import { Link, useLocation } from "react-router";
import { IconoPelota, IconoPersona, IconoPizarra } from "@/componentes/Iconos";

const ITEMS = [
  { href: "/partidos", texto: "Jugar", Icono: IconoPelota },
  { href: "/organizar", texto: "Organizar", Icono: IconoPizarra },
  { href: "/perfil", texto: "Perfil", Icono: IconoPersona },
];

// Barra flotante con una píldora que se desliza hasta la pestaña activa.
export default function Navegacion() {
  const ruta = useLocation().pathname;
  if (ruta === "/" || ruta === "/ingresar") return null;
  const activo = ITEMS.findIndex((i) => ruta.startsWith(i.href));

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="relative mx-auto max-w-md rounded-[28px] border border-borde bg-tarjeta/80 p-1.5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl">
        {activo >= 0 && (
          <div
            aria-hidden
            className="absolute bottom-1.5 left-1.5 top-1.5 rounded-[22px] bg-verde shadow-[0_0_30px_-6px_var(--brillo)]"
            style={{
              width: `calc((100% - 0.75rem) / ${ITEMS.length})`,
              transform: `translateX(${activo * 100}%)`,
              transition: "transform 450ms var(--ease-rebote)",
            }}
          />
        )}
        <ul className="relative flex">
          {ITEMS.map(({ href, texto, Icono }, i) => {
            const esActivo = i === activo;
            return (
              <li key={href} className="flex-1">
                <Link
                  to={href}
                  aria-current={esActivo ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-[22px] py-2 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${
                    esActivo ? "text-sobre-verde" : "text-suave hover:text-texto"
                  }`}
                >
                  <Icono className={`h-6 w-6 transition-transform duration-300 ${esActivo ? "scale-110" : ""}`} />
                  {texto}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
