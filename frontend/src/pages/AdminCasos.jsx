import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Search, X, MapPin, Phone ,History } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import EvidenciaCaso from '../components/EvidenciaCaso'
import GraficosCasos from '../components/GraficosCasos'
import { apiFetch } from '../lib/api'

const ESTADOS_ACTIVOS = ['Asignada', 'EnValidacion', 'PendienteInformacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion', 'Reabierta']
const ESTADOS_RESUELTOS = ['Solucionada', 'Finalizada']

const ESTADOS_ORDEN = ['Registrada', 'Asignada', 'EnValidacion', 'PendienteInformacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion', 'Solucionada', 'Reabierta', 'Finalizada', 'NoProcedente']

const ESTADO_COLORES = {
  Registrada: '#94a3b8',
  Asignada: '#3b82f6',
  EnValidacion: '#f59e0b',
  PendienteInformacion: '#f97316',
  EnAnalisis: '#a855f7',
  AsignadaAOperario: '#6366f1',
  EnEjecucion: '#06b6d4',
  TrabajoRealizado: '#14b8a6',
  EnVerificacion: '#eab308',
  Solucionada: '#22c55e',
  Reabierta: '#ef4444',
  Finalizada: '#10b981',
  NoProcedente: '#6b7280',
}

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

function formatearFechaHora(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminCasos() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroArea, setFiltroArea] = useState('Todos')
  const [filtroAldea, setFiltroAldea] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [personal, setPersonal] = useState([])

  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [casoSolucionId, setCasoSolucionId] = useState(null)
  const [solucion, setSolucion] = useState(null)
  const [cargandoSolucion, setCargandoSolucion] = useState(false)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        const data = await apiFetch('/api/Casos', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCasos(data)
        try {
          const carga = await apiFetch('/api/reportes/carga-personal', {
            headers: { Authorization: `Bearer ${token}` },
          })
          setPersonal(carga.registros || [])
        } catch {
          setPersonal([])
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los casos.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  async function abrirDetalle(id) {
    setCasoSeleccionadoId(id)
    setCargandoDetalle(true)
    setDetalle(null)

    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch(`/api/Casos/${id}/admin-detalle`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDetalle(data)
    } catch (err) {
      setDetalle({ error: err.message || 'No se pudo cargar el detalle del caso.' })
    } finally {
      setCargandoDetalle(false)
    }
  }

  function cerrarDetalle() {
    setCasoSeleccionadoId(null)
    setDetalle(null)
  }

  async function abrirSolucion(id) {
    setCasoSolucionId(id)
    setCargandoSolucion(true)
    setSolucion(null)

    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch(`/api/Casos/${id}/solucion`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSolucion(data)
    } catch (err) {
      setSolucion({ error: err.message || 'No se pudo cargar la solución del caso.' })
    } finally {
      setCargandoSolucion(false)
    }
  }

  function cerrarSolucion() {
    setCasoSolucionId(null)
    setSolucion(null)
  }

  const areasDisponibles = useMemo(() => {
    return [...new Set(casos.map((c) => c.area))].sort()
  }, [casos])

  const aldeasDisponibles = useMemo(() => {
    return [...new Set(casos.map((c) => c.aldea))].sort()
  }, [casos])

  const casosBase = useMemo(() => {
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null
    return casos.filter((c) => {
      if (filtroEstado !== 'Todos' && c.estado !== filtroEstado) return false
      if (filtroArea !== 'Todos' && c.area !== filtroArea) return false
      if (filtroAldea !== 'Todos' && c.aldea !== filtroAldea) return false
      const fecha = new Date(c.fechaRegistro)
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false
      return true
    })
  }, [casos, filtroEstado, filtroArea, filtroAldea, fechaDesde, fechaHasta])

  const hayFiltros = filtroEstado !== 'Todos' || filtroArea !== 'Todos' || filtroAldea !== 'Todos' || fechaDesde || fechaHasta

  function limpiarFiltros() {
    setFiltroEstado('Todos')
    setFiltroArea('Todos')
    setFiltroAldea('Todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  const totalCasos = casos.length
  const totalActivos = casos.filter((c) => ESTADOS_ACTIVOS.includes(c.estado)).length
  const totalResueltos = casos.filter((c) => ESTADOS_RESUELTOS.includes(c.estado)).length
  const totalPendientesInfo = casos.filter((c) => c.estado === 'PendienteInformacion').length

  const casosFiltrados = casosBase.filter((c) => {
    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase()
      return c.codigo.toLowerCase().includes(texto) || c.descripcion.toLowerCase().includes(texto)
    }
    return true
  })

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Gestión de casos" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors mb-6"
        >
          ← Volver al panel
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>
        )}

        {cargando ? (
          <p className="text-sm text-[var(--color-tinta)]/60">Cargando...</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-[var(--color-verde-institucional)]" />
                  <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Total de casos</p>
                </div>
                <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">{totalCasos}</p>
              </div>

              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-cyan-600" />
                  <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">En proceso</p>
                </div>
                <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">{totalActivos}</p>
              </div>

              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Resueltos</p>
                </div>
                <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">{totalResueltos}</p>
              </div>

              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Pendientes de información</p>
                </div>
                <p className="text-2xl font-display font-semibold text-[var(--color-tinta)]">{totalPendientesInfo}</p>
              </div>
            </div>

            <GraficosCasos casos={casos} estadosOrden={ESTADOS_ORDEN} estadoColores={ESTADO_COLORES} personal={personal} />

            <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
              <div className="p-4 border-b border-[var(--color-azul-piedra)]/15">
                <div className="relative">
                  <Search className="h-4 w-4 text-[var(--color-tinta)]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por código o descripción..."
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-3 mt-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Estado</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30">
                      <option value="Todos">Todos los estados</option>
                      {ESTADOS_ORDEN.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Área</label>
                    <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30">
                      <option value="Todos">Todas las áreas</option>
                      {areasDisponibles.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Aldea</label>
                    <select value={filtroAldea} onChange={(e) => setFiltroAldea(e.target.value)} className="px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30">
                      <option value="Todos">Todas las aldeas</option>
                      {aldeasDisponibles.map((aldea) => (
                        <option key={aldea} value={aldea}>{aldea}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Desde</label>
                    <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Hasta</label>
                    <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-ocre)]/30" />
                  </div>
                  {hayFiltros && (
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--color-tinta)]/50 mt-3">
                  Mostrando {casosFiltrados.length} de {casos.length} casos. Estos filtros solo afectan a la tabla.
                </p>
              </div>

              {casosFiltrados.length === 0 ? (
                <p className="text-sm text-[var(--color-tinta)]/60 p-6">No hay casos con estos filtros.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 border-b border-[var(--color-azul-piedra)]/15">
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Área</th>
                        <th className="px-4 py-3">Aldea</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Analista</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-azul-piedra)]/10">
                      {casosFiltrados.map((c) => (
                        <tr key={c.id} className="hover:bg-[var(--color-piedra)]/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--color-tinta)]">{c.codigo}</td>
                          <td className="px-4 py-3 text-[var(--color-tinta)]/80">{c.area}</td>
                          <td className="px-4 py-3 text-[var(--color-tinta)]/80">{c.aldea}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${obtenerClaseEstado(c.estado)}`}>
                              {c.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-tinta)]/80">{c.analista || '-'}</td>
                          <td className="px-4 py-3 text-[var(--color-tinta)]/60">{formatearFecha(c.fechaRegistro)}</td>
                          <td className="px-4 py-3">
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={() => abrirDetalle(c.id)}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
    >
      <History className="h-3 w-3" />
      Historial
    </button>
    <button
      type="button"
      onClick={() => abrirSolucion(c.id)}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-verde-institucional)] bg-[var(--color-verde-institucional)]/10 hover:bg-[var(--color-verde-institucional)]/20 transition-colors"
    >
      <CheckCircle2 className="h-3 w-3" />
      Solución
    </button>
  </div>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {casoSeleccionadoId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={cerrarDetalle}
        >
          <div
            className="bg-[var(--color-piedra-clara)] rounded-lg max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {cargandoDetalle ? (
              <div className="p-10 text-center">
                <p className="text-sm text-[var(--color-tinta)]/60">Cargando detalle...</p>
              </div>
            ) : detalle?.error ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)]">Error</h3>
                  <button onClick={cerrarDetalle} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-red-600">{detalle.error}</p>
              </div>
            ) : detalle ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-azul-piedra)]/15">
                  <div>
                    <p className="text-xs text-[var(--color-tinta)]/50">Caso</p>
                    <h3 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)]">
                      {detalle.codigo}
                    </h3>
                  </div>
                  <button onClick={cerrarDetalle} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto space-y-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${obtenerClaseEstado(detalle.estado)}`}>
                    {detalle.estado}
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Área</p>
                      <p className="text-[var(--color-tinta)] mt-0.5">{detalle.area}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Aldea</p>
                      <p className="text-[var(--color-tinta)] mt-0.5">{detalle.aldea}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Vecino</p>
                      <p className="text-[var(--color-tinta)] mt-0.5">{detalle.vecino || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Analista</p>
                      <p className="text-[var(--color-tinta)] mt-0.5">{detalle.analista || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Operario</p>
                      <p className="text-[var(--color-tinta)] mt-0.5">{detalle.operario || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-[var(--color-azul-piedra)] mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--color-tinta)]">{detalle.direccion}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--color-azul-piedra)] flex-shrink-0" />
                    <span className="text-[var(--color-tinta)]">{detalle.telefonoContacto}</span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">Descripción</p>
                    <div className="rounded-md bg-white/50 border border-[var(--color-azul-piedra)]/10 p-3">
                      <p className="text-sm text-[var(--color-tinta)] whitespace-pre-wrap">{detalle.descripcion}</p>
                    </div>
                  </div>

                  {detalle.archivos && detalle.archivos.length > 0 && (
                    <EvidenciaCaso archivos={detalle.archivos} compacto />
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-2">Historial</p>
                    <div className="space-y-3">
                      {detalle.historial.map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center pt-1">
                            <div className="h-2 w-2 rounded-full bg-[var(--color-ocre)]" />
                            {i < detalle.historial.length - 1 && (
                              <div className="w-px flex-1 bg-[var(--color-azul-piedra)]/20 mt-1" />
                            )}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-[var(--color-tinta)]">{item.tipo}</p>
                              <span className="text-xs text-[var(--color-tinta)]/50">{formatearFechaHora(item.fecha)}</span>
                            </div>
                            {item.actor && (
                              <p className="text-xs text-[var(--color-azul-piedra)] mt-0.5">{item.actor}</p>
                            )}
                            {item.detalle && (
                              <p className="text-sm text-[var(--color-tinta)]/80 mt-1 whitespace-pre-wrap">{item.detalle}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {casoSolucionId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={cerrarSolucion}
        >
          <div
            className="bg-[var(--color-piedra-clara)] rounded-lg max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {cargandoSolucion ? (
              <div className="p-10 text-center">
                <p className="text-sm text-[var(--color-tinta)]/60">Cargando solución...</p>
              </div>
            ) : solucion?.error ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)]">Error</h3>
                  <button onClick={cerrarSolucion} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-red-600">{solucion.error}</p>
              </div>
            ) : solucion ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-azul-piedra)]/15">
                  <div>
                    <p className="text-xs text-[var(--color-tinta)]/50">Solución del caso</p>
                    <h3 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)]">
                      {solucion.codigo}
                    </h3>
                  </div>
                  <button onClick={cerrarSolucion} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto space-y-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${obtenerClaseEstado(solucion.estado)}`}>
                    {solucion.estado}
                  </span>

                  {solucion.resultadoTrabajo ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50 mb-1">
                        Resultado del trabajo {solucion.fechaTrabajo && `· ${formatearFecha(solucion.fechaTrabajo)}`}
                      </p>
                      <div className="rounded-md bg-white/50 border border-[var(--color-azul-piedra)]/10 p-3">
                        <p className="text-sm text-[var(--color-tinta)] whitespace-pre-wrap">{solucion.resultadoTrabajo}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-tinta)]/60">Este caso todavía no tiene un trabajo registrado.</p>
                  )}

                  {solucion.archivos && solucion.archivos.length > 0 && (
                    <EvidenciaCaso archivos={solucion.archivos} compacto />
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}