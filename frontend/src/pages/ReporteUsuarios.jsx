import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'

const TAMANO_PAGINA = 25

export default function ReporteUsuarios() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [roles, setRoles] = useState([])
  const [aldeas, setAldeas] = useState([])

  const [filtroRol, setFiltroRol] = useState('')
  const [filtroAldea, setFiltroAldea] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  async function cargarFiltros() {
    try {
      const [rolesData, aldeasData] = await Promise.all([
        apiFetch('/api/usuarios/roles', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        apiFetch('/api/usuarios/aldeas', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ])

      setRoles(rolesData)
      setAldeas(aldeasData)
    } catch (err) {
      // Los filtros no deben impedir cargar el reporte
    }
  }

  async function cargar() {
    setCargando(true)
    setError('')

    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        tamano: TAMANO_PAGINA.toString(),
      })

      if (filtroRol) {
        params.append('rol', filtroRol)
      }

      if (filtroAldea) {
        params.append('aldea', filtroAldea)
      }

      if (filtroEstado !== '') {
        params.append('activo', filtroEstado)
      }

      const data = await apiFetch(
        `/api/usuarios/reporte?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      setUsuarios(data.registros)
      setTotal(data.total)
    } catch (err) {
      setError('No se pudo cargar el reporte de usuarios.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarFiltros()
  }, [])

  useEffect(() => {
    cargar()
  }, [pagina])

  function handleFiltrar(e) {
    e.preventDefault()
    setPagina(1)

    setTimeout(() => {
      cargar()
    }, 0)
  }

  function handleLimpiar() {
    setFiltroRol('')
    setFiltroAldea('')
    setFiltroEstado('')
    setPagina(1)

    setTimeout(() => {
      cargar()
    }, 0)
  }

  function handleExportarCsv() {
    const encabezados = [
      'Nombre',
      'Apellido',
      'Correo',
      'Rol',
      'CUI',
      'Aldea',
      'Teléfono',
      'Estado',
      'Fecha de registro',
    ]

    const filas = usuarios.map((u) => [
      u.nombre || '',
      u.apellido || '',
      u.email || '',
      u.rol || '',
      u.cui || '',
      u.aldea || '',
      u.telefono || '',
      u.activo ? 'Activo' : 'Inactivo',
      u.fechaCreacion
        ? new Date(u.fechaCreacion).toLocaleString('es-GT')
        : '',
    ])

    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob(
      ['\ufeff' + csv],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`

    link.click()

    URL.revokeObjectURL(url)
  }

  const totalPaginas = Math.ceil(total / TAMANO_PAGINA)

  const inputClass =
    'w-full px-3 py-2 rounded-md border border-[var(--color-azul-piedra)]/30 bg-white text-[var(--color-tinta)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ocre)]'

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Reporte de Usuarios" />

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

            <div>
              <label className="block text-xs font-medium text-[var(--color-tinta)]/70 mb-1">
                Rol
              </label>

              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos</option>

                {roles.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-tinta)]/70 mb-1">
                Aldea o comunidad
              </label>

              <select
                value={filtroAldea}
                onChange={(e) => setFiltroAldea(e.target.value)}
                className={inputClass}
              >
                <option value="">Todas</option>

                {aldeas.map((aldea) => (
                  <option key={aldea} value={aldea}>
                    {aldea}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-tinta)]/70 mb-1">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

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
            {total} {total === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
          </p>

          <button
            onClick={handleExportarCsv}
            disabled={usuarios.length === 0}
            className="text-sm px-4 py-2 rounded-md border border-[var(--color-azul-piedra)]/30 text-[var(--color-azul-piedra)] hover:border-[var(--color-ocre)] hover:text-[var(--color-ocre)] transition-colors disabled:opacity-40"
          >
            Exportar página a CSV
          </button>

        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">

          {cargando ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">
              Cargando...
            </p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-[var(--color-tinta)]/60 p-6">
              No hay usuarios para los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="bg-[var(--color-verde-institucional)] text-[var(--color-piedra-clara)]">

                    <th className="text-left px-4 py-3 font-medium">
                      Nombre
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Correo
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Rol
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      CUI
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Aldea
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Teléfono
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--color-azul-piedra)]/10">

                  {usuarios.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--color-piedra)]/50"
                    >

                      <td className="px-4 py-3 text-[var(--color-tinta)]">
                        {u.nombre} {u.apellido}
                      </td>

                      <td className="px-4 py-3 text-[var(--color-tinta)]/80">
                        {u.email}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-azul-piedra)]/10 text-[var(--color-azul-piedra)]">
                          {u.rol}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[var(--color-tinta)]/70">
                        {u.cui || '—'}
                      </td>

                      <td className="px-4 py-3 text-[var(--color-tinta)]/80">
                        {u.aldea || '—'}
                      </td>

                      <td className="px-4 py-3 text-[var(--color-tinta)]/70">
                        {u.telefono || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            u.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

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
              onClick={() =>
                setPagina((p) => Math.max(1, p - 1))
              }
              disabled={pagina === 1}
              className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>

            <span className="text-sm text-[var(--color-tinta)]/60">
              Página {pagina} de {totalPaginas}
            </span>

            <button
              onClick={() =>
                setPagina((p) =>
                  Math.min(totalPaginas, p + 1)
                )
              }
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