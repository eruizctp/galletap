import { Link, useLocation } from "react-router";

const ITEMS = [
  { href: "/partidos", texto: "Jugar", icono: "⚽" },
  { href: "/organizar", texto: "Organizar", icono: "📋" },
  { href: "/perfil", texto: "Perfil", icono: "👤" },
];

export default function Navegacion() {
  const ruta = useLocation().pathname;
  if (ruta === "/" || ruta === "/ingresar") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-borde bg-tarjeta">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((i) => {
          const activo = ruta.startsWith(i.href);
          return (
            <li key={i.href} className="flex-1">
              <Link
                to={i.href}
                className={`flex flex-col items-center py-2 text-xs ${activo ? "font-semibold text-verde" : "text-suave"}`}
              >
                <span className="text-xl" aria-hidden>
                  {i.icono}
                </span>
                {i.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
