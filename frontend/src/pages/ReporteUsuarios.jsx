import { useEffect, useState } from 'react'
import ReporteGenerico from '../components/ReporteGenerico'
import { apiFetch } from '../lib/api'

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

const ESTADOS = [
  { valor: 'true', etiqueta: 'Activos' },
  { valor: 'false', etiqueta: 'Inactivos' },
]

const COLUMNAS = [
  { titulo: 'Nombre', valor: (r) => `${r.nombre} ${r.apellido}`.trim() },
  { titulo: 'Correo', valor: (r) => r.email },
  { titulo: 'Rol', valor: (r) => (r.rol === 'Empleado' ? 'Operario' : r.rol) },
  { titulo: 'CUI', valor: (r) => r.cui || '-' },
  { titulo: 'Aldea', valor: (r) => r.aldea || '-' },
  { titulo: 'Teléfono', valor: (r) => r.telefono || '-' },
  { titulo: 'Estado', valor: (r) => (r.activo ? 'Activo' : 'Inactivo') },
]

export default function ReporteUsuarios() {
  const [roles, setRoles] = useState([])
  const [aldeas, setAldeas] = useState([])

  useEffect(() => {
    Promise.all([
      apiFetch('/api/usuarios/roles', { headers: authHeaders() }),
      apiFetch('/api/usuarios/aldeas', { headers: authHeaders() }),
    ])
      .then(([rolesData, aldeasData]) => {
        setRoles(Array.isArray(rolesData) ? rolesData : [])
        setAldeas(Array.isArray(aldeasData) ? aldeasData : [])
      })
      .catch(() => {})
  }, [])

  const campos = [
    {
      nombre: 'rol',
      etiqueta: 'Rol',
      tipo: 'lista',
      opciones: roles.map((r) => ({ valor: r, etiqueta: r === 'Empleado' ? 'Operario' : r })),
    },
    {
      nombre: 'aldeaId',
      etiqueta: 'Aldea o comunidad',
      tipo: 'lista',
      opciones: aldeas.map((a) => ({ valor: a.id, etiqueta: a.nombre })),
    },
    { nombre: 'activo', etiqueta: 'Estado', tipo: 'lista', opciones: ESTADOS },
  ]

  async function cargar(filtros) {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor)
    })

    const data = await apiFetch(`/api/usuarios/reporte?${params.toString()}`, {
      headers: authHeaders(),
    })

    return data?.registros ?? []
  }

  return (
    <ReporteGenerico
      titulo="Reporte de Usuarios"
      archivoPdf="usuarios"
      singular="usuario"
      plural="usuarios"
      campos={campos}
      columnas={COLUMNAS}
      cargar={cargar}
    />
  )
}