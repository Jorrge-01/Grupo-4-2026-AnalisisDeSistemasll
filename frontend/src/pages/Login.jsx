import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoMuni from '../assets/logo-muni.png'
import { apiFetch } from '../lib/api'

const MENSAJE_CAMPO_VACIO = 'Completa este campo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({ email: '', password: '' })
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const navigate = useNavigate()

  function validarCampos() {
    const nuevosErrores = {
      email: email.trim() ? '' : MENSAJE_CAMPO_VACIO,
      password: password ? '' : MENSAJE_CAMPO_VACIO,
    }
    setErrores(nuevosErrores)

    if (nuevosErrores.email) {
      emailRef.current?.focus()
      return false
    }
    if (nuevosErrores.password) {
      passwordRef.current?.focus()
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
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data.requiereCambioPassword) {
        navigate('/cambiar-password', { state: { email } })
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('nombre', data.nombre)
      localStorage.setItem('roles', JSON.stringify(data.roles))

      if (data.roles.includes('Administrador')) navigate('/admin')
      else if (data.roles.includes('Analista')) navigate('/analista')
      else if (data.roles.includes('Empleado')) navigate('/empleado')
      else if (data.roles.includes('Vecino')) navigate('/vecino')
      else navigate('/')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--color-piedra)] px-6 py-16">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-piedra-clara)] rounded-lg shadow-sm border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <div className="franja-textil" />

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <img src={logoMuni} alt="Logo de la municipalidad" className="h-16 w-16 mb-4" />
              <h1 className="font-display text-2xl font-semibold text-[var(--color-verde-institucional)]">
                Iniciar sesión
              </h1>
              <p className="text-sm text-[var(--color-azul-piedra)] mt-1 text-center">
                Portal de atención ciudadana
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-tinta)] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errores.email) setErrores((prev) => ({ ...prev, email: '' }))
                  }}
                  placeholder="tucorreo@ejemplo.com"
                  aria-invalid={!!errores.email}
                  className={`w-full px-4 py-2.5 rounded-md border bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 transition-shadow ${
                    errores.email
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-[var(--color-azul-piedra)]/30 focus:ring-[var(--color-ocre)]'
                  }`}
                />
                {errores.email && (
                  <p className="text-xs text-red-600 mt-1.5">{errores.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-tinta)] mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errores.password) setErrores((prev) => ({ ...prev, password: '' }))
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!errores.password}
                  className={`w-full px-4 py-2.5 rounded-md border bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 transition-shadow ${
                    errores.password
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-[var(--color-azul-piedra)]/30 focus:ring-[var(--color-ocre)]'
                  }`}
                />
                {errores.password && (
                  <p className="text-xs text-red-600 mt-1.5">{errores.password}</p>
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
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <Link
              to="/olvide-password"
              className="block text-center text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors mt-2"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <p className="text-center text-sm text-[var(--color-azul-piedra)] mt-6">
              ¿Eres vecino y aún no tienes cuenta?{' '}
              <Link to="/registro" className="text-[var(--color-ocre)] font-semibold hover:underline">
                Regístrate aquí
              </Link>
            </p>

            <Link
              to="/"
              className="block text-center text-sm text-[var(--color-tinta)]/60 hover:text-[var(--color-tinta)] mt-4 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}