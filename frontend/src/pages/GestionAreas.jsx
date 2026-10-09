import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'
import { traducirError } from '../lib/traducirError'
import ModalConfirmacion from '../components/ModalConfirmacion'
import ModalExito from '../components/ModalExito'
import ModalCargando from '../components/ModalCargando'

const formVacio = {
  nombre: '',
  aplicaQueja: true,
  aplicaReclamo: true,
  aplicaSugerencia: true,
}

export default function GestionAreas() {
  const navigate = useNavigate()

  const [areas, setAreas] = useState([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [procesando, setProcesando] = useState(false)

  const [form, setForm] = useState(formVacio)
  const [cargando, setCargando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [formEdicion, setFormEdicion] = useState(formVacio)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  const [areaAEliminar, setAreaAEliminar] = useState(null)

  async function cargar() {
    setCargandoLista(true)
    try {
      const data = await apiFetch('/api/areas')
      setAreas(data)
    } catch (err) {
      setError('No se pudo cargar el listado de áreas.')
    } finally {
      setCargandoLista(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleFormEdicionChange(e) {
    const { name, value, type, checked } = e.target
    setFormEdicion((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleCrear(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      await apiFetch('/api/areas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      setForm(formVacio)
      setExito('Área creada correctamente.')
      await cargar()
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo crear el área.')
    } finally {
      setCargando(false)
    }
  }

  function handleIniciarEdicion(area) {
    setEditandoId(area.id)
    setFormEdicion({
      nombre: area.nombre,
      aplicaQueja: area.aplicaQueja,
      aplicaReclamo: area.aplicaReclamo,
      aplicaSugerencia: area.aplicaSugerencia,
      activo: area.activo,
    })
    setError('')
  }

  function handleCancelarEdicion() {
    setEditandoId(null)
  }

  async function handleGuardarEdicion(area) {
    if (!formEdicion.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setGuardandoEdicion(true)
    try {
      const token = localStorage.getItem('token')
      await apiFetch(`/api/areas/${area.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(formEdicion),
      })
      setEditandoId(null)
      setExito('Área actualizada correctamente.')
      await cargar()
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo actualizar el área.')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function handleToggleActivo(area) {
    setError('')
    try {
      const token = localStorage.getItem('token')
      await apiFetch(`/api/areas/${area.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: area.nombre,
          aplicaQueja: area.aplicaQueja,
          aplicaReclamo: area.aplicaReclamo,
          aplicaSugerencia: area.aplicaSugerencia,
          activo: !area.activo,
        }),
      })
      setExito(`${area.nombre} fue ${!area.activo ? 'activada' : 'desactivada'} correctamente.`)
      await cargar()
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo actualizar el estado.')
    }
  }

  function handlePedirEliminar(area) {
    setError('')
    setAreaAEliminar(area)
  }

  async function confirmarEliminar() {
    const area = areaAEliminar
    setAreaAEliminar(null)
    setProcesando(true)
    try {
      const token = localStorage.getItem('token')
      await apiFetch(`/api/areas/${area.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setExito(`"${area.nombre}" se eliminó correctamente.`)
      await cargar()
    } catch (err) {
      setError(traducirError(err.message) || 'No se pudo eliminar el área.')
    } finally {
      setProcesando(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-md border border-[var(--color-azul-piedra)]/30 bg-white text-[var(--color-tinta)] placeholder:text-[var(--color-azul-piedra)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)] transition-shadow'
  const labelClass = 'block text-sm font-medium text-[var(--color-tinta)] mb-1.5'
  const checkboxLabel = 'flex items-center gap-2 text-sm text-[var(--color-tinta)]'

  const opcionesAplicabilidad = [
    { name: 'aplicaQueja', label: 'Queja' },
    { name: 'aplicaReclamo', label: 'Reclamo' },
    { name: 'aplicaSugerencia', label: 'Sugerencia' },
  ]

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Áreas" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver al panel
        </button>

        <form onSubmit={handleCrear} className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 mb-8 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)]">
            Agregar área
          </h2>

          <div>
            <label className={labelClass}>Nombre</label>
            <input name="nombre" type="text" value={form.nombre} onChange={handleFormChange}
              placeholder="Ej. Agua Potable" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Aplica a los siguientes tipos de caso</label>
            <div className="flex flex-wrap gap-4">
              {opcionesAplicabilidad.map((op) => (
                <label key={op.name} className={checkboxLabel}>
                  <input
                    type="checkbox"
                    name={op.name}
                    checked={form[op.name]}
                    onChange={handleFormChange}
                    className="h-4 w-4 accent-[var(--color-ocre)]"
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={cargando}
            className="px-6 py-2.5 rounded-md bg-[var(--color-ocre)] text-[var(--color-piedra-clara)] font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors disabled:opacity-60">
            {cargando ? 'Agregando...' : 'Agregar área'}
          </button>
        </form>

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          <h2 className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] p-6 pb-0">
            Listado actual
          </h2>

          {cargandoLista ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">Cargando...</p>
          ) : areas.length === 0 ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">No hay áreas registradas todavía.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
              {areas.map((a) => (
                <li key={a.id} className="px-6 py-4">
                  {editandoId === a.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="nombre"
                        value={formEdicion.nombre}
                        onChange={handleFormEdicionChange}
                        className={inputClass}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-4">
                        {opcionesAplicabilidad.map((op) => (
                          <label key={op.name} className={checkboxLabel}>
                            <input
                              type="checkbox"
                              name={op.name}
                              checked={formEdicion[op.name]}
                              onChange={handleFormEdicionChange}
                              className="h-4 w-4 accent-[var(--color-ocre)]"
                            />
                            {op.label}
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleGuardarEdicion(a)}
                          disabled={guardandoEdicion}
                          className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-60"
                        >
                          {guardandoEdicion ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={handleCancelarEdicion}
                          className="text-sm text-[var(--color-tinta)]/60 hover:text-[var(--color-tinta)] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-[var(--color-tinta)] font-medium">{a.nombre}</span>
                        </div>
                        <p className="text-xs text-[var(--color-azul-piedra)] mt-1">
                          {[
                            a.aplicaQueja && 'Queja',
                            a.aplicaReclamo && 'Reclamo',
                            a.aplicaSugerencia && 'Sugerencia',
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <button
                          onClick={() => handleIniciarEdicion(a)}
                          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActivo(a)}
                          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors"
                        >
                          {a.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handlePedirEliminar(a)}
                          className="text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <ModalConfirmacion
        visible={!!areaAEliminar}
        titulo="Eliminar área"
        mensaje={areaAEliminar ? `¿Eliminar el área "${areaAEliminar.nombre}"?` : ''}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAreaAEliminar(null)}
      />
      <ModalCargando visible={procesando} mensaje="Eliminando área..." />
      <ModalExito mensaje={exito} onCerrar={() => setExito('')} />
    </div>
  )
}