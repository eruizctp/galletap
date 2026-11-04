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

type Modo = "entrar" | "crear" | "olvide" | "nueva";

// Errores de Supabase Auth en palabras simples.
function errorCuenta(e: unknown): string {
  const m = mensajeError(e).toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Ese correo ya tiene cuenta. Entra o recupera tu contraseña.";
  if (m.includes("not confirmed"))
    return "Confirma tu correo con el enlace que te enviamos y vuelve a entrar.";
  if (m.includes("password should") || m.includes("weak"))
    return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("invalid email") || m.includes("validate email"))
    return "Revisa el correo, parece incompleto.";
  return mensajeError(e);
}

// Pestañas Entrar / Crear cuenta con una píldora que se desliza.
function Pestanas({
  modo,
  onChange,
}: {
  modo: Modo;
  onChange: (m: Modo) => void;
}) {
  const opciones: { v: Modo; t: string }[] = [
    { v: "entrar", t: "Entrar" },
    { v: "crear", t: "Crear cuenta" },
  ];
  return (
    <div
      className="relative flex rounded-2xl border border-borde-control bg-fondo-2 p-1"
      role="tablist"
    >
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

const TITULOS: Record<
  Modo,
  { sobre: string; antes: string; verde: string; texto: string }
> = {
  entrar: {
    sobre: "¿Ya tienes cuenta?",
    antes: "Entra a la",
    verde: "cancha",
    texto: "Con tu correo o con Google.",
  },
  crear: {
    sobre: "Primera vez en Galletapp",
    antes: "Crea tu",
    verde: "cuenta",
    texto:
      "Elige un correo y una contraseña. Después armas tu ficha con nombre, posición y celular.",
  },
  olvide: {
    sobre: "Sin drama",
    antes: "Recupera tu",
    verde: "clave",
    texto: "Te enviamos un enlace a tu correo para crear una contraseña nueva.",
  },
  nueva: {
    sobre: "Casi listo",
    antes: "Clave",
    verde: "nueva",
    texto: "Escribe tu nueva contraseña.",
  },
};

export default function Ingresar() {
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const modoUrl = params.get("modo");
  const [recuperando, setRecuperando] = useState(modoUrl === "nueva");
  const modo: Modo = recuperando
    ? "nueva"
    : modoUrl === "crear" || modoUrl === "olvide"
      ? modoUrl
      : "entrar";
  const [revisando, setRevisando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);

  // Con sesión (Google, correo o enlace de confirmación): si hay perfil va a
  // los partidos; si no, a crear la ficha. El enlace de "olvidé mi clave"
  // abre el formulario de clave nueva en vez de entrar.
  useEffect(() => {
    const cliente = supabase();
    let enRecuperacion =
      new URLSearchParams(window.location.search).get("modo") === "nueva";
    async function seguir(uid: string) {
      if (enRecuperacion) return;
      const { data: perfil } = await cliente
        .from("perfiles")
        .select("id")
        .eq("id", uid)
        .maybeSingle();
      navegar(perfil ? "/partidos" : "/perfil?nuevo=1", { replace: true });
    }
    cliente.auth.getSession().then(({ data }) => {
      if (data.session && !enRecuperacion) seguir(data.session.user.id);
      else setRevisando(false);
    });
    const { data } = cliente.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "PASSWORD_RECOVERY") {
        enRecuperacion = true;
        setRecuperando(true);
        setRevisando(false);
        return;
      }
      if (sesion) seguir(sesion.user.id);
    });
    const errorExterno = new URLSearchParams(window.location.search).get(
      "error_description",
    );
    if (errorExterno)
      setError(`No se pudo completar el ingreso: ${errorExterno}`);
    return () => data.subscription.unsubscribe();
  }, [navegar]);

  function cambiarModo(m: Modo) {
    setError(null);
    setAviso(null);
    setParams(m === "entrar" ? {} : { modo: m }, { replace: true });
  }

  async function entrarConGoogle() {
    setError(null);
    setEnviando(true);
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/ingresar`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setEnviando(false);
      setError(mensajeError(error));
    }
  }

  async function enviarCorreo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    const email = correo.trim().toLowerCase();
    if (modo !== "nueva" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Revisa el correo, parece incompleto.");
      return;
    }
    if (modo !== "olvide" && clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    const auth = supabase().auth;
    const volver = `${window.location.origin}/ingresar`;
    if (modo === "entrar") {
      const { error } = await auth.signInWithPassword({
        email,
        password: clave,
      });
      if (error) setError(errorCuenta(error));
    } else if (modo === "crear") {
      const { data, error } = await auth.signUp({
        email,
        password: clave,
        options: { emailRedirectTo: volver },
      });
      if (error) setError(errorCuenta(error));
      // Supabase no avisa si el correo ya existe cuando pide confirmación: llega sin identidades.
      else if (data.user && data.user.identities?.length === 0)
        setError("Ese correo ya tiene cuenta. Entra o recupera tu contraseña.");
      else if (!data.session)
        setAviso(
          `Te enviamos un enlace a ${email}. Ábrelo para activar tu cuenta.`,
        );
    } else if (modo === "olvide") {
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${volver}?modo=nueva`,
      });
      if (error) setError(errorCuenta(error));
      else
        setAviso(
          `Si ${email} tiene cuenta, te llegará un enlace en unos minutos. Revisa también el spam.`,
        );
    } else {
      const { error } = await auth.updateUser({ password: clave });
      if (error) setError(errorCuenta(error));
      else {
        setRecuperando(false);
        const { data } = await auth.getUser();
        if (data.user) {
          const { data: perfil } = await supabase()
            .from("perfiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();
          navegar(perfil ? "/partidos" : "/perfil?nuevo=1", { replace: true });
        }
      }
    }
    setEnviando(false);
  }

  if (revisando) return <Cargando />;

  const t = TITULOS[modo];
  const textoBoton = {
    entrar: "Entrar",
    crear: "Crear cuenta",
    olvide: "Enviar enlace",
    nueva: "Guardar contraseña",
  }[modo];

  return (
    <div className="flex min-h-[85dvh] flex-col">
      <Link to="/" className="aparece flex items-center gap-2 self-start">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="titulo text-xl">
          Galleta<span className="text-caramelo">pp</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-center gap-7 py-6">
        {(modo === "entrar" || modo === "crear") && (
          <Pestanas modo={modo} onChange={cambiarModo} />
        )}

        <div key={modo} className="aparece">
          <p className="sobretitulo">{t.sobre}</p>
          <h1 className="titulo mt-2 text-5xl">
            {t.antes} <span className="text-verde">{t.verde}</span>
          </h1>
          <p className="mt-3 text-suave">{t.texto}</p>
        </div>

        <form onSubmit={enviarCorreo} className="space-y-4" noValidate>
          {modo !== "nueva" && (
            <div>
              <label className="etiqueta" htmlFor="correo">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                className="campo"
                inputMode="email"
                autoComplete="email"
                placeholder="tu@correo.cl"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          )}
          {modo !== "olvide" && (
            <div>
              <div className="flex items-baseline justify-between">
                <label className="etiqueta" htmlFor="clave">
                  {modo === "entrar" ? "Contraseña" : "Crea una contraseña"}
                </label>
                {modo === "entrar" && (
                  <button
                    type="button"
                    className="text-sm font-bold text-verde underline-offset-4 hover:underline"
                    onClick={() => cambiarModo("olvide")}
                  >
                    ¿La olvidaste?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="clave"
                  type={verClave ? "text" : "password"}
                  className="campo pr-20"
                  autoComplete={
                    modo === "entrar" ? "current-password" : "new-password"
                  }
                  placeholder={modo === "entrar" ? "" : "Mínimo 8 caracteres"}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 my-auto h-9 rounded-lg px-2 text-sm font-bold text-suave hover:text-texto"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={
                    verClave ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {verClave ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
          )}

          <MensajeError texto={error} />
          {aviso && (
            <p
              className="aparece rounded-xl border border-verde/40 bg-verde/10 px-4 py-3 text-sm text-texto"
              role="status"
            >
              {aviso}
            </p>
          )}

          <button className="btn text-lg" disabled={enviando}>
            {enviando ? "Un momento…" : textoBoton}
          </button>
        </form>

        {(modo === "entrar" || modo === "crear") && (
          <>
            <div className="flex items-center gap-3 text-sm text-suave">
              <span className="h-px flex-1 bg-borde-control" />o
              <span className="h-px flex-1 bg-borde-control" />
            </div>
            <button
              type="button"
              className="btn-sec min-h-14"
              onClick={entrarConGoogle}
              disabled={enviando}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-texto">
                <LogoGoogle />
              </span>
              {modo === "crear"
                ? "Crear cuenta con Google"
                : "Entrar con Google"}
            </button>
          </>
        )}

        {modo === "olvide" && (
          <button
            type="button"
            className="self-center text-sm font-bold text-suave hover:text-texto"
            onClick={() => cambiarModo("entrar")}
          >
            Volver a entrar
          </button>
        )}

        {modo === "crear" && (
          <p className="text-sm text-suave">
            Tu celular te lo pedimos después para coordinar por WhatsApp. Solo
            lo ven los jugadores confirmados de tus partidos.
          </p>
        )}
      </div>
    </div>
  );
}
