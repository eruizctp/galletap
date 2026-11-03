import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase/navegador";
import { mensajeError } from "@/lib/textos";
import { Cargando, MensajeError } from "@/componentes/Aviso";

// Marca de Google para el botón de ingreso (colores oficiales).
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

type Modo = "entrar" | "crear";

const PASOS_CUENTA = [
  "Eliges tu cuenta de Google",
  "Armas tu ficha: nombre, posición y celular",
  "Listo: publicas o te apuntas a partidos",
];

// Pestañas Entrar / Crear cuenta con una píldora que se desliza.
function Pestanas({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  const opciones: { v: Modo; t: string }[] = [
    { v: "entrar", t: "Entrar" },
    { v: "crear", t: "Crear cuenta" },
  ];
  return (
    <div className="relative flex rounded-2xl border border-borde-control bg-fondo-2 p-1" role="tablist">
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-xl bg-verde shadow-[0_0_20px_-6px_var(--brillo)]"
        style={{
          transform: `translateX(${modo === "crear" ? 100 : 0}%)`,
          transition: "transform 380ms var(--ease-rebote)",
        }}
      />
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={modo === o.v}
          onClick={() => onChange(o.v)}
          className={`relative flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-colors duration-300 ${
            modo === o.v ? "text-sobre-verde" : "text-suave hover:text-texto"
          }`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

export default function Ingresar() {
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const modo: Modo = params.get("modo") === "crear" ? "crear" : "entrar";
  const [revisando, setRevisando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Al volver de Google la sesión ya viene en la dirección: si hay perfil va a
  // los partidos; si no, a crear la ficha.
  useEffect(() => {
    const cliente = supabase();
    async function seguir(uid: string) {
      const { data: perfil } = await cliente.from("perfiles").select("id").eq("id", uid).maybeSingle();
      navegar(perfil ? "/partidos" : "/perfil?nuevo=1", { replace: true });
    }
    cliente.auth.getSession().then(({ data }) => {
      if (data.session) seguir(data.session.user.id);
      else setRevisando(false);
    });
    const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      if (sesion) seguir(sesion.user.id);
    });
    const params = new URLSearchParams(window.location.search);
    const errorGoogle = params.get("error_description");
    if (errorGoogle) setError(`Google no pudo completar el ingreso: ${errorGoogle}`);
    return () => data.subscription.unsubscribe();
  }, [navegar]);

  async function entrarConGoogle() {
    setError(null);
    setEnviando(true);
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/ingresar`, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setEnviando(false);
      setError(mensajeError(error));
    }
  }

  if (revisando) return <Cargando />;

  return (
    <div className="flex min-h-[85dvh] flex-col">
      <Link to="/" className="aparece flex items-center gap-2 self-start">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="titulo text-xl">
          Galleta<span className="text-caramelo">pp</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-center gap-8">
        <Pestanas modo={modo} onChange={(m) => setParams(m === "crear" ? { modo: "crear" } : {}, { replace: true })} />

        {modo === "entrar" ? (
          <div key="entrar" className="aparece">
            <p className="sobretitulo">¿Ya tienes cuenta?</p>
            <h1 className="titulo mt-2 text-5xl">
              Entra a la <span className="text-verde">cancha</span>
            </h1>
            <p className="mt-3 text-suave">Usa tu cuenta de Google. No hay contraseña nueva que recordar.</p>
          </div>
        ) : (
          <div key="crear" className="aparece">
            <p className="sobretitulo">Primera vez en Galletapp</p>
            <h1 className="titulo mt-2 text-5xl">
              Crea tu <span className="text-verde">cuenta</span>
            </h1>
            <ol className="escalonado mt-5 space-y-3">
              {PASOS_CUENTA.map((paso, i) => (
                <li key={paso} className="flex items-center gap-3">
                  <span className="titulo flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-caramelo/15 text-xl text-caramelo">
                    {i + 1}
                  </span>
                  <span className="text-suave">{paso}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <MensajeError texto={error} />

        <button type="button" className="btn-sec min-h-14 text-lg" onClick={entrarConGoogle} disabled={enviando}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-texto">
            <LogoGoogle />
          </span>
          {enviando ? "Abriendo Google…" : modo === "crear" ? "Crear cuenta con Google" : "Entrar con Google"}
        </button>

        <p className="text-sm text-suave">
          Después te pedimos tu celular para coordinar por WhatsApp. Solo lo ven los jugadores confirmados de tus
          partidos.
        </p>
      </div>
    </div>
  );
}
