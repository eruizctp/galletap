export default function Estrellas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
      <span className="mr-2 text-sm text-suave">{valor ? "Tu nota:" : "¿Cómo jugó?"}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-3xl transition-transform duration-300 active:scale-75 ${n <= valor ? "scale-110 text-estrella drop-shadow-[0_0_8px_rgba(244,184,96,0.6)]" : "text-borde-control hover:text-suave"}`}
          style={{ transitionTimingFunction: "var(--ease-rebote)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
