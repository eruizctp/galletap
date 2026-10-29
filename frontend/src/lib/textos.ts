import type { EstadoPostulacion, Nivel, Posicion } from "./tipos";

export const POSICIONES: Record<Posicion, string> = {
  cualquiera: "Donde me pongan",
  arquero: "Arquero",
  defensa: "Defensa",
  medio: "Mediocampo",
  delantero: "Delantero",
};

export const NIVELES: Record<Nivel, string> = {
  recreativo: "Recreativo",
  intermedio: "Intermedio",
  competitivo: "Competitivo",
};

export const ESTADOS: Record<EstadoPostulacion, string> = {
  pendiente: "Esperando al organizador",
  aceptado: "Confirmado",
  rechazado: "No quedaste",
  retirado: "Te retiraste",
};

const ZONA = "America/Santiago";

// "hoy 21:00", "mañana 10:30" o "sáb 12 21:00".
export function horaPartido(iso: string): string {
  const fecha = new Date(iso);
  const dia = (d: Date) => d.toLocaleDateString("es-CL", { timeZone: ZONA });
  const hora = fecha.toLocaleTimeString("es-CL", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hoy = new Date();
  const manana = new Date(hoy.getTime() + 86_400_000);
  if (dia(fecha) === dia(hoy)) return `hoy ${hora}`;
  if (dia(fecha) === dia(manana)) return `mañana ${hora}`;
  const corto = fecha.toLocaleDateString("es-CL", { timeZone: ZONA, weekday: "short", day: "numeric" });
  return `${corto} ${hora}`;
}

export function estrellas(promedio: number | null | undefined): string {
  if (promedio == null) return "Nuevo";
  return `★ ${Number(promedio).toFixed(1)}`;
}

// Enlace para abrir WhatsApp con un número chileno (+569...).
export function enlaceWhatsapp(telefono: string, texto?: string): string {
  const numero = telefono.replace(/\D/g, "");
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

// Normaliza un celular chileno a +569XXXXXXXX. Devuelve null si no es válido.
export function normalizarCelular(entrada: string): string | null {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("56")) d = d.slice(2);
  if (d.length === 8) d = "9" + d;
  if (d.length !== 9 || !d.startsWith("9")) return null;
  return `+56${d}`;
}

export function mensajeError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Algo falló. Intenta de nuevo.";
}
