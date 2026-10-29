import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { mensajeError, normalizarCelular } from "@/lib/textos";
import { MensajeError } from "@/componentes/Aviso";

export default function Ingresar() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState<"celular" | "codigo">("celular");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const telefono = normalizarCelular(celular);
    if (!telefono) {
      setError("Escribe un celular chileno, por ejemplo 9 1234 5678");
      return;
    }
    setEnviando(true);
    const { error } = await supabase().auth.signInWithOtp({ phone: telefono });
    setEnviando(false);
    if (error) setError(mensajeError(error));
    else setPaso("codigo");
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { data, error } = await supabase().auth.verifyOtp({
      phone: normalizarCelular(celular)!,
      token: codigo.trim(),
      type: "sms",
    });
    if (error || !data.user) {
      setEnviando(false);
      setError("El código no es correcto o ya venció");
      return;
    }
    const { data: perfil } = await supabase().from("perfiles").select("id").eq("id", data.user.id).maybeSingle();
    navegar(perfil ? "/partidos" : "/perfil?nuevo=1", { replace: true });
  }

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-6">
      <h1 className="text-2xl font-bold">Entrar a Galletapp</h1>
      {paso === "celular" ? (
        <form onSubmit={enviarCodigo} className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="celular">
              Tu celular
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-suave">+56</span>
              <input
                id="celular"
                className="campo"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9 1234 5678"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
              />
            </div>
            <p className="mt-2 text-sm text-suave">Te mandamos un código por SMS. Solo lo verán los jugadores de tus partidos.</p>
          </div>
          <MensajeError texto={error} />
          <button className="btn" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={verificar} className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="codigo">
              Código que llegó a {normalizarCelular(celular)}
            </label>
            <input
              id="codigo"
              className="campo text-center text-2xl tracking-widest"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <MensajeError texto={error} />
          <button className="btn" disabled={enviando || codigo.length < 6}>
            {enviando ? "Verificando…" : "Entrar"}
          </button>
          <button type="button" className="btn-sec" onClick={() => setPaso("celular")}>
            Cambiar número
          </button>
        </form>
      )}
    </div>
  );
}
