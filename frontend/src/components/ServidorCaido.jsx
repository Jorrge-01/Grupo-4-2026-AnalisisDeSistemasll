import { ServerCrash, RefreshCw } from 'lucide-react'

export default function ServidorCaido() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">

        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ServerCrash className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-[var(--color-verde-institucional)] mb-2">
          No pudimos conectar con el servidor
        </h1>

        <p className="text-sm text-[var(--color-tinta)]/70 mb-8">
          El sistema no está disponible en este momento. Puede ser un problema temporal de conexión o que el servicio esté en mantenimiento. Intenta de nuevo en unos minutos.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-ocre)] text-white text-sm font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>

      </div>
    </div>
  )
}