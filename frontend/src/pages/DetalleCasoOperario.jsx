import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  FileText,
} from 'lucide-react'

import HeaderInterno from '../components/HeaderInterno'
import SubidaEvidencia from '../components/SubidaEvidencia'
import { apiFetch, API_BASE_URL } from '../lib/api'

function obtenerClaseEstado(estado) {
  switch (estado) {
    case 'AsignadaAOperario':
      return 'bg-indigo-100 text-indigo-800'

    case 'EnEjecucion':
      return 'bg-cyan-100 text-cyan-800'

    case 'TrabajoRealizado':
      return 'bg-teal-100 text-teal-800'

    case 'EnVerificacion':
      return 'bg-yellow-100 text-yellow-800'

    case 'Solucionada':
      return 'bg-green-100 text-green-800'

    case 'Reabierta':
      return 'bg-red-100 text-red-800'

    case 'Finalizada':
      return 'bg-emerald-100 text-emerald-800'

    case 'NoProcedente':
      return 'bg-gray-100 text-gray-800'

    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatearFecha(fecha) {
  if (!fecha) return '-'

  return new Date(fecha).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function DetalleCasoOperario() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caso, setCaso] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [resultadoTrabajo, setResultadoTrabajo] = useState('')
  const [procesandoTrabajo, setProcesandoTrabajo] = useState(false)
  const [fotosTrabajo, setFotosTrabajo] = useState([])

  async function cargarDetalle() {
    try {
      setCargando(true)
      setError('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(
        `/api/Casos/${id}/detalle-operario`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setCaso(data)
    } catch (err) {
      setError(
        err.message ||
          'No se pudo cargar el detalle del caso.'
      )
    } finally {
      setCargando(false)
    }
  }

  async function iniciarTrabajo() {
    try {
      setProcesando(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(
        `/api/Casos/${id}/iniciar-trabajo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setMensaje(data.mensaje)

      await cargarDetalle()
    } catch (err) {
      setError(
        err.message || 'No se pudo iniciar el trabajo.'
      )
    } finally {
      setProcesando(false)
    }
  }

  async function registrarTrabajo() {
    if (!resultadoTrabajo.trim()) {
      setError('Debe describir el trabajo realizado.')
      return
    }

    if (resultadoTrabajo.length > 2000) {
      setError(
        'El resultado no puede superar los 2000 caracteres.'
      )
      return
    }

    try {
      setProcesandoTrabajo(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const formData = new FormData()
      formData.append('resultado', resultadoTrabajo.trim())
      fotosTrabajo.forEach((foto) => formData.append('archivos', foto))

      const res = await fetch(`${API_BASE_URL}/api/Casos/${id}/registrar-trabajo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.mensaje || 'No se pudo registrar el trabajo.')
      }

      setMensaje(data.mensaje)
      setResultadoTrabajo('')
      setFotosTrabajo([])

      await cargarDetalle()
    } catch (err) {
      setError(
        err.message || 'No se pudo registrar el trabajo.'
      )
    } finally {
      setProcesandoTrabajo(false)
    }
  }

  useEffect(() => {
    cargarDetalle()
  }, [id])

  if (cargando) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
        <HeaderInterno titulo="Detalle del caso" />

        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-10 text-center">

            <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[var(--color-verde-institucional)]" />

            <p className="text-sm text-[var(--color-tinta)]/60 mt-3">
              Cargando información del caso...
            </p>

          </div>
        </main>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
        <HeaderInterno titulo="Detalle del caso" />

        <main className="max-w-5xl mx-auto px-6 py-10">

          <button
            onClick={() => navigate('/empleado')}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-verde-institucional)] hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mis casos
          </button>

          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">

            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />

            <div>
              <p className="font-medium">
                No se pudo cargar el caso
              </p>

              <p className="text-sm mt-1">
                {error ||
                  'El caso no existe o no está asignado a este operario.'}
              </p>
            </div>

          </div>

        </main>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">

      <HeaderInterno titulo="Detalle del caso" />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* VOLVER */}
        <Link
          to="/empleado"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-verde-institucional)] hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis casos
        </Link>

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">

          {/* ENCABEZADO */}
          <div className="p-6 border-b border-[var(--color-azul-piedra)]/10">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>
                <p className="text-sm text-[var(--color-tinta)]/60">
                  Caso
                </p>

                <h1 className="font-display text-3xl font-semibold text-[var(--color-verde-institucional)] mt-1">
                  {caso.codigo}
                </h1>
              </div>

              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium self-start sm:self-auto ${obtenerClaseEstado(caso.estado)}`}
              >
                <Clock className="h-4 w-4" />

                {caso.estado}
              </span>

            </div>

          </div>

          {/* INFORMACIÓN DEL CASO */}
          <div className="p-6">

            <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)] mb-5">
              Información del caso
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ÁREA */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Área
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.area || '-'}
                </p>
              </div>

              {/* ALDEA */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Aldea
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.aldea || '-'}
                </p>
              </div>

              {/* DIRECCIÓN */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Dirección
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.direccion || '-'}
                </p>
              </div>

              {/* TELÉFONO */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Teléfono de contacto
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.telefonoContacto || '-'}
                </p>
              </div>

              {/* FECHA */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Fecha de registro
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {formatearFecha(caso.fechaRegistro)}
                </p>
              </div>

            </div>

            {/* DESCRIPCIÓN */}
            <div className="mt-8">

              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                Descripción del caso
              </p>

              <div className="mt-2 rounded-lg border border-[var(--color-azul-piedra)]/10 bg-white/50 p-4">

                <p className="text-sm leading-6 text-[var(--color-tinta)] whitespace-pre-wrap">
                  {caso.descripcion || '-'}
                </p>

              </div>

            </div>

            {/* EVIDENCIA ADJUNTA */}
            {caso.archivos && caso.archivos.length > 0 && (
              <div className="mt-8">

                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-[var(--color-azul-piedra)]" />
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                    Evidencia adjunta ({caso.archivos.length})
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {caso.archivos.map((archivo) => {
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
                          <div className="h-28 rounded-lg overflow-hidden border border-[var(--color-azul-piedra)]/20 group-hover:border-[var(--color-ocre)] transition-colors">
                            <img
                              src={archivo.rutaArchivo}
                              alt={archivo.nombreArchivo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-28 rounded-lg border border-[var(--color-azul-piedra)]/20 bg-white/50 flex flex-col items-center justify-center gap-1.5 px-2 group-hover:border-[var(--color-ocre)] transition-colors">
                            <FileText className="h-6 w-6 text-[var(--color-ocre)]" />
                            <span className="text-xs text-[var(--color-tinta)] text-center truncate max-w-full">
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

            {/* INSTRUCCIÓN DE TRABAJO */}
            <div className="mt-8">

              <div className="flex items-center gap-2 mb-2">

                <ClipboardList className="h-4 w-4 text-[var(--color-verde-institucional)]" />

                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Instrucción de trabajo
                </p>

              </div>

              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">

                <p className="text-sm leading-6 text-indigo-900 whitespace-pre-wrap">
                  {caso.instruccion || '-'}
                </p>

              </div>

            </div>

            {/* CORRECCIÓN SOLICITADA */}
            {caso.estado === 'EnEjecucion' && caso.correccion && (
              <div className="mt-6">

                <div className="flex items-center gap-2 mb-2">

                  <MessageSquare className="h-4 w-4 text-amber-700" />

                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                    Corrección solicitada por el analista
                  </p>

                </div>

                <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">

                  <div className="flex items-start gap-3">

                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-700" />

                    <p className="text-sm leading-6 text-amber-900 whitespace-pre-wrap">
                      {caso.correccion}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ACCIONES */}
          <div className="border-t border-[var(--color-azul-piedra)]/10 p-6">

            <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)] mb-2">
              Acciones
            </h2>

            <p className="text-sm text-[var(--color-tinta)]/60 mb-5">
              Las acciones disponibles dependerán del estado actual del caso.
            </p>

            {/* MENSAJE DE ÉXITO */}
            {mensaje && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Operación realizada
                    </p>

                    <p className="text-sm mt-1">
                      {mensaje}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* MENSAJE DE ERROR */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">

                <div className="flex items-start gap-3">

                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      No se pudo completar la operación
                    </p>

                    <p className="text-sm mt-1">
                      {error}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* ASIGNADA A OPERARIO */}
            {caso.estado === 'AsignadaAOperario' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                <div className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-800">

                  <div className="flex items-start gap-3">

                    <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                    <div>
                      <p className="font-medium">
                        Caso pendiente de ejecución
                      </p>

                      <p className="text-sm mt-1">
                        Revisa la instrucción de trabajo antes de iniciar la atención del caso.
                      </p>
                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={iniciarTrabajo}
                  disabled={procesando}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-verde-institucional)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Iniciar trabajo
                    </>
                  )}
                </button>

              </div>
            )}

            {/* EN EJECUCIÓN */}
            {caso.estado === 'EnEjecucion' && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-cyan-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div className="flex-1">

                    <p className="font-medium">
                      Trabajo en ejecución
                    </p>

                    <p className="text-sm mt-1 mb-5">
                      Registra a continuación el trabajo que realizaste para atender este caso.
                    </p>

                    {/* RESULTADO DEL TRABAJO */}
                    <div>

                      <label
                        htmlFor="resultadoTrabajo"
                        className="block text-sm font-medium text-cyan-900 mb-2"
                      >
                        Descripción del trabajo realizado
                      </label>

                      <textarea
                        id="resultadoTrabajo"
                        value={resultadoTrabajo}
                        onChange={(e) => setResultadoTrabajo(e.target.value)}
                        maxLength={2000}
                        rows={6}
                        placeholder="Describe las acciones realizadas para atender el caso..."
                        className="w-full rounded-lg border border-cyan-200 bg-white px-4 py-3 text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta)]/40 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 resize-y"
                        disabled={procesandoTrabajo}
                      />

                      <div className="flex justify-between items-center mt-2">

                        <p className="text-xs text-cyan-700">
                          Describe de forma clara las acciones realizadas.
                        </p>

                        <p className="text-xs text-cyan-700">
                          {resultadoTrabajo.length}/2000
                        </p>

                      </div>

                    </div>

                    {/* EVIDENCIA DEL TRABAJO */}
                    <div className="mt-5">

                      <label className="block text-sm font-medium text-cyan-900 mb-2">
                        Fotos del trabajo realizado (opcional, máx. 2)
                      </label>

                      <SubidaEvidencia
                        fotos={fotosTrabajo}
                        setFotos={setFotosTrabajo}
                        documento={null}
                        setDocumento={() => {}}
                      />

                    </div>

                    {/* BOTÓN GUARDAR */}
                    <div className="flex justify-end mt-4">

                      <button
                        type="button"
                        onClick={registrarTrabajo}
                        disabled={
                          procesandoTrabajo ||
                          !resultadoTrabajo.trim()
                        }
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-verde-institucional)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {procesandoTrabajo ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Guardar trabajo realizado
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TRABAJO REALIZADO */}
            {caso.estado === 'TrabajoRealizado' && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Trabajo realizado
                    </p>

                    <p className="text-sm mt-1">
                      El trabajo fue marcado como realizado y está pendiente de verificación.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* EN VERIFICACIÓN */}
            {caso.estado === 'EnVerificacion' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Trabajo enviado a verificación
                    </p>

                    <p className="text-sm mt-1">
                      El trabajo fue registrado correctamente y el caso está pendiente de verificación por parte del analista.
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  )
}