import { IconoCamiseta } from "@/componentes/Iconos";

// Cupos del partido como camisetas: las llenas ya tienen jugador, las vacías esperan.
export default function Cupos({ total, ocupados, tam = "md" }: { total: number; ocupados: number; tam?: "md" | "lg" }) {
  const lado = tam === "lg" ? "h-16 w-16" : "h-11 w-11";
  const icono = tam === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <ul className="flex justify-center gap-3" aria-label={`${ocupados} de ${total} cupos ocupados`}>
      {Array.from({ length: total }, (_, i) => {
        const lleno = i < ocupados;
        return (
          <li
            key={i}
            className={`flex items-center justify-center rounded-2xl ${lado} ${
              lleno
                ? "bg-verde text-sobre-verde shadow-[0_0_24px_-4px_var(--brillo)]"
                : "border-2 border-dashed border-borde-control text-suave"
            }`}
            style={
              lleno
                ? {
                    animation: `llegar 600ms var(--ease-rebote) ${i * 120}ms both`,
                  }
                : undefined
            }
          >
            {lleno ? (
              <IconoCamiseta className={icono} />
            ) : (
              <span className="titulo text-2xl" style={{ animation: "flotar 2.4s ease-in-out infinite" }}>
                ?
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
