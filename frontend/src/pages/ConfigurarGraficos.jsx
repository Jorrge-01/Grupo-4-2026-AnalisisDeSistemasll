import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Target, RotateCcw } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { CATALOGO, ETIQUETA_TIPO, cargarConfig, guardarConfig } from '../lib/graficosConfig'

const DESCRIPCIONES = {
  estado: 'Cuántos casos hay en cada estado.',
  area: 'Cuántos casos tiene cada área municipal.',
  aldea: 'Las aldeas con más casos registrados.',
  analista: 'Casos asignados a cada analista.',
  operario: 'Casos activos y finalizados de cada operario.',
  personal: 'Analistas y operarios activos en cada área.',
  aldeaarea: 'Qué tipo de problema predomina en cada aldea.',
  tiempo: 'Casos registrados mes a mes.',
  embudo: 'Cuántos casos llegan a cada etapa del ciclo de vida.',
  apilado: 'En qué etapa está cada caso, separado por área.',
  resolucion: 'Porcentaje de casos resueltos.',
}

export default function ConfigurarGraficos() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(cargarConfig)
  const { visibles, tipos } = config

  function aplicar(nuevosVisibles, nuevosTipos) {
    guardarConfig(nuevosVisibles, nuevosTipos)
    setConfig({ visibles: nuevosVisibles, tipos: nuevosTipos })
  }

  function alternar(id) {
    aplicar({ ...visibles, [id]: !visibles[id] }, tipos)
  }

  function fijarTodos(valor) {
    const nuevos = {}
    CATALOGO.forEach((g) => {
      nuevos[g.id] = valor
    })
    aplicar(nuevos, tipos)
  }

  function soloEste(id) {
    const nuevos = {}
    CATALOGO.forEach((g) => {
      nuevos[g.id] = g.id === id
    })
    aplicar(nuevos, tipos)
  }

  function cambiarTipo(id, tipo) {
    aplicar(visibles, { ...tipos, [id]: tipo })
  }

  const totalVisibles = CATALOGO.filter((g) => visibles[g.id]).length

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Configurar gráficos" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin/casos')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors mb-6"
        >
          ← Volver a gestión de casos
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-[var(--color-tinta)]/70">
            {totalVisibles} de {CATALOGO.length} gráficos visibles en el dashboard. Los cambios se guardan al instante.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fijarTodos(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Mostrar todos
            </button>
            <button
              type="button"
              onClick={() => fijarTodos(false)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-tinta)]/70 bg-black/5 hover:bg-black/10 transition-colors"
            >
              Ocultar todos
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 divide-y divide-[var(--color-azul-piedra)]/10">
          {CATALOGO.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-3 p-4">
              <button
                type="button"
                role="switch"
                aria-checked={visibles[g.id]}
                onClick={() => alternar(g.id)}
                title={visibles[g.id] ? 'Ocultar' : 'Mostrar'}
                className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                  visibles[g.id] ? 'bg-[var(--color-verde-institucional)]' : 'bg-black/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    visibles[g.id] ? 'translate-x-5' : ''
                  }`}
                />
              </button>

              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-[var(--color-tinta)] flex items-center gap-1.5">
                  {visibles[g.id] ? (
                    <Eye className="h-3.5 w-3.5 text-[var(--color-verde-institucional)]" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-[var(--color-tinta)]/40" />
                  )}
                  {g.titulo}
                </p>
                <p className="text-xs text-[var(--color-tinta)]/50 mt-0.5">{DESCRIPCIONES[g.id]}</p>
              </div>

              {g.tipos.length > 1 && (
                <div className="flex rounded-full bg-black/5 p-0.5">
                  {g.tipos.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => cambiarTipo(g.id, t)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        tipos[g.id] === t ? 'bg-white text-[var(--color-tinta)] shadow-sm' : 'text-[var(--color-tinta)]/60 hover:text-[var(--color-tinta)]'
                      }`}
                    >
                      {ETIQUETA_TIPO[t]}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => soloEste(g.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
              >
                <Target className="h-3 w-3" />
                Solo este
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/casos')}
          className="mt-6 px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-verde-institucional)] hover:opacity-90 transition-opacity"
        >
          Ver dashboard
        </button>
      </main>
    </div>
  )
}