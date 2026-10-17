import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Clock, Users } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/bitacora"
            className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
          >
            <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5 text-[var(--color-verde-institucional)]" />
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
              Auditoría (Bitácora)
            </p>
            <p className="text-sm text-[var(--color-tinta)]/70">
              Consulta el historial completo de acciones registradas en el sistema.
            </p>
          </Link>

          <Link
          to="/admin/reporte-usuarios"
          className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 hover:border-[var(--color-ocre)]/40 transition-colors"
        >
          <div className="h-11 w-11 rounded-lg bg-[var(--color-verde-institucional)]/10 flex items-center justify-center mb-4">
            <Users className="h-5 w-5 text-[var(--color-verde-institucional)]" />
          </div>

          <p className="font-display text-lg font-semibold text-[var(--color-verde-institucional)] mb-1">
            Usuarios registrados
          </p>

          <p className="text-sm text-[var(--color-tinta)]/70">
            Consulta los usuarios registrados por rol, aldea y estado.
          </p>
        </Link>
       
          
        </div>
      </main>
    </div>
  )
}