import { supabase } from "./supabase/navegador";

// Pide al servidor enviar avisos ahora (sin esperar el cron). No bloquea.
export async function despertarAvisos() {
  const {
    data: { session },
  } = await supabase().auth.getSession();
  if (!session) return;
  fetch("/api/avisos", { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } }).catch(() => {});
}
