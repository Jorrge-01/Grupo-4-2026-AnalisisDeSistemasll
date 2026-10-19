import { useEffect, useState } from 'react'
import ReporteGenerico from '../components/ReporteGenerico'
import { apiFetch } from '../lib/api'

const ROLES = [
  { valor: 'Analista', etiqueta: 'Analista' },
  { valor: 'Empleado', etiqueta: 'Operario' },
]

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

const COLUMNAS = [
  { titulo: 'Nombre', valor: (r) => r.nombre },
  { titulo: 'Rol', valor: (r) => (r.rol === 'Empleado' ? 'Operario' : r.rol) },
  { titulo: 'Áreas', valor: (r) => r.areas || 'Sin áreas' },
  { titulo: 'Estado', valor: (r) => (r.activo ? 'Activo' : 'Inactivo') },
  { titulo: 'Casos activos', valor: (r) => r.casosActivos },
  { titulo: 'Casos finalizados', valor: (r) => r.casosFinalizados },
  { titulo: 'Total asignados', valor: (r) => r.totalAsignados },
]

export default function ReporteCarga() {
  const [areas, setAreas] = useState([])

  useEffect(() => {
    apiFetch('/api/reportes/filtros', { headers: authHeaders() })
      .then((data) => setAreas(data?.areas ?? []))
      .catch(() => {})
  }, [])

  const campos = [
    { nombre: 'rol', etiqueta: 'Rol', tipo: 'lista', opciones: ROLES },
    {
      nombre: 'areaId',
      etiqueta: 'Área',
      tipo: 'lista',
      opciones: areas.map((a) => ({ valor: a.id, etiqueta: a.nombre })),
    },
  ]

  async function cargar(filtros) {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor)
    })

    const data = await apiFetch(`/api/reportes/carga-personal?${params.toString()}`, {
      headers: authHeaders(),
    })

    return data?.registros ?? []
  }

  return (
    <ReporteGenerico
      titulo="Carga de Trabajo del Personal"
      archivoPdf="carga_personal"
      singular="empleado"
      plural="empleados"
      campos={campos}
      columnas={COLUMNAS}
      cargar={cargar}
    />
  )
}