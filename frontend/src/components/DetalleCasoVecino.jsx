import { useEffect, useState } from 'react'
import { FileText, X, MapPin, Phone, Paperclip, Clock, CheckCircle2 } from 'lucide-react'
import SubidaEvidencia from './SubidaEvidencia'
import ProgresoCaso from './ProgresoCaso'
import { infoEstado } from '../lib/estadoCaso'
import { apiFetch, API_BASE_URL } from '../lib/api'

function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DetalleCasoVecino({ casoId, onCerrar, onActualizado }) {
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(true)

  const [respuestaInformacion, setRespuestaInformacion] = useState('')
  const [fotosRespuesta, setFotosRespuesta] = useState([])
  const [documentoRespuesta, setDocumentoRespuesta] = useState(null)
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)
  const [mensajeRespuesta, setMensajeRespuesta] = useState('')

  async function cargarDetalle(id) {
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

  useEffect(() => {
    setCargandoDetalle(true)
    setDetalle(null)
    setRespuestaInformacion('')
    setFotosRespuesta([])
    setDocumentoRespuesta(null)
    setMensajeRespuesta('')
    cargarDetalle(casoId)
  }, [casoId])

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

      await cargarDetalle(detalle.id)
      if (onActualizado) await onActualizado()
    } catch (err) {
      setMensajeRespuesta(err.message || 'No se pudo enviar la respuesta.')
    } finally {
      setEnviandoRespuesta(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
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
              <button onClick={onCerrar} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
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
              <button onClick={onCerrar} className="text-[var(--color-tinta)]/50 hover:text-[var(--color-tinta)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4">
              <div className="rounded-lg border border-[var(--color-azul-piedra)]/15 bg-white/50 p-4 space-y-4">
                <ProgresoCaso etapa={infoEstado(detalle.estado).etapa} />
                <div className="text-center space-y-1">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${infoEstado(detalle.estado).clase}`}>
                    {infoEstado(detalle.estado).etiqueta}
                  </span>
                  <p className="text-sm text-[var(--color-tinta)]/80">{infoEstado(detalle.estado).descripcion}</p>
                </div>
              </div>

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

                  {detalle.seguimiento && detalle.seguimiento.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-[var(--color-azul-piedra)]" />
                        <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">
                          Seguimiento del caso
                        </p>
                      </div>

                      <div className="space-y-4">
                        {detalle.seguimiento.map((evento, index) => (
                          <div
                            key={`${evento.tipo}-${evento.fecha}-${index}`}
                            className="flex gap-3"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </div>

                              {index < detalle.seguimiento.length - 1 && (
                                <div className="mt-1 w-px flex-1 bg-gray-200" />
                              )}
                            </div>

                            <div className="flex-1 pb-2">
                              <p className="text-sm font-medium text-[var(--color-tinta)]">
                                {evento.tipo}
                              </p>

                              <p className="mt-1 text-sm leading-5 text-[var(--color-tinta)]/70 whitespace-pre-wrap">
                                {evento.detalle}
                              </p>

                              <p className="mt-1 text-xs text-[var(--color-tinta)]/45">
                                {formatearFecha(evento.fecha)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
  )
}