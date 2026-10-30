import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/navegador";
import { IconoCampana } from "@/componentes/Iconos";

function claveBytes(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function guardar(sub: PushSubscription) {
  const {
    data: { user },
  } = await supabase().auth.getUser();
  const json = sub.toJSON();
  if (!user || !json.keys) return;
  await supabase().from("suscripciones_push").upsert({
    endpoint: sub.endpoint,
    usuario_id: user.id,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
}

// Ofrece activar avisos en el celular. Desaparece cuando ya están activos.
export default function ActivarAvisos() {
  const [estado, setEstado] = useState<"cargando" | "activo" | "ofrecer" | "no-soportado" | "bloqueado">("cargando");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !import.meta.env.VITE_VAPID_PUBLIC_KEY) {
      setEstado("no-soportado");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        await guardar(sub);
        setEstado("activo");
      } else setEstado("ofrecer");
    });
  }, []);

  async function activar() {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return setEstado("bloqueado");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveBytes(import.meta.env.VITE_VAPID_PUBLIC_KEY!),
    });
    await guardar(sub);
    setEstado("activo");
  }

  if (estado === "ofrecer")
    return (
      <div className="tarjeta aparece space-y-4 border-caramelo/40 bg-gradient-to-br from-caramelo/10 to-transparent">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramelo/20 text-caramelo">
            <IconoCampana className="h-6 w-6" style={{ animation: "flotar 1.6s ease-in-out infinite" }} />
          </span>
          <p className="text-sm">
            <strong className="block text-base">No te pierdas ningún partido</strong>
            Te avisamos al tiro cuando falte gente cerca o te confirmen.
          </p>
        </div>
        <button className="btn" onClick={activar}>
          Activar avisos
        </button>
      </div>
    );
  if (estado === "bloqueado")
    return (
      <p className="tarjeta text-sm text-suave">
        Los avisos están bloqueados en este navegador. Actívalos en la configuración del sitio para no perderte
        partidos.
      </p>
    );
  if (estado === "no-soportado")
    return (
      <p className="tarjeta text-sm text-suave">
        Para recibir avisos en iPhone, agrega Galletapp a tu pantalla de inicio (Compartir → Agregar a inicio).
      </p>
    );
  return null;
}
