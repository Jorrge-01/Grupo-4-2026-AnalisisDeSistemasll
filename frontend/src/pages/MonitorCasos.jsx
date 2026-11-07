import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Pause, Play, RefreshCw } from 'lucide-react'
import HeaderInterno from '../components/HeaderInterno'
import { apiFetch } from '../lib/api'

const INTERVALO_MS = 15000

const GRUPOS = [
  {
    clave: 'nuevos',
    titulo: 'Casos nuevos',
    detalle: 'Registrados, sin analista',
    color: '#ef4444',
    colorNombre: 'Rojo',
    estados: ['Registrada'],
  },
  {
    clave: 'proceso',
    titulo: 'En proceso',
    detalle: 'Atendidos por analista u operario',
    color: '#eab308',
    colorNombre: 'Amarillo',
    estados: ['Asignada', 'EnValidacion', 'EnAnalisis', 'AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion', 'Reabierta'],
  },
  {
    clave: 'pendientes',
    titulo: 'Pendientes',
    detalle: 'Esperando información del vecino',
    color: '#f97316',
    colorNombre: 'Naranja',
    estados: ['PendienteInformacion'],
  },
  {
    clave: 'resueltos',
    titulo: 'Resueltos',
    detalle: 'Trabajo aprobado',
    color: '#22c55e',
    colorNombre: 'Verde',
    estados: ['Solucionada', 'Finalizada'],
  },
]

function grupoDe(estado) {
  return GRUPOS.find((g) => g.estados.includes(estado))
}

function tiempoDesde(fecha) {
  const ms = Date.now() - new Date(fecha).getTime()
  if (Number.isNaN(ms) || ms < 0) return ''
  const min = Math.floor(ms / 60000)
  if (min < 60) return `hace ${Math.max(min, 1)} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

export default function MonitorCasos() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorConexion, setErrorConexion] = useState(false)
  const [enVivo, setEnVivo] = useState(true)
  const [ultima, setUltima] = useState(null)
  const [ahora, setAhora] = useState(Date.now())
  const [cambios, setCambios] = useState({})
  const anterior = useRef(null)

  const cargar = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const data = await apiFetch('/api/Casos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const conteos = {}
      GRUPOS.forEach((g) => {
        conteos[g.clave] = data.filter((c) => g.estados.includes(c.estado)).length
      })
      if (anterior.current) {
        const dif = {}
        GRUPOS.forEach((g) => {
          dif[g.clave] = conteos[g.clave] - anterior.current[g.clave]
        })
        setCambios(dif)
      }
      anterior.current = conteos
      setCasos(data)
      setErrorConexion(false)
      setUltima(Date.now())
    } catch {
      setErrorConexion(true)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!enVivo) return undefined
    const id = setInterval(cargar, INTERVALO_MS)
    return () => clearInterval(id)
  }, [enVivo, cargar])

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const porGrupo = useMemo(() => {
    const resultado = {}
    GRUPOS.forEach((g) => {
      resultado[g.clave] = casos
        .filter((c) => g.estados.includes(c.estado))
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
    })
    return resultado
  }, [casos])

  const total = GRUPOS.reduce((suma, g) => suma + porGrupo[g.clave].length, 0)
  const datosGrafico = GRUPOS.map((g) => ({ nombre: g.titulo, valor: porGrupo[g.clave].length, color: g.color }))
  const segundos = ultima ? Math.max(0, Math.floor((ahora - ultima) / 1000)) : null

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--color-piedra)]">
      <HeaderInterno titulo="Monitor de casos" />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/admin/casos')}
          className="text-sm text-[var(--color-azul-piedra)] hover:text-[var(--color-ocre)] transition-colors mb-6"
        >
          ← Volver a gestión de casos
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--color-tinta)]/70">
            <span className="relative flex h-2.5 w-2.5">
              {enVivo && !errorConexion && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${errorConexion ? 'bg-red-500' : enVivo ? 'bg-green-500' : 'bg-gray-400'}`} />
            </span>
            <span className="font-medium text-[var(--color-tinta)]">{enVivo ? 'En vivo' : 'En pausa'}</span>
            <span>
              {errorConexion
                ? 'Sin conexión, mostrando los últimos datos'
                : segundos === null
                ? 'Cargando...'
                : `Actualizado hace ${segundos} s`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar ahora
            </button>
            <button
              type="button"
              onClick={() => setEnVivo((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-tinta)]/70 bg-black/5 hover:bg-black/10 transition-colors"
            >
              {enVivo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {enVivo ? 'Pausar' : 'Reanudar'}
            </button>
          </div>
        </div>

        {cargando ? (
          <p className="text-sm text-[var(--color-tinta)]/60">Cargando casos...</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {GRUPOS.map((g) => {
                const dif = cambios[g.clave]
                return (
                  <div
                    key={g.clave}
                    className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5 border-l-8"
                    style={{ borderLeftColor: g.color }}
                  >
                    <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/60">{g.titulo}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-4xl font-display font-semibold text-[var(--color-tinta)]">{porGrupo[g.clave].length}</p>
                      {dif !== undefined && dif !== 0 && (
                        <span className={`text-xs font-semibold ${dif > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dif > 0 ? `+${dif}` : dif}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-tinta)]/50 mt-1">{g.detalle}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5 lg:col-span-1">
                <p className="text-sm font-semibold text-[var(--color-tinta)] mb-2">Distribución general</p>
                {total === 0 ? (
                  <p className="text-sm text-[var(--color-tinta)]/50 py-16 text-center">Aún no hay casos.</p>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={datosGrafico} dataKey="valor" nameKey="nombre" innerRadius={70} outerRadius={105} paddingAngle={2} stroke="none">
                          {datosGrafico.map((d) => (
                            <Cell key={d.nombre} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-3xl font-display font-semibold text-[var(--color-tinta)]">{total}</p>
                      <p className="text-xs text-[var(--color-tinta)]/50">casos</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 mt-2">
                  {GRUPOS.map((g) => {
                    const n = porGrupo[g.clave].length
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0
                    return (
                      <div key={g.clave} className="flex items-center justify-between text-xs text-[var(--color-tinta)]">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: g.color }} />
                          {g.titulo}
                        </span>
                        <span className="font-semibold">
                          {n} <span className="font-normal text-[var(--color-tinta)]/50">({pct}%)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5 lg:col-span-2">
                <p className="text-sm font-semibold text-[var(--color-tinta)] mb-3">Código de colores</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {GRUPOS.map((g) => (
                    <div key={g.clave} className="flex gap-3 rounded-md bg-white/60 border border-[var(--color-azul-piedra)]/10 p-3">
                      <span className="h-10 w-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-tinta)]">
                          {g.colorNombre} · {g.titulo}
                        </p>
                        <p className="text-xs text-[var(--color-tinta)]/60 mt-0.5">{g.estados.filter((e) => e !== 'Reabierta' && e !== 'TrabajoRealizado').join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {GRUPOS.map((g) => (
                <div key={g.clave} className="bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between text-white" style={{ backgroundColor: g.color }}>
                    <p className="text-sm font-semibold">{g.titulo}</p>
                    <p className="text-sm font-semibold">{porGrupo[g.clave].length}</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-[var(--color-azul-piedra)]/10">
                    {porGrupo[g.clave].length === 0 ? (
                      <p className="text-xs text-[var(--color-tinta)]/50 p-4">Sin casos.</p>
                    ) : (
                      porGrupo[g.clave].map((c) => (
                        <div key={c.id} className="px-4 py-3 border-l-4" style={{ borderLeftColor: grupoDe(c.estado)?.color }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--color-tinta)]">{c.codigo}</p>
                            <p className="text-xs text-[var(--color-tinta)]/50 whitespace-nowrap">{tiempoDesde(c.fechaRegistro)}</p>
                          </div>
                          <p className="text-xs text-[var(--color-tinta)]/70 mt-0.5">{c.area} · {c.aldea}</p>
                          <p className="text-xs text-[var(--color-tinta)]/50 mt-0.5">{c.estado}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}