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
                className={`absolute top-3 right-1/2 w-full h-0.5 ${
                  i <= etapa ? 'bg-[var(--color-ocre)]' : 'bg-[var(--color-azul-piedra)]/20'
                }`}
              />
            )}
            <span
              className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 ${
                completada
                  ? 'bg-[var(--color-ocre)] border-[var(--color-ocre)] text-white'
                  : actual
                  ? 'bg-white border-[var(--color-ocre)] text-[var(--color-ocre)]'
                  : 'bg-white border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)]/60'
              }`}
            >
              {completada ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`mt-1 text-[10px] text-center leading-tight ${
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