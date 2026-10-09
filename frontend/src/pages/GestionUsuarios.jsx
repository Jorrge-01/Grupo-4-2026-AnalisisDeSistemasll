import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Briefcase } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'
import ModalExito from '../components/ModalExito'
import ModalConfirmacion from '../components/ModalConfirmacion'
import ModalCargando from '../components/ModalCargando'

export default function GestionUsuarios() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')
const [usuarioAConfirmar, setUsuarioAConfirmar] = useState(null)
const [enviandoReset, setEnviandoReset] = useState(false)
  async function cargarUsuarios() {
    setCargandoLista(true)
    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch('/api/auth/usuarios', { 
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsuarios(data)
    } catch (err) {
      setError('No se pudo cargar el listado de usuarios.')
    } finally {
      setCargandoLista(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

 async function handleToggleActivo(u) {
  setError('')
  try {
    const token = localStorage.getItem('token')
    const data = await apiFetch(`/api/auth/usuarios/${u.id}/toggle-activo`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    setExito(data.mensaje || `${u.nombre} ${u.apellido} actualizado correctamente.`)
    await cargarUsuarios()
  } catch (err) {
    setError('No se pudo actualizar el estado del usuario.')
  }
}

 function handleResetPassword(u) {
  setUsuarioAConfirmar(u)
}


async function confirmarResetPassword() {
  const u = usuarioAConfirmar
  setUsuarioAConfirmar(null)
  setEnviandoReset(true)
  try {
    const token = localStorage.getItem('token')
    await apiFetch(`/api/auth/usuarios/${u.id}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    setExito(`Se envió una contraseña temporal a ${u.email}.`)
  } catch (err) {
    setError('No se pudo restablecer la contraseña.')
  } finally {
    setEnviandoReset(false)
  }
}

  const roles = ['Todos', 'Vecino', 'Analista', 'Empleado', 'Administrador']
  const etiquetaRol = (r) => (r === 'Empleado' ? 'Operario' : r)
  const usuariosFiltrados = filtroRol === 'Todos'
    ? usuarios
    : usuarios.filter((u) => u.roles.includes(filtroRol))

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Usuarios" />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver al panel
        </button>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          
          <Link
            to="/admin/usuarios/empleado"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-6 w-6 text-[var(--color-verde-institucional)]" />
            </div>
            <div>
              <p className="font-display font-semibold text-[var(--color-verde-institucional)]">Nuevo Empleado Municipal</p>
              <p className="text-sm text-[var(--color-tinta)]/70">Analista u Operario, con sus áreas asignadas.</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                filtroRol === r
                  ? 'bg-[var(--color-verde-institucional)] text-white border-[var(--color-verde-institucional)]'
                  : 'border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)] hover:border-[var(--color-ocre)]'
              }`}
            >
              {etiquetaRol(r)}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>}
        {exito && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">{exito}</p>}

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          {cargandoLista ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">Cargando...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">Actualmente no existen registros para mostrar.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-azul-piedra)]/10">
              {usuariosFiltrados.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${u.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[var(--color-tinta)] font-medium">{u.nombre} {u.apellido}</span>
                      {u.roles.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-azul-piedra)]/10 text-[var(--color-azul-piedra)]">
                          {etiquetaRol(r)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[var(--color-tinta)]/60 truncate">
                      {u.email}
                      {u.areas && u.areas.length > 0 ? ` · ${u.areas.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors"
                    >
                      Restablecer contraseña
                    </button>
                    <button
                      onClick={() => handleToggleActivo(u)}
                      className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors"
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <ModalConfirmacion
  visible={!!usuarioAConfirmar}
  titulo="Restablecer contraseña"
  mensaje={usuarioAConfirmar ? `¿Restablecer la contraseña de ${usuarioAConfirmar.nombre} ${usuarioAConfirmar.apellido}? Se le enviará una temporal por correo.` : ''}
  onConfirmar={confirmarResetPassword}
  onCancelar={() => setUsuarioAConfirmar(null)}
/>

<ModalExito
  mensaje={exito}
  onCerrar={() => setExito('')}
/>
<ModalCargando visible={enviandoReset} mensaje="Generando contraseña temporal y notificando por correo." />
    </div>
  )
}