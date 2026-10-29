import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Envía los avisos pendientes (partidos cerca, postulaciones, confirmaciones).
// Lo llama un cron cada 5 minutos con "Authorization: Bearer CRON_SECRET",
// y también la app justo después de publicar o postular, para no esperar.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return enviar(req);
}
export async function GET(req: Request) {
  return enviar(req);
}

async function enviar(req: Request) {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, CRON_SECRET } =
    process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PRIVATE_KEY || !NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return Response.json({ error: "Faltan variables de entorno" }, { status: 500 });
  }

  const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Acepta el secreto del cron o un usuario con sesión válida.
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const esCron = !!CRON_SECRET && token === CRON_SECRET;
  if (!esCron) {
    const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!data.user) return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  webpush.setVapidDetails("mailto:hola@galletapp.cl", NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const { data: avisos, error } = await admin.rpc("avisos_por_enviar");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!avisos?.length) return Response.json({ enviados: 0 });

  const usuarios = [...new Set(avisos.map((a: { usuario_id: string }) => a.usuario_id))];
  const { data: subs } = await admin.from("suscripciones_push").select("*").in("usuario_id", usuarios);

  let enviados = 0;
  for (const aviso of avisos as { clave: string; usuario_id: string; titulo: string; cuerpo: string; url: string }[]) {
    // Se marca antes de enviar para que dos llamadas simultáneas no lo repitan.
    const { error: dup } = await admin.from("avisos_enviados").insert({ clave: aviso.clave, usuario_id: aviso.usuario_id });
    if (dup) continue;
    for (const s of (subs ?? []).filter((x) => x.usuario_id === aviso.usuario_id)) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(aviso),
          { TTL: 3600 },
        );
        enviados++;
      } catch (e) {
        const codigo = (e as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) await admin.from("suscripciones_push").delete().eq("endpoint", s.endpoint);
      }
    }
  }
  return Response.json({ enviados });
}
