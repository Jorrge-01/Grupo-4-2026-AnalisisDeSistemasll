import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ClipboardList,
} from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import EvidenciaCaso from '../components/EvidenciaCaso'
import { apiFetch } from '../lib/api'

function obtenerClaseEstado(estado) {
  switch (estado) {
    case 'Asignada':
      return 'bg-blue-100 text-blue-800'

    case 'EnValidacion':
      return 'bg-amber-100 text-amber-800'

    case 'PendienteInformacion':
      return 'bg-orange-100 text-orange-800'

    case 'EnAnalisis':
      return 'bg-purple-100 text-purple-800'

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

export default function DetalleCasoAnalista() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caso, setCaso] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [instruccion, setInstruccion] = useState('')
  const [correccion, setCorreccion] = useState('')
  const [mostrarCorreccion, setMostrarCorreccion] = useState(false)
  const [solicitudInformacion, setSolicitudInformacion] = useState('')
  const [mostrarSolicitudInformacion, setMostrarSolicitudInformacion] = useState(false)

  async function cargarDetalle() {
    try {
      setCargando(true)
      setError('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(`/api/Casos/${id}/detalle`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCaso(data)
    } catch (err) {
      setError(
        err.message || 'No se pudo cargar el detalle del caso.'
      )
    } finally {
      setCargando(false)
    }
  }

  async function validarCaso() {
    try {
      setProcesando(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(`/api/Casos/${id}/validar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setMensaje(data.mensaje)

      await cargarDetalle()
    } catch (err) {
      setError(err.message || 'No se pudo validar el caso.')
    } finally {
      setProcesando(false)
    }
  }

  async function solicitarInformacion() {
  if (!solicitudInformacion.trim()) {
    setError('Debe indicar qué información necesita del vecino.')
    return
  }

  try {
    setProcesando(true)
    setError('')
    setMensaje('')

    const token = localStorage.getItem('token')

    const data = await apiFetch(
      `/api/Casos/${id}/solicitar-informacion`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mensaje: solicitudInformacion.trim(),
        }),
      }
    )

    setMensaje(data.mensaje)
    setSolicitudInformacion('')
    setMostrarSolicitudInformacion(false)

    await cargarDetalle()
  } catch (err) {
    setError(
      err.message || 'No se pudo solicitar información al vecino.'
    )
  } finally {
    setProcesando(false)
  }
}

  async function crearInstruccion() {
    if (!instruccion.trim()) {
      setError('Debe ingresar las instrucciones de trabajo.')
      return
    }

    try {
      setProcesando(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(`/api/Casos/${id}/instruccion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instruccion: instruccion.trim(),
        }),
      })

      setMensaje(data.mensaje)
      setInstruccion('')

      await cargarDetalle()
    } catch (err) {
      setError(
        err.message || 'No se pudo crear la instrucción de trabajo.'
      )
    } finally {
      setProcesando(false)
    }
  }

  async function aprobarTrabajo() {
    try {
      setProcesando(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(
        `/api/Casos/${id}/aprobar-trabajo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setMensaje(data.mensaje)
      setMostrarCorreccion(false)
      setCorreccion('')

      await cargarDetalle()
    } catch (err) {
      setError(
        err.message || 'No se pudo aprobar el trabajo.'
      )
    } finally {
      setProcesando(false)
    }
  }

  async function solicitarCorreccion() {
    if (!correccion.trim()) {
      setError('Debe indicar qué debe corregir el operario.')
      return
    }

    try {
      setProcesando(true)
      setError('')
      setMensaje('')

      const token = localStorage.getItem('token')

      const data = await apiFetch(
        `/api/Casos/${id}/solicitar-correccion`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            correccion: correccion.trim(),
          }),
        }
      )

      setMensaje(data.mensaje)
      setCorreccion('')
      setMostrarCorreccion(false)

      await cargarDetalle()
    } catch (err) {
      setError(
        err.message || 'No se pudo solicitar la corrección.'
      )
    } finally {
      setProcesando(false)
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
            onClick={() => navigate('/analista')}
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
                  'El caso no existe o no está asignado a este analista.'}
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

        <Link
          to="/analista"
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

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Área
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.area || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Aldea
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.aldea || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Dirección
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.direccion || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                  Teléfono de contacto
                </p>

                <p className="text-sm text-[var(--color-tinta)] mt-1">
                  {caso.telefonoContacto || '-'}
                </p>
              </div>

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
          <a            key={archivo.id}
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

            {/* VERIFICACIÓN DEL TRABAJO */}
            {caso.estado === 'EnVerificacion' && (
              <div className="mt-8">

                <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)] mb-5">
                  Verificación del trabajo
                </h2>

                {/* INSTRUCCIÓN */}
                <div className="mb-5">

                  <div className="flex items-center gap-2 mb-2">

                    <ClipboardList className="h-4 w-4 text-indigo-700" />

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

                {/* RESULTADO */}
                <div>

                  <div className="flex items-center gap-2 mb-2">

                    <CheckCircle2 className="h-4 w-4 text-teal-700" />

                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                      Trabajo realizado por el operario
                    </p>

                  </div>

                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">

                    <p className="text-sm leading-6 text-teal-900 whitespace-pre-wrap">
                      {caso.resultadoTrabajo || '-'}
                    </p>

                  </div>

                </div>

                {/* FECHA */}
                <div className="mt-5">

                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
                    Fecha del trabajo
                  </p>

                  <p className="text-sm text-[var(--color-tinta)] mt-1">
                    {formatearFecha(caso.fechaTrabajo)}
                  </p>

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
                      No se pudo realizar la operación
                    </p>

                    <p className="text-sm mt-1">
                      {error}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* ASIGNADA */}
{caso.estado === 'Asignada' && (
  <div>
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={validarCaso}
        disabled={procesando}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-verde-institucional)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4" />

        {procesando
          ? 'Validando...'
          : 'Validar caso'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMostrarSolicitudInformacion(true)
          setError('')
          setMensaje('')
        }}
        disabled={procesando}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-[var(--color-verde-institucional)]/25 text-[var(--color-verde-institucional)] text-sm font-medium hover:bg-[var(--color-verde-institucional)]/5 transition-colors disabled:opacity-50"
      >
        <MessageSquare className="h-4 w-4" />

        Solicitar información
      </button>
    </div>

    {mostrarSolicitudInformacion && (
      <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-5">
        <div className="flex items-start gap-3 mb-5">
          <MessageSquare className="h-5 w-5 mt-0.5 text-orange-700 flex-shrink-0" />

          <div>
            <p className="font-medium text-orange-800">
              Solicitar información al vecino
            </p>

            <p className="text-sm mt-1 text-orange-700">
              Indique qué información adicional necesita para poder validar el caso.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="solicitudInformacion"
            className="block text-sm font-medium text-[var(--color-tinta)] mb-2"
          >
            Información solicitada
          </label>

          <textarea
            id="solicitudInformacion"
            value={solicitudInformacion}
            onChange={(e) => setSolicitudInformacion(e.target.value)}
            rows={5}
            maxLength={2000}
            disabled={procesando}
            placeholder="Escriba aquí la información que necesita del vecino..."
            className="w-full rounded-lg border border-orange-300 bg-white px-4 py-3 text-sm text-[var(--color-tinta)] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-gray-100"
          />

          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-xs text-[var(--color-tinta)]/50">
              {solicitudInformacion.length}/2000 caracteres
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarSolicitudInformacion(false)
                  setSolicitudInformacion('')
                  setError('')
                }}
                disabled={procesando}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={solicitarInformacion}
                disabled={procesando || !solicitudInformacion.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Solicitar información
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

            {/* EN VALIDACIÓN */}
            {caso.estado === 'EnValidacion' && (
              <button
                type="button"
                onClick={validarCaso}
                disabled={procesando}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-verde-institucional)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />

                {procesando
                  ? 'Validando...'
                  : 'Validar nuevamente'}
              </button>
            )}

            {/* PENDIENTE DE INFORMACIÓN */}
            {caso.estado === 'PendienteInformacion' && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Esperando información del vecino
                    </p>

                    <p className="text-sm mt-1">
                      El caso permanecerá en este estado hasta que el vecino responda la solicitud de información.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* EN ANÁLISIS */}
            {caso.estado === 'EnAnalisis' && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">

                <div className="flex items-start gap-3 mb-5">

                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-purple-700" />

                  <div>
                    <p className="font-medium text-purple-800">
                      Caso en análisis
                    </p>

                    <p className="text-sm mt-1 text-purple-700">
                      El caso fue validado. Ingrese las instrucciones que deberá realizar el operario para atender este caso.
                    </p>
                  </div>

                </div>

                <div>

                  <label
                    htmlFor="instruccion"
                    className="block text-sm font-medium text-[var(--color-tinta)] mb-2"
                  >
                    Instrucción de trabajo
                  </label>

                  <textarea
                    id="instruccion"
                    value={instruccion}
                    onChange={(e) => setInstruccion(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    disabled={procesando}
                    placeholder="Escriba aquí las instrucciones de trabajo..."
                    className="w-full rounded-lg border border-[var(--color-azul-piedra)]/20 bg-white px-4 py-3 text-sm text-[var(--color-tinta)] outline-none transition focus:border-[var(--color-verde-institucional)] focus:ring-2 focus:ring-[var(--color-verde-institucional)]/20 disabled:bg-gray-100"
                  />

                  <div className="mt-2 flex items-center justify-between gap-4">

                    <span className="text-xs text-[var(--color-tinta)]/50">
                      {instruccion.length}/2000 caracteres
                    </span>

                    <button
                      type="button"
                      onClick={crearInstruccion}
                      disabled={procesando || !instruccion.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-verde-institucional)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {procesando ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Crear instrucción y asignar operario
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* ASIGNADO A OPERARIO */}
            {caso.estado === 'AsignadaAOperario' && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Caso asignado a un operario
                    </p>

                    <p className="text-sm mt-1">
                      La instrucción de trabajo fue creada y el caso ya fue asignado a un operario para su ejecución.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* EN VERIFICACIÓN */}
            {caso.estado === 'EnVerificacion' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">

                <div className="flex items-start gap-3 mb-5">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-700" />

                  <div>
                    <p className="font-medium text-yellow-800">
                      Caso pendiente de verificación
                    </p>

                    <p className="text-sm mt-1 text-yellow-700">
                      El operario registró el trabajo realizado. Revise la información anterior y seleccione una acción.
                    </p>
                  </div>

                </div>

                {!mostrarCorreccion ? (
                  <div className="flex flex-col sm:flex-row gap-3">

                    <button
                      type="button"
                      onClick={aprobarTrabajo}
                      disabled={procesando}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {procesando ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}

                      {procesando
                        ? 'Procesando...'
                        : 'Trabajo correcto'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMostrarCorreccion(true)
                        setError('')
                        setMensaje('')
                      }}
                      disabled={procesando}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-yellow-500 text-yellow-800 text-sm font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50"
                    >
                      <MessageSquare className="h-4 w-4" />

                      Solicitar corrección
                    </button>

                  </div>
                ) : (
                  <div className="rounded-lg border border-yellow-300 bg-white p-5">

                    <div className="flex items-start gap-3 mb-4">

                      <MessageSquare className="h-5 w-5 mt-0.5 text-yellow-700 flex-shrink-0" />

                      <div>
                        <p className="font-medium text-yellow-800">
                          Solicitar corrección
                        </p>

                        <p className="text-sm mt-1 text-yellow-700">
                          Indique al operario qué debe corregir o realizar nuevamente.
                        </p>
                      </div>

                    </div>

                    <label
                      htmlFor="correccion"
                      className="block text-sm font-medium text-[var(--color-tinta)] mb-2"
                    >
                      Descripción de la corrección
                    </label>

                    <textarea
                      id="correccion"
                      value={correccion}
                      onChange={(e) => setCorreccion(e.target.value)}
                      rows={5}
                      maxLength={2000}
                      disabled={procesando}
                      placeholder="Escriba aquí las indicaciones para el operario..."
                      className="w-full rounded-lg border border-yellow-300 bg-white px-4 py-3 text-sm text-[var(--color-tinta)] outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 disabled:bg-gray-100"
                    />

                    <div className="mt-2 flex items-center justify-between gap-4">

                      <span className="text-xs text-[var(--color-tinta)]/50">
                        {correccion.length}/2000 caracteres
                      </span>

                      <div className="flex gap-3">

                        <button
                          type="button"
                          onClick={() => {
                            setMostrarCorreccion(false)
                            setCorreccion('')
                            setError('')
                          }}
                          disabled={procesando}
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={solicitarCorreccion}
                          disabled={procesando || !correccion.trim()}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {procesando ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4" />
                              Solicitar corrección
                            </>
                          )}
                        </button>

                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* EN EJECUCIÓN */}
            {caso.estado === 'EnEjecucion' && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-cyan-800">

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="font-medium">
                      Caso nuevamente en ejecución
                    </p>

                    <p className="text-sm mt-1">
                      Se solicitó una corrección al operario. El caso volverá a verificación cuando registre nuevamente el trabajo realizado.
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