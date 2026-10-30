import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { mensajeError, normalizarCelular } from "@/lib/textos";
import { MensajeError } from "@/componentes/Aviso";
import { IconoFlecha } from "@/componentes/Iconos";

const LARGO_CODIGO = 6;

// Seis casillas visibles sobre un único input real (accesible y con autocompletar del SMS).
function CasillasCodigo({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        id="codigo"
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={LARGO_CODIGO}
        value={valor}
        autoFocus
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, LARGO_CODIGO))}
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: LARGO_CODIGO }, (_, i) => {
          const digito = valor[i];
          const actual = i === valor.length;
          return (
            <div
              key={i}
              className={`flex aspect-[3/4] items-center justify-center rounded-2xl border-2 bg-fondo-2 transition-colors duration-200 ${
                digito ? "border-verde" : actual ? "border-texto/60" : "border-borde-control"
              }`}
            >
              {digito ? (
                <span key={digito + i} className="titulo rebota text-4xl">
                  {digito}
                </span>
              ) : (
                actual && <span className="h-7 w-0.5 bg-verde" style={{ animation: "pulso-insignia 1s infinite" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="flex min-h-[85dvh] flex-col">
      <Link to="/" className="aparece flex items-center gap-2 self-start">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="titulo text-xl">
          Galleta<span className="text-caramelo">pp</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-center gap-8">
        {/* Indicador de paso */}
        <div className="flex gap-2" aria-hidden>
          {["celular", "codigo"].map((p, i) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                paso === p || (i === 0 && paso === "codigo") ? "w-10 bg-verde" : "w-5 bg-borde-control"
              }`}
            />
          ))}
        </div>

        {paso === "celular" ? (
          <form key="celular" onSubmit={enviarCodigo} className="escalonado space-y-6">
            <div>
              <p className="sobretitulo">Paso 1 de 2</p>
              <h1 className="titulo mt-2 text-5xl">
                Tu <span className="text-verde">celular</span>
              </h1>
            </div>
            <div>
              <label className="etiqueta" htmlFor="celular">
                Número
              </label>
              <div className="flex items-stretch gap-2">
                <span className="titulo flex items-center rounded-2xl border border-borde-control bg-fondo-2 px-4 text-2xl text-suave">
                  +56
                </span>
                <input
                  id="celular"
                  className="campo text-xl font-bold tracking-wider"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="9 1234 5678"
                  value={celular}
                  autoFocus
                  onChange={(e) => setCelular(e.target.value)}
                />
              </div>
              <p className="mt-3 text-sm text-suave">
                Te mandamos un código por SMS. Tu número solo lo ven los jugadores confirmados de tus partidos.
              </p>
            </div>
            <MensajeError texto={error} />
            <button className="btn text-lg" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar código"}
              {!enviando && <IconoFlecha className="h-5 w-5" />}
            </button>
          </form>
        ) : (
          <form key="codigo" onSubmit={verificar} className="escalonado space-y-6">
            <div>
              <p className="sobretitulo">Paso 2 de 2</p>
              <h1 className="titulo mt-2 text-5xl">
                El <span className="text-verde">código</span>
              </h1>
              <p className="mt-2 text-suave">
                Llegó por SMS a <strong className="text-texto">{normalizarCelular(celular)}</strong>
              </p>
            </div>
            <div>
              <label className="sr-only" htmlFor="codigo">
                Código de 6 dígitos
              </label>
              <CasillasCodigo valor={codigo} onChange={setCodigo} />
            </div>
            <MensajeError texto={error} />
            <button className="btn text-lg" disabled={enviando || codigo.length < LARGO_CODIGO}>
              {enviando ? "Verificando…" : "Entrar a la cancha"}
            </button>
            <button type="button" className="btn-sec" onClick={() => setPaso("celular")}>
              Cambiar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
