import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoMuni from '../assets/logo-muni.png'
import { apiFetch } from '../lib/api'
import { traducirError } from '../lib/traducirError'
import PasswordChecklist, { passwordEsValida } from '../components/PasswordChecklist'
import EmailChecklist, { emailEsValido } from '../components/EmailChecklist'

export default function Registro() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    dpi: '',
    direccion: '',
    aldea: '',
    telefono: '',
    codigoPais: '+502',
    email: '',
    password: '',
    confirmarPassword: '',
    aceptaTerminos: false,
  })

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampos, setErroresCampos] = useState({})
  const navigate = useNavigate()
  const [aldeas, setAldeas] = useState([])

  const hoy = new Date().toISOString().split('T')[0]

  const fechaMaximaMayorEdad = (() => {
    const fecha = new Date()
    fecha.setFullYear(fecha.getFullYear() - 18)
    return fecha.toISOString().split('T')[0]
  })()

  useEffect(() => {
    apiFetch('/api/aldeas')
      .then(setAldeas)
      .catch(() => setAldeas([]))
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target

    if (name === 'codigoPais') {
      const limpio = value.replace(/[^\d+]/g, '').slice(0, 4)
      setForm((prev) => ({ ...prev, codigoPais: limpio }))
      return
    }

    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 8)
      setForm((prev) => ({ ...prev, telefono: soloNumeros }))
      return
    }

    if (name === 'dpi') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 13)
      setForm((prev) => ({ ...prev, dpi: soloNumeros }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))

    // Eliminar el mensaje de campo vacío cuando el usuario empieza a completarlo
    if (erroresCampos[name]) {
      setErroresCampos((prev) => {
        const nuevosErrores = { ...prev }
        delete nuevosErrores[name]
        return nuevosErrores
      })
    }
  }

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validar todos los campos obligatorios que estén vacíos
    const nuevosErrores = {}

    if (!form.nombres.trim()) {
      nuevosErrores.nombres = 'Completa este campo.'
    }

    if (!form.apellidos.trim()) {
      nuevosErrores.apellidos = 'Completa este campo.'
    }

    if (!form.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = 'Completa este campo.'
    }

    if (!form.dpi.trim()) {
      nuevosErrores.dpi = 'Completa este campo.'
    }

    if (!form.direccion.trim()) {
      nuevosErrores.direccion = 'Completa este campo.'
    }

    if (!form.aldea) {
      nuevosErrores.aldea = 'Completa este campo.'
    }

    if (!form.telefono.trim()) {
      nuevosErrores.telefono = 'Completa este campo.'
    }

    if (!form.email.trim()) {
      nuevosErrores.email = 'Completa este campo.'
    }

    if (!form.password) {
      nuevosErrores.password = 'Completa este campo.'
    }

    if (!form.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Completa este campo.'
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores)
      return
    }

    setErroresCampos({})

    if (form.fechaNacimiento > hoy) {
      setError('La fecha de nacimiento no puede ser posterior a la fecha actual.')
      return
    }

if (form.fechaNacimiento > fechaMaximaMayorEdad) {
      setError('Debes ser mayor de edad para registrarte.')
      return
    }

    if (form.dpi.length !== 13) {
      setError('El CUI debe tener 13 dígitos.')
      return
    }

    if (form.dpi.slice(-4) !== '0110') {
      setError('El DPI ingresado no corresponde a un vecino registrado en este municipio.')
      return
    }

    if (form.telefono.length < 8) {
      setError('El teléfono debe tener 8 dígitos.')
      return
    }

    if (!emailEsValido(form.email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    if (!passwordEsValida(form.password)) {
      setError('La contraseña no cumple con los requisitos de seguridad.')
      return
    }

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!form.aceptaTerminos) {
      setError('Debes aceptar el tratamiento de datos personales para continuar.')
      return
    }

    setCargando(true)
    try {
      await apiFetch('/api/auth/registro-vecino', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nombre: form.nombres,
          apellido: form.apellidos,
          cui: form.dpi,
          direccion: form.direccion,
          aldeaId: Number(form.aldea) || null,
          telefono: `${form.codigoPais}${form.telefono}`,
          fechaNacimiento: form.fechaNacimiento,
        }),
      })

      navigate('/login')
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo completar el registro. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const inputClass =
    'px-4 py-2.5 rounded-md border border-[var(--color-azul-piedra)]/30 bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)] transition-shadow'

  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--color-piedra)] px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="bg-[var(--color-piedra-clara)] rounded-lg shadow-sm border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <div className="franja-textil" />

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <img src={logoMuni} alt="Logo de la municipalidad" className="h-16 w-16 mb-4" />

              <h1 className="font-display text-2xl font-semibold text-[var(--color-verde-institucional)]">
                Crear cuenta de vecino
              </h1>

              <p className="text-sm text-[var(--color-azul-piedra)] mt-1 text-center">
                Regístrate para reportar quejas, reclamos, denuncias y sugerencias
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="nombres" className={labelClass}>Nombres</label>

                  <input
                    id="nombres"
                    name="nombres"
                    type="text"
                    required
                    maxLength={30}
                    value={form.nombres}
                    onChange={handleChange}
                    placeholder="Ej. María José"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.nombres && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.nombres}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="apellidos" className={labelClass}>Apellidos</label>

                  <input
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    required
                    maxLength={30}
                    value={form.apellidos}
                    onChange={handleChange}
                    placeholder="Ej. García López"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.apellidos && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.apellidos}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="fechaNacimiento" className={labelClass}>Fecha de nacimiento</label>

                  <input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    required
                    max={fechaMaximaMayorEdad}
                    value={form.fechaNacimiento}
                    onChange={handleChange}
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.fechaNacimiento && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.fechaNacimiento}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dpi" className={labelClass}>CUI (13 dígitos)</label>

                  <input
                    id="dpi"
                    name="dpi"
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={13}
                    pattern="[0-9]{13}"
                    value={form.dpi}
                    onChange={handleChange}
                    placeholder="0000000000000"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.dpi && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.dpi}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="direccion" className={labelClass}>Dirección</label>

                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    required
                    maxLength={50}
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="Zona, colonia, calle..."
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.direccion && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.direccion}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="aldea" className={labelClass}>Aldea o comunidad</label>

                  <select
                    id="aldea"
                    name="aldea"
                    required
                    value={form.aldea}
                    onChange={handleChange}
                    className={`${inputClass} w-full`}
                  >
                    <option value="" disabled>Selecciona una opción</option>

                    {aldeas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>

                  {erroresCampos.aldea && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.aldea}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="telefono" className={labelClass}>Teléfono</label>

                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px' }}>
                    <input
                      id="codigoPais"
                      name="codigoPais"
                      type="text"
                      value={form.codigoPais}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 8px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: '1px solid #94A3B8',
                        outline: 'none',
                      }}
                    />

                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={8}
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="00000000"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: '1px solid #94A3B8',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {erroresCampos.telefono && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.telefono}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>Correo electrónico</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tucorreo@ejemplo.com"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.email}
                    </p>
                  )}

                  <EmailChecklist email={form.email} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="password" className={labelClass}>Contraseña</label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    maxLength={15}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.password}
                    </p>
                  )}

                  <PasswordChecklist password={form.password} />
                </div>

                <div>
                  <label htmlFor="confirmarPassword" className={labelClass}>Confirmar contraseña</label>

                  <input
                    id="confirmarPassword"
                    name="confirmarPassword"
                    type="password"
                    required
                    maxLength={15}
                    value={form.confirmarPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass} w-full`}
                  />

                  {erroresCampos.confirmarPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {erroresCampos.confirmarPassword}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-[var(--color-tinta)]/80 cursor-pointer">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={form.aceptaTerminos}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-ocre)]"
                />

                Acepto el tratamiento de mis datos personales conforme a la política de privacidad
                de la municipalidad, utilizados exclusivamente para la gestión de mis casos.
              </label>

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
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--color-azul-piedra)] mt-6">
              ¿Ya tienes cuenta?{' '}

              <Link
                to="/login"
                className="text-[var(--color-ocre)] font-semibold hover:underline"
              >
                Inicia sesión
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