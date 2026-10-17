import { Paperclip, FileText, Wrench } from 'lucide-react'

function Galeria({ archivos, compacto }) {
  return (
    <div className={compacto ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 sm:grid-cols-4 gap-3'}>
      {archivos.map((archivo) => {
        const esImagen = archivo.tipoContenido?.startsWith('image/')
        const alto = compacto ? 'h-20' : 'h-28'

        return (
          <a
            key={archivo.id}
            href={archivo.rutaArchivo}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            {esImagen ? (
              <div className={`${alto} rounded-lg overflow-hidden border border-[var(--color-azul-piedra)]/20 group-hover:border-[var(--color-ocre)] transition-colors`}>
                <img
                  src={archivo.rutaArchivo}
                  alt={archivo.nombreArchivo}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className={`${alto} rounded-lg border border-[var(--color-azul-piedra)]/20 bg-white/50 flex flex-col items-center justify-center gap-1.5 px-2 group-hover:border-[var(--color-ocre)] transition-colors`}>
                <FileText className="h-6 w-6 text-[var(--color-ocre)]" />
                <span className="text-xs text-[var(--color-tinta)] text-center truncate max-w-full">
                  {archivo.nombreArchivo}
                </span>
              </div>
            )}
          </a>
        )
      })}
    </div>
  )
}

export default function EvidenciaCaso({ archivos, compacto = false }) {
  const lista = archivos ?? []
  const delVecino = lista.filter((a) => !a.esEvidenciaTrabajo)
  const delTrabajo = lista.filter((a) => a.esEvidenciaTrabajo)

  if (lista.length === 0) return null

  return (
    <div className="space-y-6">
      {delVecino.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-4 w-4 text-[var(--color-azul-piedra)]" />
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
              Evidencia del vecino ({delVecino.length})
            </p>
          </div>
          <Galeria archivos={delVecino} compacto={compacto} />
        </div>
      )}

      {delTrabajo.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-[var(--color-verde-institucional)]" />
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-tinta)]/50">
              Evidencia del trabajo realizado ({delTrabajo.length})
            </p>
          </div>
          <Galeria archivos={delTrabajo} compacto={compacto} />
        </div>
      )}
    </div>
  )
}
