import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, FileText, Plus } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import DetalleCasoVecino from '../components/DetalleCasoVecino'
import { apiFetch } from '../lib/api'

function obtenerClaseEstado(estado) {
  const mapa = {
    Registrada: 'bg-slate-100 text-slate-800',
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

const FILTROS = [
  { valor: 'Todos', label: 'Todos' },
  { valor: 'activos', label: 'En proceso' },
  { valor: 'Solucionada', label: 'Resueltos' },
]

const ESTADOS_ACTIVOS = ['Registrada', 'Asignada', 'EnValidacion', 'PendienteInformacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion']
const ESTADOS_RESUELTOS = ['Solucionada', 'Finalizada']

export default function MisCasos() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState(null)

  async function cargarCasos() {
    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch('/api/Casos/mis-casos-vecino', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCasos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus casos.')
    }
  }

  useEffect(() => {
    async function iniciar() {
      setCargando(true)
      setError('')
      await cargarCasos()
      setCargando(false)
    }
    iniciar()
  }, [])

  const casosFiltrados = casos.filter((c) => {
    if (filtro === 'Todos') return true
    if (filtro === 'activos') return ESTADOS_ACTIVOS.includes(c.estado)
    if (filtro === 'Solucionada') return ESTADOS_RESUELTOS.includes(c.estado)
    return true
  })

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Mis casos" />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/vecino')}
            className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors"
          >
            ← Volver a mi portal
          </button>

          <Link
            to="/vecino/casos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--color-ocre)] text-white text-sm font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar caso
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                filtro === f.valor
                  ? 'bg-[var(--color-verde-institucional)] text-white border-[var(--color-verde-institucional)]'
                  : 'border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)] hover:border-[var(--color-ocre)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>
        )}

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          {cargando ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">Cargando...</p>
          ) : casosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-8 w-8 text-[var(--color-azul-piedra)]/30 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-tinta)]/60">
                {casos.length === 0 ? 'Todavía no has registrado ningún caso.' : 'No hay casos con este filtro.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
              {casosFiltrados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCasoSeleccionadoId(c.id)}
                    className="w-full flex items-center justify-between px-6 py-4 gap-4 hover:bg-[var(--color-piedra)]/50 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--color-tinta)]">{c.codigo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${obtenerClaseEstado(c.estado)}`}>
                          {c.estado}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-azul-piedra)] mt-0.5">{c.area}</p>
                      <p className="text-sm text-[var(--color-tinta)]/60 truncate mt-0.5">{c.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-tinta)]/50 flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {formatearFecha(c.fechaRegistro)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {casoSeleccionadoId && (
        <DetalleCasoVecino
          casoId={casoSeleccionadoId}
          onCerrar={() => setCasoSeleccionadoId(null)}
          onActualizado={cargarCasos}
        />
      )}
    </div>
  )
}