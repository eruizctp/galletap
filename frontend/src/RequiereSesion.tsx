import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { Cargando } from "@/componentes/Aviso";

// Muestra las pantallas internas solo con sesión; si no, manda a /ingresar.
export default function RequiereSesion() {
  const [estado, setEstado] = useState<"cargando" | "si" | "no">("cargando");

  useEffect(() => {
    supabase()
      .auth.getSession()
      .then(({ data }) => setEstado(data.session ? "si" : "no"));
    const { data } = supabase().auth.onAuthStateChange((_e, sesion) => setEstado(sesion ? "si" : "no"));
    return () => data.subscription.unsubscribe();
  }, []);

  if (estado === "cargando") return <Cargando />;
  if (estado === "no") return <Navigate to="/ingresar" replace />;
  return <Outlet />;
}
