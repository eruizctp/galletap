export default function Avatar({ nombre, foto, tam = 40 }: { nombre: string; foto?: string | null; tam?: number }) {
  const estilo = { width: tam, height: tam };
  if (foto) return <img src={foto} alt={nombre} style={estilo} className="shrink-0 rounded-full object-cover" />;
  return (
    <div
      style={estilo}
      className="flex shrink-0 items-center justify-center rounded-full bg-verde font-semibold text-sobre-verde"
      aria-hidden
    >
      {nombre.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
