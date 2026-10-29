"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase/navegador";
import type { Perfil } from "./tipos";

// Usuario actual y su perfil (null si aún no lo crea).
export function useSesion() {
  const [estado, setEstado] = useState<{ cargando: boolean; uid: string | null; perfil: Perfil | null }>({
    cargando: true,
    uid: null,
    perfil: null,
  });

  useEffect(() => {
    let activo = true;
    (async () => {
      const {
        data: { user },
      } = await supabase().auth.getUser();
      if (!user) {
        if (activo) setEstado({ cargando: false, uid: null, perfil: null });
        return;
      }
      const { data } = await supabase().from("perfiles").select("*").eq("id", user.id).maybeSingle();
      if (activo) setEstado({ cargando: false, uid: user.id, perfil: (data as Perfil) ?? null });
    })();
    return () => {
      activo = false;
    };
  }, []);

  return estado;
}
