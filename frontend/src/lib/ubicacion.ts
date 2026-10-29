export interface Punto {
  lat: number;
  lng: number;
}

// Pide la ubicación del celular. Rechaza si el usuario no da permiso.
export function obtenerUbicacion(): Promise<Punto> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Tu navegador no permite obtener la ubicación"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("No pudimos obtener tu ubicación. Revisa los permisos del navegador.")),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}

export interface ResultadoDireccion extends Punto {
  nombre: string;
}

// Busca una dirección en OpenStreetMap, limitada a la Región Metropolitana.
export async function buscarDireccion(texto: string): Promise<ResultadoDireccion[]> {
  const params = new URLSearchParams({
    q: texto,
    format: "json",
    limit: "5",
    countrycodes: "cl",
    viewbox: "-71.0,-33.2,-70.4,-33.75",
    bounded: "1",
    "accept-language": "es",
  });
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!r.ok) throw new Error("No pudimos buscar la dirección");
  const datos: { display_name: string; lat: string; lon: string }[] = await r.json();
  return datos.map((d) => ({ nombre: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }));
}
