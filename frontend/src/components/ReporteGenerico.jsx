import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import HeaderInterno from './HeaderInterno'
import { exportarPdf } from '../lib/reportePdf'

const TAMANO_PAGINA = 25

const inputClass =
  'w-full px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/30 bg-white text-[var(--color-tinta)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)]'

function valoresIniciales(campos) {
  return Object.fromEntries(campos.map((c) => [c.nombre, '']))
}

function textoFiltro(campo, valor) {
  if (!valor) return campo.tipo === 'fecha' ? 'Sin límite' : 'Todos'
  if (campo.tipo === 'fecha') return new Date(`${valor}T00:00:00`).toLocaleDateString('es-GT')
  return campo.opciones.find((o) => String(o.valor) === String(valor))?.etiqueta ?? valor
}

export default function ReporteGenerico({
  titulo,
  archivoPdf,
  singular,
  plural,
  campos,
  columnas,
  cargar,
}) {
  const navigate = useNavigate()

  const [filtros, setFiltros] = useState(() => valoresIniciales(campos))
  const [filtrosAplicados, setFiltrosAplicados] = useState(() => valoresIniciales(campos))
  const [registros, setRegistros] = useState([])
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function consultar(valores) {
    setCargando(true)
    setError('')

    try {
      const datos = await cargar(valores)
      setRegistros(Array.isArray(datos) ? datos : [])
      setFiltrosAplicados(valores)
      setPagina(1)
    } catch (err) {
      setRegistros([])
      setError(err.message || 'No se pudo cargar el reporte.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    consultar(valoresIniciales(campos))
  }, [])

  function handleFiltrar(e) {
    e.preventDefault()
    consultar(filtros)
  }

  function handleLimpiar() {
    const vacios = valoresIniciales(campos)
    setFiltros(vacios)
    consultar(vacios)
  }

  function handleExportar() {
    exportarPdf({
      titulo,
      archivo: archivoPdf,
      filtros: campos.map((c) => [c.etiqueta, textoFiltro(c, filtrosAplicados[c.nombre])]),
      columnas: columnas.map((c) => c.titulo),
      filas: registros.map((r) => columnas.map((c) => String(c.valor(r) ?? '-'))),
    })
  }

  const totalPaginas = Math.ceil(registros.length / TAMANO_PAGINA)

  const visibles = useMemo(
    () => registros.slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA),
    [registros, pagina]
  )

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo={titulo} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin/reportes')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] mb-6 transition-colors"
        >
          ← Volver a reportes
        </button>

        <form
          onSubmit={handleFiltrar}
          className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6 mb-6"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {campos.map((campo) => (
              <div key={campo.nombre}>
                <label className="block text-xs font-medium text-[var(--color-tinta)]/70 mb-1">
                  {campo.etiqueta}
                </label>

                {campo.tipo === 'fecha' ? (
                  <input
                    type="date"
                    value={filtros[campo.nombre]}
                    onChange={(e) =>
                      setFiltros((p) => ({ ...p, [campo.nombre]: e.target.value }))
                    }
                    className={inputClass}
                  />
                ) : (
                  <select
                    value={filtros[campo.nombre]}
                    onChange={(e) =>
                      setFiltros((p) => ({ ...p, [campo.nombre]: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    {campo.opciones.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.etiqueta}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-md bg-[var(--color-ocre)] text-white text-sm font-semibold hover:bg-[var(--color-ocre-claro)] transition-colors"
              >
                Filtrar
              </button>

              <button
                type="button"
                onClick={handleLimpiar}
                className="flex-1 py-2 rounded-md border border-[var(--color-azul-piedra)]/30 text-sm text-[var(--color-tinta)]/70 hover:bg-[var(--color-piedra)] transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[var(--color-tinta)]/60">
            {registros.length} {registros.length === 1 ? `${singular} encontrado` : `${plural} encontrados`}
          </p>

          <button
            onClick={handleExportar}
            disabled={registros.length === 0}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)] hover:border-[var(--color-ocre)] hover:text-[var(--color-ocre)] transition-colors disabled:opacity-40"
          >
            <FileDown className="h-4 w-4" />
            Exportar a PDF
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
          {cargando ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">Cargando...</p>
          ) : registros.length === 0 ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">
              No hay registros para los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-verde-institucional)] text-[var(--color-piedra-clara)]">
                    {columnas.map((c) => (
                      <th key={c.titulo} className="text-left px-4 py-3 font-medium">
                        {c.titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--color-azul-piedra)]/10">
                  {visibles.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--color-piedra)]/50">
                      {columnas.map((c) => (
                        <td key={c.titulo} className="px-4 py-3 text-[var(--color-tinta)]/80">
                          {c.valor(r) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>

            <span className="text-sm text-[var(--color-tinta)]/60">
              Página {pagina} de {totalPaginas}
            </span>

            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] disabled:opacity-30 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}