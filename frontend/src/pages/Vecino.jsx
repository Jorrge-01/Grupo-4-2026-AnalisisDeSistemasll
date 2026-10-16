import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquarePlus, ClipboardList, UserCircle, Clock, FileText } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'

function obtenerClaseEstado(estado) {
  const mapa = {
    Asignada: 'bg-blue-100 text-blue-800',
    EnValidacion: 'bg-amber-100 text-amber-800',
    PendienteInformacion: 'bg-orange-100 text-orange-800',
    EnAnalisis: 'bg-purple-100 text-purple-800',
    AsignadaAOperario: 'bg-indigo-100 text-indigo-800',
    EnEjecucion: 'bg-cyan-100 text-cyan-800',
    TrabajoRealizado: 'bg-teal-100 text-teal-800',
    EnVerificacion: 'bg-yellow-100 text-yellow-800',
    Solucionada: 'bg-green-100 text-green-800',
    Reabierta: 'bg-red-100 text-red-800',
    Finalizada: 'bg-emerald-100 text-emerald-800',
    NoProcedente: 'bg-gray-100 text-gray-800',
  }
  return mapa[estado] || 'bg-gray-100 text-gray-800'
}

function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Vecino() {
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem('token')
        const data = await apiFetch('/api/Casos/mis-casos-vecino', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCasos(data)
      } catch {
        setCasos([])
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const activos = casos.filter((c) => !['Solucionada', 'Finalizada', 'NoProcedente'].includes(c.estado)).length
  const resueltos = casos.filter((c) => ['Solucionada', 'Finalizada'].includes(c.estado)).length
  const recientes = casos.slice(0, 4)

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Mi Portal" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Resumen rápido */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--color-azul-piedra)] font-semibold">Total de casos</p>
            <p className="font-display text-3xl font-semibold text-[var(--color-verde-institucional)] mt-1">{casos.length}</p>
          </div>
          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--color-azul-piedra)] font-semibold">En proceso</p>
            <p className="font-display text-3xl font-semibold text-[var(--color-ocre)] mt-1">{activos}</p>
          </div>
          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--color-azul-piedra)] font-semibold">Resueltos</p>
            <p className="font-display text-3xl font-semibold text-green-700 mt-1">{resueltos}</p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Link
            to="/vecino/casos/nuevo"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 hover:shadow-sm transition-all"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Registrar un caso
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Reporta una queja, reclamo, denuncia o sugerencia.
            </p>
          </Link>

          <Link
            to="/vecino/casos"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 hover:shadow-sm transition-all"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <ClipboardList className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Mis casos
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Da seguimiento al estado de tus casos registrados.
            </p>
          </Link>

          <Link
            to="/vecino/perfil"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 hover:shadow-sm transition-all"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <UserCircle className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Mi perfil
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Actualiza tu dirección, aldea y teléfono, o cambia tu contraseña.
            </p>
          </Link>
        </div>

        {/* Casos recientes */}
        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)]">
              Casos recientes
            </h2>
            {casos.length > 0 && (
              <Link to="/vecino/casos" className="text-sm text-[var(--color-ocre)] hover:underline font-medium">
                Ver todos →
              </Link>
            )}
          </div>

          {cargando ? (
            <p className="text-sm text-[var(--color-tinta)]/60 px-6 pb-6">Cargando...</p>
          ) : recientes.length === 0 ? (
            <div className="px-6 pb-8 text-center">
              <FileText className="h-8 w-8 text-[var(--color-azul-piedra)]/30 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-tinta)]/60">Todavía no has registrado ningún caso.</p>
              <Link to="/vecino/casos/nuevo" className="text-sm text-[var(--color-ocre)] hover:underline font-medium">
                Registra tu primer caso →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
              {recientes.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-tinta)]">{c.codigo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${obtenerClaseEstado(c.estado)}`}>
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-tinta)]/60 truncate mt-0.5">
                      {c.area} · {c.descripcion}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-tinta)]/50 flex-shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {formatearFecha(c.fechaRegistro)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}