import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Navegacion from "@/componentes/Navegacion";
import RequiereSesion from "@/RequiereSesion";
import Inicio from "@/paginas/Inicio";
import Ingresar from "@/paginas/Ingresar";
import Perfil from "@/paginas/Perfil";
import Jugar from "@/paginas/Jugar";
import Organizar from "@/paginas/Organizar";
import NuevoPartido from "@/paginas/NuevoPartido";
import DetallePartido from "@/paginas/DetallePartido";

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <main className="flex-1 px-4 pb-24 pt-4">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/ingresar" element={<Ingresar />} />
            <Route element={<RequiereSesion />}>
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/partidos" element={<Jugar />} />
              <Route path="/organizar" element={<Organizar />} />
              <Route path="/organizar/nuevo" element={<NuevoPartido />} />
              <Route path="/partido/:id" element={<DetallePartido />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Navegacion />
      </div>
    </BrowserRouter>
  );
}
