import { Check } from 'lucide-react'
import { ETAPAS } from '../lib/estadoCaso'

export default function ProgresoCaso({ etapa }) {
  if (etapa < 0) return null

  const terminado = etapa === ETAPAS.length - 1

  return (
    <ol className="flex items-start">
      {ETAPAS.map((nombre, i) => {
        const completada = i < etapa || terminado
        const actual = i === etapa && !terminado

        return (
          <li key={nombre} className="relative flex-1 flex flex-col items-center">
            {i > 0 && (
              <span
                className={`absolute top-3.5 right-1/2 w-full h-0.5 ${
                  i <= etapa ? 'bg-green-500' : 'bg-[var(--color-azul-piedra)]/20'
                }`}
              />
            )}
            <span
              className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                completada
                  ? 'bg-green-500 border-green-500 text-white'
                  : actual
                  ? 'bg-[var(--color-ocre)] border-[var(--color-ocre)] text-white'
                  : 'bg-white border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)]/60'
              }`}
            >
              {completada ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[11px] text-center leading-tight ${
                completada || actual
                  ? 'text-[var(--color-tinta)] font-medium'
                  : 'text-[var(--color-tinta)]/50'
              }`}
            >
              {nombre}
            </span>
          </li>
        )
      })}
    </ol>
  )
}