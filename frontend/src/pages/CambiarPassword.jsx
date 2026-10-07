import { useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoMuni from '../assets/logo-muni.png'
import { apiFetch } from '../lib/api'
import { traducirError } from '../lib/traducirError'
import PasswordChecklist, { passwordEsValida } from '../components/PasswordChecklist'

const MSJ_CAMPO_VACIO = 'Completa este campo'

export default function CambiarPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const emailPrellenado = location.state?.email || ''

  const [email, setEmail] = useState(emailPrellenado)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarPasswordNueva, setConfirmarPasswordNueva] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})
  const [exito, setExito] = useState(false)

  const emailRef = useRef(null)
  const actualRef = useRef(null)
  const nuevaRef = useRef(null)
  const confirmarRef = useRef(null)

  function limpiarError(campo) {
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nuevosErrores = {}
    if (!emailPrellenado && !email.trim()) nuevosErrores.email = MSJ_CAMPO_VACIO
    if (!passwordActual) nuevosErrores.passwordActual = MSJ_CAMPO_VACIO
    if (!passwordNueva) nuevosErrores.passwordNueva = MSJ_CAMPO_VACIO
    if (!confirmarPasswordNueva) nuevosErrores.confirmarPasswordNueva = MSJ_CAMPO_VACIO

    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      if (nuevosErrores.email) emailRef.current?.focus()
      else if (nuevosErrores.passwordActual) actualRef.current?.focus()
      else if (nuevosErrores.passwordNueva) nuevaRef.current?.focus()
      else confirmarRef.current?.focus()
      return
    }

    if (!passwordEsValida(passwordNueva)) {
      setError('La contraseña no cumple con los requisitos de seguridad.')
      return
    }
    if (passwordNueva !== confirmarPasswordNueva) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      await apiFetch('/api/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          passwordActual,
          passwordNueva,
          confirmarPasswordNueva,
        }),
      })

      setExito(true)
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const inputBase =
    'w-full px-4 py-2.5 rounded-md border bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 transition-shadow'
  const inputClass = (campo) =>
    `${inputBase} ${
      errores[campo]
        ? 'border-red-500 focus:ring-red-400'
        : 'border-[var(--color-azul-piedra)]/30 focus:ring-[var(--color-ocre)]'
    }`
  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'
  const errorClass = 'mt-1.5 text-sm text-red-600'

  return (
    <>
    {exito && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-lg bg-white shadow-xl p-8 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200">
            <svg
              className="h-9 w-9 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-800">
            ¡Buen trabajo!
          </h2>

          <p className="mt-3 text-sm text-gray-500">
            Contraseña actualizada correctamente.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 rounded-md bg-cyan-400 px-7 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            OK
          </button>

        </div>
      </div>
    )}

    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--color-piedra)] px-6 py-16">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-piedra-clara)] rounded-lg shadow-sm border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <div className="franja-textil" />

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <img src={logoMuni} alt="Logo de la municipalidad" className="h-16 w-16 mb-4" />
              <h1 className="font-display text-2xl font-semibold text-[var(--color-verde-institucional)]">
                Cambiar contraseña
              </h1>
              <p className="text-sm text-[var(--color-azul-piedra)] mt-1 text-center">
                Por seguridad, debes establecer una nueva contraseña
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {!emailPrellenado && (
                <div>
                  <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                  <input
                    id="email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      limpiarError('email')
                    }}
                    placeholder="tucorreo@ejemplo.com"
                    className={inputClass('email')}
                  />
                  {errores.email && <p className={errorClass}>{errores.email}</p>}
                </div>
              )}

              <div>
                <label htmlFor="passwordActual" className={labelClass}>Contraseña temporal</label>
                <input
                  id="passwordActual"
                  ref={actualRef}
                  type="password"
                  value={passwordActual}
                  onChange={(e) => {
                    setPasswordActual(e.target.value)
                    limpiarError('passwordActual')
                  }}
                  placeholder="La que recibiste por correo"
                  className={inputClass('passwordActual')}
                />
                {errores.passwordActual && <p className={errorClass}>{errores.passwordActual}</p>}
              </div>

              <div>
                <label htmlFor="passwordNueva" className={labelClass}>Nueva contraseña</label>
                <input
                  id="passwordNueva"
                  ref={nuevaRef}
                  type="password"
                  value={passwordNueva}
                  onChange={(e) => {
                    setPasswordNueva(e.target.value)
                    limpiarError('passwordNueva')
                  }}
                  placeholder="••••••••"
                  className={inputClass('passwordNueva')}
                />
                {errores.passwordNueva && <p className={errorClass}>{errores.passwordNueva}</p>}
                <PasswordChecklist password={passwordNueva} />
              </div>

              <div>
                <label htmlFor="confirmarPasswordNueva" className={labelClass}>Confirmar nueva contraseña</label>
                <input
                  id="confirmarPasswordNueva"
                  ref={confirmarRef}
                  type="password"
                  value={confirmarPasswordNueva}
                  onChange={(e) => {
                    setConfirmarPasswordNueva(e.target.value)
                    limpiarError('confirmarPasswordNueva')
                  }}
                  placeholder="••••••••"
                  className={inputClass('confirmarPasswordNueva')}
                />
                {errores.confirmarPasswordNueva && <p className={errorClass}>{errores.confirmarPasswordNueva}</p>}
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
                {cargando ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>

            <Link
              to="/login"
              className="block text-center text-sm text-[var(--color-tinta)]/60 hover:text-[var(--color-tinta)] mt-6 transition-colors"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}