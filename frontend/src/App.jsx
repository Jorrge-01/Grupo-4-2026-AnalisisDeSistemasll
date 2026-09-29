import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import Autoridades from './components/Autoridades'
import InfoGeneral from './components/InfoGeneral'
import MisionVision from './components/MisionVision'
import Footer from './components/Footer'
import Login from './pages/Login'
import Registro from './pages/Registro'
import OlvideContrasena from './pages/OlvideContrasena'
import CambiarPassword from './pages/CambiarPassword'
import Admin from './pages/Admin'
import Vecino from './pages/Vecino'
import GestionAldeas from './pages/GestionAldeas'
import GestionAreas from './pages/GestionAreas'
import GestionUsuarios from './pages/GestionUsuarios'
import CrearVecino from './pages/CrearVecino'
import CrearEmpleadoMunicipal from './pages/CrearEmpleadoMunicipal'
import Reportes from './pages/Reportes'
import ReporteBitacora from './pages/ReporteBitacora'
import ReporteUsuarios from './pages/ReporteUsuarios'
import RutaProtegida from './components/RutaProtegida'
import MiPerfil from './pages/MiPerfil'
import RegistrarCaso from './pages/RegistrarCaso'
import Analista from './pages/Analista'
import DetalleCasoAnalista from './pages/DetalleCasoAnalista'
import Operario from './pages/Operario'
import DetalleCasoOperario from './pages/DetalleCasoOperario'
import MisCasos from './pages/MisCasos'
import AdminCasos from './pages/AdminCasos'
import ServidorCaido from './components/ServidorCaido'
import { API_BASE_URL } from './lib/api'

function Inicio() {
  return (
    <>
      <Hero />
      <Autoridades />
      <InfoGeneral />
      <MisionVision />
    </>
  )
}

const RUTAS_SIN_LAYOUT_PUBLICO = ['/admin', '/vecino', '/analista', '/empleado']

function Layout({ children }) {
  const location = useLocation()
  const esInterna = RUTAS_SIN_LAYOUT_PUBLICO.some((ruta) =>
    location.pathname.startsWith(ruta)
  )

  if (esInterna) {
    return children
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function VerificadorServidor({ children }) {
  const location = useLocation()
  const [servidorDisponible, setServidorDisponible] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function verificar() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`)
        if (!cancelado) setServidorDisponible(res.ok)
      } catch {
        if (!cancelado) setServidorDisponible(false)
      }
    }

    verificar()

    return () => {
      cancelado = true
    }
  }, [location.pathname])

  if (!servidorDisponible) {
    return <ServidorCaido />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <VerificadorServidor>
        <Layout>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/olvide-password" element={<OlvideContrasena />} />
            <Route path="/cambiar-password" element={<CambiarPassword />} />

            <Route
              path="/admin"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <Admin />
                </RutaProtegida>
              }
            />
            <Route
              path="/vecino"
              element={
                <RutaProtegida rolRequerido="Vecino">
                  <Vecino />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/aldeas"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <GestionAldeas />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/areas"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <GestionAreas />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <GestionUsuarios />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/usuarios/vecino"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <CrearVecino />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/usuarios/empleado"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <CrearEmpleadoMunicipal />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/casos"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <AdminCasos />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/reportes"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <Reportes />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/bitacora"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <ReporteBitacora />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/reporte-usuarios"
              element={
                <RutaProtegida rolRequerido="Administrador">
                  <ReporteUsuarios />
                </RutaProtegida>
              }
            />


            <Route
              path="/vecino/perfil"
              element={
                <RutaProtegida rolRequerido="Vecino">
                  <MiPerfil />
                </RutaProtegida>
              }
            />

            <Route
              path="/vecino/casos/nuevo"
              element={
                <RutaProtegida rolRequerido="Vecino">
                  <RegistrarCaso />
                </RutaProtegida>
              }
            />

            <Route
              path="/analista"
              element={
                <RutaProtegida rolRequerido="Analista">
                  <Analista />
                </RutaProtegida>
              }
            />

            <Route
              path="/analista/casos/:id"
              element={
                <RutaProtegida rolRequerido="Analista">
                  <DetalleCasoAnalista />
                </RutaProtegida>
              }
            />

            <Route
              path="/empleado"
              element={
                <RutaProtegida rolRequerido="Empleado">
                  <Operario />
                </RutaProtegida>
              }
            />
            
            <Route
              path="/empleado/casos/:id"
              element={
                <RutaProtegida rolRequerido="Empleado">
                  <DetalleCasoOperario />
                </RutaProtegida>
              }
            />
            <Route
              path="/vecino/casos"
              element={
                <RutaProtegida rolRequerido="Vecino">
                  <MisCasos />
                </RutaProtegida>
              }
            />
          </Routes>
        </Layout>
      </VerificadorServidor>
    </BrowserRouter>
  )
}

export default App