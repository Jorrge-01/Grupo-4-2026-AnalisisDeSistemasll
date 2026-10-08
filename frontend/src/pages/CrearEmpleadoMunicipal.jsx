import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'
import { traducirError } from '../lib/traducirError'
import PasswordChecklist, { passwordEsValida } from '../components/PasswordChecklist'
import EmailChecklist, { emailEsValido } from '../components/EmailChecklist'

export default function CrearEmpleadoMunicipal() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombres: '', apellidos: '', email: '', rol: '',
  })
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([])
  const [areas, setAreas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [erroresCampos, setErroresCampos] = useState({})

  useEffect(() => {
    apiFetch('/api/areas').then(setAreas).catch(() => setAreas([]))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((p) => ({ ...p, [name]: value }))

    if (erroresCampos[name]) {
      setErroresCampos((prev) => {
        const nuevosErrores = { ...prev }
        delete nuevosErrores[name]
        return nuevosErrores
      })
    }
  }

  function handleToggleArea(areaId) {
    setAreasSeleccionadas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    )

    if (erroresCampos.areas) {
      setErroresCampos((prev) => {
        const nuevosErrores = { ...prev }
        delete nuevosErrores.areas
        return nuevosErrores
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    const nuevosErrores = {}

    if (!form.nombres.trim()) {
      nuevosErrores.nombres = 'Completa este campo.'
    }

    if (!form.apellidos.trim()) {
      nuevosErrores.apellidos = 'Completa este campo.'
    }

    if (!form.email.trim()) {
      nuevosErrores.email = 'Completa este campo.'
    }

    if (!form.rol) {
      nuevosErrores.rol = 'Completa este campo.'
    }

    if (areasSeleccionadas.length === 0) {
      nuevosErrores.areas = 'Debes asignar al menos un área.'
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores)
      return
    }

    setErroresCampos({})

    if (form.nombres.length > 40) return setError('El nombre no debe exceder 40 caracteres.')
    if (form.apellidos.length > 40) return setError('El apellido no debe exceder 40 caracteres.')
    if (!emailEsValido(form.email)) return setError('Ingresa un correo electrónico válido.')

    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      await apiFetch('/api/auth/registro-usuario', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: form.email,
          password: null,
          nombre: form.nombres,
          apellido: form.apellidos,
          rol: form.rol,
          cui: null,
          direccion: null,
          aldea: null,
          telefono: null,
          fechaNacimiento: null,
          areaIds: areasSeleccionadas,
        }),
      })

      setExito(`${form.rol} registrado correctamente.`)
      setForm({ nombres: '', apellidos: '', email: '', rol: '' })
      setAreasSeleccionadas([])
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo registrar al empleado.')
    } finally {
      setCargando(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-md border border-[var(--color-azul-piedra)]/30 bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)] transition-shadow'
  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Registrar Empleado Municipal" />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin/usuarios')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver a usuarios
        </button>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-8 space-y-5"
        >
          <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)] mb-2">
            Datos del empleado
          </h2>

          <p className="text-sm text-[var(--color-tinta)]/60 -mt-3">
            Analistas y Operarios trabajan sobre las áreas municipales que se les asignen.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Nombres</label>
              <input
                name="nombres"
                maxLength={40}
                value={form.nombres}
                onChange={handleChange}
                className={inputClass}
              />
              {erroresCampos.nombres && (
                <p className="text-sm text-red-600 mt-1">
                  {erroresCampos.nombres}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Apellidos</label>
              <input
                name="apellidos"
                maxLength={40}
                value={form.apellidos}
                onChange={handleChange}
                className={inputClass}
              />
              {erroresCampos.apellidos && (
                <p className="text-sm text-red-600 mt-1">
                  {erroresCampos.apellidos}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Correo electrónico</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
            <EmailChecklist email={form.email} />

            {erroresCampos.email && (
              <p className="text-sm text-red-600 mt-1">
                {erroresCampos.email}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Rol</label>
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                Selecciona un rol
              </option>
              <option value="Analista">Analista</option>
              <option value="Empleado">Operario</option>
            </select>

            {erroresCampos.rol && (
              <p className="text-sm text-red-600 mt-1">
                {erroresCampos.rol}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Áreas asignadas (selecciona una o más)
            </label>

            <div className="grid sm:grid-cols-2 gap-2 bg-white border border-[var(--color-azul-piedra)]/30 rounded-md p-4 max-h-48 overflow-y-auto">
              {areas.length === 0 ? (
                <p className="text-sm text-[var(--color-tinta)]/50 col-span-2">
                  No hay áreas creadas todavía.
                </p>
              ) : (
                areas.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 text-sm text-[var(--color-tinta)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={areasSeleccionadas.includes(a.id)}
                      onChange={() => handleToggleArea(a.id)}
                      className="h-4 w-4 accent-[var(--color-ocre)]"
                    />
                    {a.nombre}
                  </label>
                ))
              )}
            </div>

            {erroresCampos.areas && (
              <p className="text-sm text-red-600 mt-1">
                {erroresCampos.areas}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {exito && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              {exito}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 rounded-md bg-[var(--color-ocre)] text-[var(--color-piedra-clara)] font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors disabled:opacity-60"
          >
            {cargando ? 'Registrando...' : 'Registrar empleado'}
          </button>
        </form>
      </main>
    </div>
  )
}