import { useEffect, useState } from 'react'
import ReporteGenerico from '../components/ReporteGenerico'
import { apiFetch } from '../lib/api'

const ETIQUETAS_ESTADO = {
  Registrada: 'Registrada',
  Asignada: 'Asignada',
  EnValidacion: 'En validación',
  PendienteInformacion: 'Pendiente de información',
  EnAnalisis: 'En análisis',
  AsignadaAOperario: 'Asignada a operario',
  EnEjecucion: 'En ejecución',
  TrabajoRealizado: 'Trabajo realizado',
  EnVerificacion: 'En verificación',
  Solucionada: 'Solucionada',
  Finalizada: 'Finalizada',
  NoProcedente: 'No procedente',
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function formatearFecha(valor) {
  return valor ? new Date(valor).toLocaleString('es-GT') : ''
}

const COLUMNAS = [
  { titulo: 'Código', valor: (r) => r.codigo },
  { titulo: 'Estado', valor: (r) => ETIQUETAS_ESTADO[r.estado] ?? r.estado },
  { titulo: 'Área', valor: (r) => r.area },
  { titulo: 'Aldea', valor: (r) => r.aldea },
  { titulo: 'Vecino', valor: (r) => r.vecino },
  { titulo: 'Analista', valor: (r) => r.analista || 'Sin asignar' },
  { titulo: 'Fecha de registro', valor: (r) => formatearFecha(r.fechaRegistro) },
]

export default function ReporteCasos() {
  const [opciones, setOpciones] = useState({ areas: [], aldeas: [], estados: [] })

  useEffect(() => {
    apiFetch('/api/reportes/filtros', { headers: authHeaders() })
      .then((data) =>
        setOpciones({
          areas: data?.areas ?? [],
          aldeas: data?.aldeas ?? [],
          estados: data?.estados ?? [],
        })
      )
      .catch(() => {})
  }, [])

  const campos = [
    {
      nombre: 'estado',
      etiqueta: 'Estado',
      tipo: 'lista',
      opciones: opciones.estados.map((e) => ({ valor: e, etiqueta: ETIQUETAS_ESTADO[e] ?? e })),
    },
    {
      nombre: 'areaId',
      etiqueta: 'Área',
      tipo: 'lista',
      opciones: opciones.areas.map((a) => ({ valor: a.id, etiqueta: a.nombre })),
    },
    {
      nombre: 'aldeaId',
      etiqueta: 'Aldea o comunidad',
      tipo: 'lista',
      opciones: opciones.aldeas.map((a) => ({ valor: a.id, etiqueta: a.nombre })),
    },
    { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' },
  ]

  async function cargar(filtros) {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor)
    })

    const data = await apiFetch(`/api/reportes/casos?${params.toString()}`, {
      headers: authHeaders(),
    })

    return data?.registros ?? []
  }

  return (
    <ReporteGenerico
      titulo="Reporte de Casos"
      archivoPdf="casos"
      singular="caso"
      plural="casos"
      campos={campos}
      columnas={COLUMNAS}
      cargar={cargar}
    />
  )
}