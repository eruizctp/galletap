export type Posicion = "arquero" | "defensa" | "medio" | "delantero" | "cualquiera";
export type Nivel = "recreativo" | "intermedio" | "competitivo";
export type EstadoPostulacion = "pendiente" | "aceptado" | "rechazado" | "retirado";

export interface Perfil {
  id: string;
  nombre: string;
  foto_url: string | null;
  posicion: Posicion;
  distancia_max_km: number;
  lat: number | null;
  lng: number | null;
  calificacion_promedio: number | null;
  calificaciones_total: number;
  faltas: number;
  bloqueado_hasta: string | null;
}

export interface Partido {
  id: string;
  organizador_id: string;
  cancha: string;
  direccion: string | null;
  lat: number;
  lng: number;
  inicio: string;
  formato: 5 | 6 | 7;
  nivel: Nivel;
  cupos: number;
  notas: string | null;
  estado: "abierto" | "completo" | "cancelado";
  creado_en: string;
}

export interface PartidoCercano {
  id: string;
  cancha: string;
  direccion: string | null;
  inicio: string;
  formato: number;
  nivel: Nivel;
  cupos: number;
  cupos_libres: number;
  notas: string | null;
  distancia_km: number;
  radio_km: number;
  organizador_nombre: string;
  organizador_calificacion: number | null;
  mi_estado: EstadoPostulacion | null;
}

export interface Postulacion {
  id: string;
  partido_id: string;
  jugador_id: string;
  estado: EstadoPostulacion;
  asistio: boolean | null;
  creado_en: string;
}

export interface Contacto {
  jugador_id: string;
  nombre: string;
  telefono: string | null;
  rol: "organizador" | "jugador";
}
