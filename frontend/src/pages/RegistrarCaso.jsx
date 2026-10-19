import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderInterno from '../components/HeaderInterno'
import ModalCargando from '../components/ModalCargando'
import ModalExito from '../components/ModalExito'
import { apiFetch, API_BASE_URL } from '../lib/api'
import SubidaEvidencia from '../components/SubidaEvidencia'

export default function RegistrarCaso() {
  const navigate = useNavigate()

  const [areas, setAreas] = useState([])
  const [aldeas, setAldeas] = useState([])
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [codigoCaso, setCodigoCaso] = useState('')

  const [form, setForm] = useState({
    areaId: '',
    aldeaId: '',
    direccion: '',
    telefonoContacto: '',
    descripcion: '',
  })

  const [errores, setErrores] = useState({})

  const [fotos, setFotos] = useState([])
  const [documento, setDocumento] = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      setCargandoDatos(true)
      try {
        const token = localStorage.getItem('token')
        const [areasData, aldeasData] = await Promise.all([
          apiFetch('/api/Casos/areas-quejas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch('/api/Casos/aldeas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setAreas(areasData)
        setAldeas(aldeasData)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos del formulario.')
      } finally {
        setCargandoDatos(false)
      }
    }

    cargarDatos()
  }, [])

  function limpiarError(name) {
    setErrores((p) => {
      if (!p[name]) return p
      const copia = { ...p }
      delete copia[name]
      return copia
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    limpiarError(name)

    if (name === 'telefonoContacto') {
      setForm((p) => ({
        ...p,
        telefonoContacto: value.replace(/\D/g, '').slice(0, 8),
      }))
      return
    }

    setForm((p) => ({ ...p, [name]: value }))
  }

  async function subirEvidencia(casoId, token) {
    if (fotos.length === 0 && !documento) return

    const formData = new FormData()
    fotos.forEach((f) => formData.append('archivos', f.file))
    if (documento) formData.append('archivos', documento)

    const res = await fetch(`${API_BASE_URL}/api/Casos/${casoId}/evidencia`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.mensaje || 'No se pudo subir la evidencia.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    const nuevosErrores = {}
    const MSJ_01 = 'Completa este campo.'

    if (!form.areaId) nuevosErrores.areaId = MSJ_01
    if (!form.aldeaId) nuevosErrores.aldeaId = MSJ_01
    if (!form.direccion.trim()) nuevosErrores.direccion = MSJ_01
    if (!form.telefonoContacto) nuevosErrores.telefonoContacto = MSJ_01
    else if (form.telefonoContacto.length !== 8) nuevosErrores.telefonoContacto = 'El teléfono debe tener 8 dígitos.'
    if (!form.descripcion.trim()) nuevosErrores.descripcion = MSJ_01

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    setErrores({})

    setGuardando(true)

    try {
      const token = localStorage.getItem('token')

      const data = await apiFetch('/api/Casos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          areaId: Number(form.areaId),
          aldeaId: Number(form.aldeaId),
          direccion: form.direccion.trim(),
          telefonoContacto: form.telefonoContacto,
          descripcion: form.descripcion.trim(),
        }),
      })

      try {
        await subirEvidencia(data.id, token)
      } catch (errEvidencia) {
        console.error('Error al subir evidencia:', errEvidencia)
      }

      setCodigoCaso(data.codigo)
      setExito(`Tu queja fue registrada correctamente con el código ${data.codigo}.`)
    } catch (err) {
      setError(err.message || 'No se pudo registrar la queja.')
    } finally {
      setGuardando(false)
    }
  }

  function cerrarExito() {
    setExito('')
    navigate('/vecino')
  }

  const claseInput = (name) => `w-full px-4 py-2.5 rounded-md border ${errores[name] ? 'border-red-500' : 'border-[var(--color-azul-piedra)]/30'} bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)] transition-shadow`
  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Registrar una queja" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          type="button"
          onClick={() => navigate('/vecino')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver a mi portal
        </button>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-8 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)]">
              Registrar una queja
            </h2>
            <p className="text-sm text-[var(--color-tinta)]/60 mt-1">
              Completa la información para reportar un problema a la municipalidad.
            </p>
          </div>

          {cargandoDatos ? (
            <p className="text-sm text-[var(--color-tinta)]/60">
              Cargando información...
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    Tipo de queja <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="areaId"
                    value={form.areaId}
                    onChange={handleChange}
                    className={claseInput('areaId')}
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                  {errores.areaId && (
                    <p className="text-xs text-red-600 mt-1">{errores.areaId}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Aldea o comunidad <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="aldeaId"
                    value={form.aldeaId}
                    onChange={handleChange}
                    className={claseInput('aldeaId')}
                  >
                    <option value="">Selecciona una opción</option>
                    {aldeas.map((aldea) => (
                      <option key={aldea.id} value={aldea.id}>
                        {aldea.nombre}
                      </option>
                    ))}
                  </select>
                  {errores.aldeaId && (
                    <p className="text-xs text-red-600 mt-1">{errores.aldeaId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Dirección donde ocurre la queja <span className="text-red-600">*</span>
                </label>
                <input
                  name="direccion"
                  maxLength={120}
                  value={form.direccion}
                  onChange={handleChange}
                  className={claseInput('direccion')}
                  placeholder="Ej. 3a calle zona 2, frente al parque"
                />
                {errores.direccion && (
                  <p className="text-xs text-red-600 mt-1">{errores.direccion}</p>
                )}
                <p className="text-xs text-[var(--color-tinta)]/50 mt-1">
                  {form.direccion.length}/120 caracteres
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Teléfono de contacto <span className="text-red-600">*</span>
                </label>
                <input
                  name="telefonoContacto"
                  inputMode="numeric"
                  maxLength={8}
                  value={form.telefonoContacto}
                  onChange={handleChange}
                  className={claseInput('telefonoContacto')}
                  placeholder="Ej. 55551234"
                />
                {errores.telefonoContacto && (
                  <p className="text-xs text-red-600 mt-1">{errores.telefonoContacto}</p>
                )}
                <p className="text-xs text-[var(--color-tinta)]/50 mt-1">
                 
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Descripción de la queja <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="descripcion"
                  maxLength={2000}
                  rows={6}
                  value={form.descripcion}
                  onChange={handleChange}
                  className={`${claseInput('descripcion')} resize-y`}
                  placeholder="Describe con claridad el problema que deseas reportar..."
                />
                {errores.descripcion && (
                  <p className="text-xs text-red-600 mt-1">{errores.descripcion}</p>
                )}
                <p className="text-xs text-[var(--color-tinta)]/50 mt-1">
                  {form.descripcion.length}/2000 caracteres
                </p>
              </div>

              <SubidaEvidencia
                fotos={fotos}
                setFotos={setFotos}
                documento={documento}
                setDocumento={setDocumento}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/vecino')}
              className="flex-1 py-2.5 rounded-md border border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)] font-semibold hover:bg-[var(--color-piedra)] transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || cargandoDatos}
              className="flex-1 py-2.5 rounded-md bg-[var(--color-ocre)] text-[var(--color-piedra-clara)] font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors disabled:opacity-60"
            >
              {guardando ? 'Registrando...' : 'Registrar queja'}
            </button>
          </div>
        </form>
      </main>

      <ModalCargando
        visible={guardando}
        mensaje="Registrando tu queja..."
      />

      <ModalExito
        titulo="¡Queja registrada!"
        mensaje={exito}
        onCerrar={cerrarExito}
      />
    </div>
  )
}