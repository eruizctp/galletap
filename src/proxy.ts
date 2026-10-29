import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/", "/ingresar"];

// Refresca la sesión en cada visita y manda a /ingresar si no hay sesión.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ruta = request.nextUrl.pathname;

  if (!user && !PUBLICAS.includes(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/ingresar";
    return NextResponse.redirect(destino);
  }
  if (user && ruta === "/") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/partidos";
    return NextResponse.redirect(destino);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|icono.svg|manifest.webmanifest|sw.js|favicon.ico).*)"],
};
