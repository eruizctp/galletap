export default function Avatar({ nombre, foto, tam = 40 }: { nombre: string; foto?: string | null; tam?: number }) {
  const estilo = { width: tam, height: tam };
  if (foto) return <img src={foto} alt={nombre} style={estilo} className="shrink-0 rounded-full object-cover" />;
  return (
    <div
      style={estilo}
      className="titulo flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-verde to-verde-oscuro text-sobre-verde"
      aria-hidden
    >
      {nombre.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
