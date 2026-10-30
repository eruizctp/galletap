// Íconos de línea propios (sin emojis): heredan el color del texto.
type Props = { className?: string; style?: React.CSSProperties };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconoPelota({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 4 3-1.5 4.5h-5L8 10z" fill="currentColor" stroke="none" />
      <path d="M12 3v4M16 10l4.5-1.5M14.5 14.5 17 19M9.5 14.5 7 19M8 10 3.5 8.5" />
    </svg>
  );
}

export function IconoPizarra({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function IconoPersona({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function IconoPin({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function IconoCampana({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function IconoCompartir({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export function IconoMas({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconoFlecha({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconoCheck({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function IconoCamiseta({ className, style }: Props) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" />
    </svg>
  );
}
