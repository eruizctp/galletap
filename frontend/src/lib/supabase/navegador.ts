import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

// Cliente de Supabase (se crea una sola vez). La sesión queda en el navegador.
export function supabase(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  }
  return cliente;
}
