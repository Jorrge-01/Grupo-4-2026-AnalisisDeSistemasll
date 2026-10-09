import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, FileText, Plus, X, MapPin, Phone, Paperclip } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import SubidaEvidencia from '../components/SubidaEvidencia'
import { apiFetch, API_BASE_URL } from '../lib/api'

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

const FILTROS = [
  { valor: 'Todos', label: 'Todos' },
  { valor: 'activos', label: 'En proceso' },
  { valor: 'Solucionada', label: 'Resueltos' },
]

const ESTADOS_ACTIVOS = ['Asignada', 'EnValidacion', 'PendienteInformacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion', 'Reabierta']
const ESTADOS_RESUELTOS = ['Solucionada', 'Finalizada']

export default function MisCasos() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [respuestaInformacion, setRespuestaInformacion] = useState('')
  const [fotosRespuesta, setFotosRespuesta] = useState([])
  const [documentoRespuesta, setDocumentoRespuesta] = useState(null)
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)
  const [mensajeRespuesta, setMensajeRespuesta] = useState('')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        const data = await apiFetch('/api/Casos/mis-casos-vecino', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCasos(data)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar tus casos.')
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
    setRespuestaInformacion('')
    setFotosRespuesta([])
    setDocumentoRespuesta(null)
    setMensajeRespuesta('')

    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch(`/api/Casos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDetalle(data)
    } catch (err) {
      setDetalle({ error: err.message || 'No se pudo cargar el detalle del caso.' })
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function responderInformacion() {
    if (!respuestaInformacion.trim()) {
      setMensajeRespuesta('Debes escribir una respuesta.')
      return
    }

    setEnviandoRespuesta(true)
    setMensajeRespuesta('')

    try {
      const token = localStorage.getItem('token')

      const formData = new FormData()
      formData.append('respuesta', respuestaInformacion.trim())
      fotosRespuesta.forEach((foto) => {
        if (foto?.file) formData.append('archivos', foto.file)
      })
      if (documentoRespuesta) {
        formData.append('archivos', documentoRespuesta)
      }

      const res = await fetch(`${API_BASE_URL}/api/Casos/${detalle.id}/responder-informacion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.mensaje || 'No se pudo enviar la respuesta.')
      }

      setMensajeRespuesta(data.mensaje || 'La información fue enviada correctamente.')
      setRespuestaInformacion('')
      setFotosRespuesta([])
      setDocumentoRespuesta(null)

      await abrirDetalle(detalle.id)

      const casosActualizados = await apiFetch('/api/Casos/mis-casos-vecino', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCasos(casosActualizados)
    } catch (err) {
      setMensajeRespuesta(err.message || 'No se pudo enviar la respuesta.')
    } finally {
      setEnviandoRespuesta(false)
    }
  }

  function cerrarDetalle() {
    setCasoSeleccionadoId(null)
    setDetalle(null)
  }

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
                    onClick={() => abrirDetalle(c.id)}
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={cerrarDetalle}
        >
          <div
            className="bg-[var(--color-piedra-clara)] rounded-lg max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {cargandoDetalle ? (
              <div className="p-10 text-center">
                <p className="text-sm text-[var(--color-tinta)]/60">Cargando detalle...</p>
              </div>
            ) : detalle?.error ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)]">
                    Error
                  </h3>
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

                  {detalle.estado === 'PendienteInformacion' && detalle.solicitudInformacion && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-orange-700 font-semibold mb-1">
                          Información solicitada
                        </p>
                        <p className="text-sm text-orange-900 whitespace-pre-wrap">
                          {detalle.solicitudInformacion}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wide text-orange-700 font-semibold mb-1">
                          Tu respuesta
                        </label>

                        <textarea
                          value={respuestaInformacion}
                          onChange={(e) => setRespuestaInformacion(e.target.value)}
                          maxLength={2000}
                          rows={4}
                          placeholder="Escribe aquí la información solicitada por el analista..."
                          className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm text-[var(--color-tinta)] outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                          disabled={enviandoRespuesta}
                        />

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-[var(--color-tinta)]/50">
                            {respuestaInformacion.length}/2000
                          </span>
                        </div>

                        <div className="mt-3">
                          <SubidaEvidencia
                            fotos={fotosRespuesta}
                            setFotos={setFotosRespuesta}
                            documento={documentoRespuesta}
                            setDocumento={setDocumentoRespuesta}
                          />
                        </div>

                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            onClick={responderInformacion}
                            disabled={enviandoRespuesta || !respuestaInformacion.trim()}
                            className="px-4 py-2 rounded-md bg-[var(--color-ocre)] text-white text-sm font-semibold hover:bg-[var(--color-ocre-claro)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {enviandoRespuesta ? 'Enviando...' : 'Enviar información'}
                          </button>
                        </div>
                      </div>

                      {mensajeRespuesta && (
                        <p className="text-sm text-[var(--color-verde-institucional)] bg-white/60 border border-green-200 rounded-md px-3 py-2">
                          {mensajeRespuesta}
                        </p>
                      )}
                    </div>
                  )}

                  {detalle.archivos && detalle.archivos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Paperclip className="h-4 w-4 text-[var(--color-azul-piedra)]" />
                        <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">
                          Evidencia adjunta ({detalle.archivos.length})
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {detalle.archivos.map((archivo) => {
                          const esImagen = archivo.tipoContenido?.startsWith('image/')
                          return (
                            <a
                              key={archivo.id}
                              href={archivo.rutaArchivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group"
                            >
                              {esImagen ? (
                                <div className="h-20 rounded-md overflow-hidden border border-[var(--color-azul-piedra)]/20 group-hover:border-[var(--color-ocre)] transition-colors">
                                  <img src={archivo.rutaArchivo} alt={archivo.nombreArchivo} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="h-20 rounded-md border border-[var(--color-azul-piedra)]/20 bg-white/50 flex flex-col items-center justify-center gap-1 px-1 group-hover:border-[var(--color-ocre)] transition-colors">
                                  <FileText className="h-5 w-5 text-[var(--color-ocre)]" />
                                  <span className="text-[10px] text-[var(--color-tinta)] text-center truncate max-w-full">
                                    {archivo.nombreArchivo}
                                  </span>
                                </div>
                              )}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[var(--color-tinta)]/50 pt-2 border-t border-[var(--color-azul-piedra)]/10">
                    Registrado el {formatearFecha(detalle.fechaRegistro)}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}