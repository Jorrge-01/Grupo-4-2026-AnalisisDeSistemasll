import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, ClipboardList, BarChart3 } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'

const REPORTES = [
  {
    ruta: '/admin/reporte-usuarios',
    icono: Users,
    titulo: 'Usuarios registrados',
    descripcion: 'Consulta los usuarios registrados por rol, aldea y estado.',
  },
  {
    ruta: '/admin/reporte-casos',
    icono: ClipboardList,
    titulo: 'Casos registrados',
    descripcion: 'Consulta los casos por estado, área, aldea y rango de fechas.',
  },
  {
    ruta: '/admin/reporte-carga',
    icono: BarChart3,
    titulo: 'Carga de trabajo del personal',
    descripcion: 'Consulta los casos activos y finalizados de analistas y operarios.',
  },
]

const AUDITORIA = [
  {
    ruta: '/admin/bitacora',
    icono: ShieldCheck,
    titulo: 'Auditoría (Bitácora)',
    descripcion: 'Consulta el historial completo de acciones registradas en el sistema.',
  },
]

function Tarjeta({ ruta, icono: Icono, titulo, descripcion }) {
  return (
    <Link
      to={ruta}
      className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
    >
      <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
        <Icono className="h-5 w-5 text-[var(--color-verde-institucional)]" />
      </div>
      <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
        {titulo}
      </p>
      <p className="text-sm text-[var(--color-tinta)]/70">{descripcion}</p>
    </Link>
  )
}

function Seccion({ titulo, descripcion, items }) {
  return (
    <section className="mb-10">
      <div className="mb-4 pb-3 border-b border-[var(--color-azul-piedra)]/15">
        <h2 className="font-display text-xl font-semibold text-[var(--color-verde-institucional)]">
          {titulo}
        </h2>
        <p className="text-sm text-[var(--color-tinta)]/60 mt-0.5">{descripcion}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Tarjeta key={item.ruta} {...item} />
        ))}
      </div>
    </section>
  )
}

export default function Reportes() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Reportes" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver al panel
        </button>

        <Seccion
          titulo="Reportes"
          descripcion="Consulta la información del sistema y expórtala en PDF."
          items={REPORTES}
        />

        <Seccion
          titulo="Auditoría"
          descripcion="Registro de las acciones realizadas por los usuarios del sistema."
          items={AUDITORIA}
        />
      </main>
    </div>
  )
}