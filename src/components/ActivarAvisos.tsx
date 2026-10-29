"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/navegador";

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
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
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
      applicationServerKey: claveBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    await guardar(sub);
    setEstado("activo");
  }

  if (estado === "ofrecer")
    return (
      <div className="tarjeta space-y-3">
        <p>🔔 Activa los avisos para enterarte al tiro cuando falte gente cerca o te confirmen.</p>
        <button className="btn" onClick={activar}>
          Activar avisos
        </button>
      </div>
    );
  if (estado === "bloqueado")
    return (
      <p className="tarjeta text-sm text-suave">
        Los avisos están bloqueados en este navegador. Actívalos en la configuración del sitio para no perderte partidos.
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
