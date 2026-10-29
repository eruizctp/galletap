"use client";

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
          className={`text-2xl ${n <= valor ? "text-amber-500" : "text-borde"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
