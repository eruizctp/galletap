import type { Metadata, Viewport } from "next";
import Navegacion from "@/components/Navegacion";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galletapp",
  description: "Completa tu pichanga: encuentra los jugadores que te faltan cerca de la cancha.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f7a3a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL">
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col">
          <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
          <Navegacion />
        </div>
      </body>
    </html>
  );
}
