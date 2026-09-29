import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, LayoutGrid, MapPin, BarChart3, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'

const ESTADOS_ACTIVOS = ['Asignada', 'EnValidacion', 'PendienteInformacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion', 'Reabierta']
const ESTADOS_RESUELTOS = ['Solucionada', 'Finalizada']

function diasDesde(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24))
  return dias
}

export default function Admin() {
  const [casos, setCasos] = useState([])
  const [usuariosPorRol, setUsuariosPorRol] = useState([])
  const [cargandoStats, setCargandoStats] = useState(true)

  useEffect(() => {
    async function cargarStats() {
      setCargandoStats(true)
      try {
        const token = localStorage.getItem('token')
        const [casosData, rolesData] = await Promise.all([
          apiFetch('/api/Casos', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch('/api/Usuarios/conteo-por-rol', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setCasos(casosData)
        setUsuariosPorRol(rolesData)
      } catch {
        setCasos([])
        setUsuariosPorRol([])
      } finally {
        setCargandoStats(false)
      }
    }
    cargarStats()
  }, [])

  const totalCasos = casos.length
  const totalActivos = casos.filter((c) => ESTADOS_ACTIVOS.includes(c.estado)).length
  const totalResueltos = casos.filter((c) => ESTADOS_RESUELTOS.includes(c.estado)).length
  const totalPendientesInfo = casos.filter((c) => c.estado === 'PendienteInformacion').length

  const casosMasAntiguos = useMemo(() => {
    return casos
      .filter((c) => ESTADOS_ACTIVOS.includes(c.estado))
      .sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro))
      .slice(0, 5)
  }, [casos])

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Panel de Administración" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-[var(--color-verde-institucional)]" />
              <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Total de casos</p>
            </div>
            <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">
              {cargandoStats ? '-' : totalCasos}
            </p>
          </div>

          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cyan-600" />
              <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">En proceso</p>
            </div>
            <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">
              {cargandoStats ? '-' : totalActivos}
            </p>
          </div>

          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Resueltos</p>
            </div>
            <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">
              {cargandoStats ? '-' : totalResueltos}
            </p>
          </div>

          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Pendientes de información</p>
            </div>
            <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">
              {cargandoStats ? '-' : totalPendientesInfo}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {!cargandoStats && casosMasAntiguos.length > 0 && (
            <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-orange-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-semibold text-[var(--color-tinta)]">Casos con más tiempo sin resolver</p>
              </div>
              <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
                {casosMasAntiguos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-[var(--color-tinta)]">{c.codigo}</span>
                      <span className="text-[var(--color-tinta)]/60 ml-2">{c.area}</span>
                    </div>
                    <span className="text-xs text-orange-700 font-medium flex-shrink-0 ml-3">
                      {diasDesde(c.fechaRegistro)} días
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!cargandoStats && usuariosPorRol.length > 0 && (
            <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-[var(--color-verde-institucional)]" />
                <p className="text-sm font-semibold text-[var(--color-tinta)]">Usuarios por rol</p>
              </div>
              <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
                {usuariosPorRol.map((r) => (
                  <li key={r.rol} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-[var(--color-tinta)]">{r.rol}</span>
                    <span className="font-semibold text-[var(--color-verde-institucional)]">{r.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/usuarios"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Usuarios
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Crear y administrar vecinos, analistas, empleados y administradores.
            </p>
          </Link>

          <Link
            to="/admin/areas"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <LayoutGrid className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Áreas
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Administrar el catálogo de áreas municipales y su aplicabilidad.
            </p>
          </Link>

          <Link
            to="/admin/aldeas"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <MapPin className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Aldeas y comunidades
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Administrar el catálogo de aldeas y comunidades del municipio.
            </p>
          </Link>

          <Link
            to="/admin/casos"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <ClipboardList className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Gestión de casos
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Casos por categoría, estado y tiempo de resolución.
            </p>
          </Link>

          <Link
            to="/admin/reportes"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Reportes
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Reportes de gestión, cumplimiento de SLA y auditoría.
            </p>
          </Link>
        </div>

        <p className="text-sm text-[var(--color-tinta)]/50 mt-8">
          Selecciona una sección para gestionarla.
        </p>
      </main>
    </div>
  )
}