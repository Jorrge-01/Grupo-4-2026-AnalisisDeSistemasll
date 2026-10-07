import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logoMuni from '../assets/logo-muni.png'
import { apiFetch } from '../lib/api'

const MSJ_CAMPO_VACIO = 'Completa este campo'
const MSJ_CORREO_INVALIDO = 'Ingresa un correo electrónico válido.'
const MSJ_DPI_INVALIDO = 'El CUI debe tener 13 dígitos.'
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_DPI = /^[0-9]{13}$/

export default function OlvideContrasena() {
  const [email, setEmail] = useState('')
  const [dpi, setDpi] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({ email: '', dpi: '' })
  const [enviado, setEnviado] = useState(false)

  const emailRef = useRef(null)
  const dpiRef = useRef(null)

  function validarCampos() {
    const nuevos = { email: '', dpi: '' }

    if (!email.trim()) {
      nuevos.email = MSJ_CAMPO_VACIO
    } else if (!REGEX_CORREO.test(email.trim())) {
      nuevos.email = MSJ_CORREO_INVALIDO
    }

    if (!dpi.trim()) {
      nuevos.dpi = MSJ_CAMPO_VACIO
    } else if (!REGEX_DPI.test(dpi.trim())) {
      nuevos.dpi = MSJ_DPI_INVALIDO
    }

    setErrores(nuevos)

    if (nuevos.email) {
      emailRef.current?.focus()
      return false
    }
    if (nuevos.dpi) {
      dpiRef.current?.focus()
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!validarCampos()) return

    setCargando(true)
    try {
      await apiFetch('/api/auth/olvide-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), cui: dpi.trim() }),
      })

      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value)
    if (errores.email) setErrores((prev) => ({ ...prev, email: '' }))
  }

  function handleDpiChange(e) {
    setDpi(e.target.value)
    if (errores.dpi) setErrores((prev) => ({ ...prev, dpi: '' }))
  }

  const inputBase =
    'w-full px-4 py-2.5 rounded-md border bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 transition-shadow'
  const inputNormal =
    'border-[var(--color-azul-piedra)]/30 focus:ring-[var(--color-ocre)]'
  const inputError = 'border-red-500 focus:ring-red-300'
  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--color-piedra)] px-6 py-16">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-piedra-clara)] rounded-lg shadow-sm border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <div className="franja-textil" />

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <img src={logoMuni} alt="Logo de la municipalidad" className="h-16 w-16 mb-4" />
              <h1 className="font-display text-2xl font-semibold text-[var(--color-verde-institucional)]">
                Olvidé mi contraseña
              </h1>
              <p className="text-sm text-[var(--color-azul-piedra)] mt-1 text-center">
                Verifica tu identidad para recuperar el acceso a tu cuenta
              </p>
            </div>

            {enviado ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-md px-4 py-3 text-sm">
                  Si los datos coinciden con una cuenta registrada, enviamos un correo con
                  instrucciones para restablecer tu contraseña.
                </div>
                <Link
                  to="/login"
                  className="inline-block text-sm text-[var(--color-ocre)] font-semibold hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                    <input
                      id="email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="tucorreo@ejemplo.com"
                      aria-invalid={errores.email ? 'true' : 'false'}
                      className={`${inputBase} ${errores.email ? inputError : inputNormal}`}
                    />
                    {errores.email && (
                      <p className="text-xs text-red-600 mt-1.5">{errores.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dpi" className={labelClass}>CUI (13 dígitos)</label>
                    <input
                      id="dpi"
                      ref={dpiRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={13}
                      value={dpi}
                      onChange={handleDpiChange}
                      placeholder="0000000000000"
                      aria-invalid={errores.dpi ? 'true' : 'false'}
                      className={`${inputBase} ${errores.dpi ? inputError : inputNormal}`}
                    />
                    {errores.dpi && (
                      <p className="text-xs text-red-600 mt-1.5">{errores.dpi}</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full py-2.5 rounded-md bg-[var(--color-ocre)] text-[var(--color-piedra-clara)] font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cargando ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>

                <Link
                  to="/login"
                  className="block text-center text-sm text-[var(--color-tinta)]/60 hover:text-[var(--color-tinta)] mt-6 transition-colors"
                >
                  ← Volver a iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}