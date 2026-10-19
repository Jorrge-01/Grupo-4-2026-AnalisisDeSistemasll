import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquarePlus, ArrowRight, Clock, FileText } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'
import DetalleCasoVecino from '../components/DetalleCasoVecino'
import { infoEstado } from '../lib/estadoCaso'

function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Vecino() {
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState(null)

  async function cargar() {
    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch('/api/Casos/mis-casos-vecino', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCasos(Array.isArray(data) ? data : [])
    } catch {
      setCasos([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const activos = casos.filter((c) => !['Solucionada', 'Finalizada', 'NoProcedente'].includes(c.estado)).length
  const resueltos = casos.filter((c) => ['Solucionada', 'Finalizada'].includes(c.estado)).length
  const recientes = casos.slice(0, 4)

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Mi Portal" />

      <main className="max-w-6xl mx-auto px-6 py-10">
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

        <Link
          to="/vecino/casos/nuevo"
          className="group flex flex-col sm:flex-row sm:items-center gap-5 bg-[var(--color-verde-institucional)] rounded-lg p-6 sm:p-8 mb-10 hover:opacity-95 transition-opacity"
        >
          <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <MessageSquarePlus className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold text-white mb-1">
              ¿Tienes un problema en tu comunidad?
            </p>
            <p className="text-sm text-white/80">
              Reporta una queja, reclamo, denuncia o sugerencia y dale seguimiento desde aquí.
            </p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-ocre)] px-5 py-2.5 text-sm font-semibold text-white group-hover:brightness-110 transition-all flex-shrink-0">
            Registrar un caso
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

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
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCasoSeleccionadoId(c.id)}
                    className="w-full flex items-center justify-between px-6 py-4 gap-4 hover:bg-[var(--color-piedra)]/50 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-tinta)]">{c.codigo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${infoEstado(c.estado).clase}`}>
                          {infoEstado(c.estado).etiqueta}
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
          onActualizado={cargar}
        />
      )}
    </div>
  )
}