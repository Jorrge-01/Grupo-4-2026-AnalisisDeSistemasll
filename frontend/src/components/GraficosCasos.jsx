import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { CATALOGO, ETIQUETA_TIPO, cargarConfig, guardarTipo } from '../lib/graficosConfig'

const PALETA = ['#0f766e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6']

const ETAPAS = [
  { clave: 'registro', nombre: 'Registro', detalle: 'Casos ingresados', estados: ['Registrada', 'Asignada'], color: '#94a3b8' },
  { clave: 'analisis', nombre: 'Análisis y asignación', detalle: 'Casos que llegaron a análisis o más', estados: ['EnValidacion', 'PendienteInformacion', 'EnAnalisis'], color: '#a855f7' },
  { clave: 'ejecucion', nombre: 'Atención y ejecución', detalle: 'Casos asignados a un operario o más', estados: ['AsignadaAOperario', 'EnEjecucion', 'TrabajoRealizado', 'EnVerificacion'], color: '#06b6d4' },
  { clave: 'resuelto', nombre: 'Validación y cierre', detalle: 'Casos resueltos', estados: ['Solucionada', 'Finalizada'], color: '#22c55e' },
]

function contar(casos, obtener) {
  const conteo = {}
  casos.forEach((c) => {
    const clave = obtener(c) || 'Sin dato'
    conteo[clave] = (conteo[clave] || 0) + 1
  })
  return conteo
}

function aSerie(conteo, limite) {
  const serie = Object.entries(conteo)
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor)
  return limite ? serie.slice(0, limite) : serie
}

function etapaDe(estado) {
  return ETAPAS.findIndex((e) => e.estados.includes(estado))
}

function claveMes(fecha) {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function etiquetaMes(clave) {
  const [anio, mes] = clave.split('-')
  return new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' })
}

function SinDatos() {
  return <p className="text-sm text-[var(--color-tinta)]/50 py-16 text-center">Sin datos con estos filtros.</p>
}

function GraficoCategorias({ datos, tipo, horizontal, colorDe }) {
  if (datos.length === 0) return <SinDatos />
  const color = (nombre, i) => (colorDe ? colorDe(nombre) : PALETA[i % PALETA.length])

  if (tipo === 'pastel' || tipo === 'dona') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius={tipo === 'dona' ? 55 : 0}
            outerRadius={95}
            paddingAngle={1}
            label={({ percent }) => `${Math.round(percent * 100)}%`}
            labelLine={false}
          >
            {datos.map((d, i) => (
              <Cell key={d.nombre} fill={color(d.nombre, i)} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (horizontal) {
    const alto = Math.max(260, datos.length * 34 + 40)
    return (
      <ResponsiveContainer width="100%" height={alto}>
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey="valor" name="Casos" radius={[0, 4, 4, 0]}>
            {datos.map((d, i) => (
              <Cell key={d.nombre} fill={color(d.nombre, i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="valor" name="Casos" radius={[4, 4, 0, 0]}>
          {datos.map((d, i) => (
            <Cell key={d.nombre} fill={color(d.nombre, i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function GraficoTiempo({ datos, tipo }) {
  if (datos.length === 0) return <SinDatos />
  const margen = { top: 12, right: 16, left: -16, bottom: 4 }
  const ejes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
      <Tooltip />
    </>
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      {tipo === 'barras' ? (
        <BarChart data={datos} margin={margen}>
          {ejes}
          <Bar dataKey="casos" name="Casos" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : tipo === 'area' ? (
        <AreaChart data={datos} margin={margen}>
          {ejes}
          <Area type="monotone" dataKey="casos" name="Casos" stroke="#0f766e" fill="#0f766e" fillOpacity={0.2} />
        </AreaChart>
      ) : (
        <LineChart data={datos} margin={margen}>
          {ejes}
          <Line type="monotone" dataKey="casos" name="Casos" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

function Embudo({ casos }) {
  const conteos = ETAPAS.map((_, i) => casos.filter((c) => etapaDe(c.estado) >= i).length)
  const base = conteos[0]
  if (base === 0) return <SinDatos />

  return (
    <div className="space-y-4">
      {ETAPAS.map((etapa, i) => {
        const porcentaje = Math.round((conteos[i] / base) * 1000) / 10
        return (
          <div key={etapa.clave}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <p className="text-sm text-[var(--color-tinta)]">
                <span className="font-semibold">{i + 1}. {etapa.nombre}</span>
                <span className="text-xs text-[var(--color-tinta)]/50 ml-2">{etapa.detalle}</span>
              </p>
              <p className="text-sm text-[var(--color-tinta)] whitespace-nowrap">
                <span className="font-semibold">{conteos[i]}</span>
                <span className="text-xs text-[var(--color-tinta)]/50"> casos ({porcentaje}%)</span>
              </p>
            </div>
            <div className="h-5 w-full rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, backgroundColor: etapa.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EtapaPorArea({ casos }) {
  const filas = {}
  casos.forEach((c) => {
    const etapa = etapaDe(c.estado)
    if (etapa < 0) return
    const area = c.area || 'Sin dato'
    if (!filas[area]) {
      filas[area] = { area }
      ETAPAS.forEach((e) => {
        filas[area][e.nombre] = 0
      })
    }
    filas[area][ETAPAS[etapa].nombre] += 1
  })
  const datos = Object.values(filas).sort(
    (a, b) => ETAPAS.reduce((s, e) => s + b[e.nombre], 0) - ETAPAS.reduce((s, e) => s + a[e.nombre], 0)
  )
  if (datos.length === 0) return <SinDatos />

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, datos.length * 40 + 70)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={120} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {ETAPAS.map((e) => (
          <Bar key={e.clave} dataKey={e.nombre} stackId="etapas" fill={e.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function CargaPersonal({ registros, rol }) {
  const datos = registros
    .filter((r) => r.rol === rol)
    .map((r) => ({ nombre: r.nombre, Activos: r.casosActivos, Finalizados: r.casosFinalizados, total: r.totalAsignados }))
    .sort((a, b) => b.total - a.total)
  if (datos.length === 0) return <SinDatos />

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, datos.length * 40 + 70)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Activos" stackId="carga" fill="#f59e0b" />
        <Bar dataKey="Finalizados" stackId="carga" fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PersonalPorArea({ registros }) {
  const filas = {}
  registros
    .filter((r) => r.activo)
    .forEach((r) => {
      const areas = (r.areas || '').split(',').map((a) => a.trim()).filter(Boolean)
      const lista = areas.length > 0 ? areas : ['Sin área']
      lista.forEach((area) => {
        if (!filas[area]) filas[area] = { area, Analistas: 0, Operarios: 0 }
        if (r.rol === 'Analista') filas[area].Analistas += 1
        else filas[area].Operarios += 1
      })
    })
  const datos = Object.values(filas).sort((a, b) => b.Analistas + b.Operarios - (a.Analistas + a.Operarios))
  if (datos.length === 0) return <SinDatos />

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, datos.length * 44 + 70)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={120} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Analistas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="Operarios" fill="#0f766e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AldeaPorArea({ casos }) {
  const totales = contar(casos, (c) => c.aldea)
  const aldeas = aSerie(totales, 8).map((a) => a.nombre)
  const areas = [...new Set(casos.map((c) => c.area || 'Sin dato'))].sort()
  const datos = aldeas.map((aldea) => {
    const fila = { aldea }
    areas.forEach((area) => {
      fila[area] = casos.filter((c) => (c.aldea || 'Sin dato') === aldea && (c.area || 'Sin dato') === area).length
    })
    return fila
  })
  if (datos.length === 0) return <SinDatos />

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, datos.length * 44 + 90)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="aldea" tick={{ fontSize: 11 }} width={120} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {areas.map((area, i) => (
          <Bar key={area} dataKey={area} stackId="aldea" fill={PALETA[i % PALETA.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function TasaResolucion({ casos }) {
  const total = casos.length
  if (total === 0) return <SinDatos />
  const resueltos = casos.filter((c) => etapaDe(c.estado) === 3).length
  const pendientes = total - resueltos
  const porcentaje = Math.round((resueltos / total) * 1000) / 10
  const datos = [
    { nombre: 'Resueltos', valor: resueltos },
    { nombre: 'No resueltos', valor: pendientes },
  ]

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={datos} dataKey="valor" nameKey="nombre" startAngle={180} endAngle={0} cx="50%" cy="80%" innerRadius={80} outerRadius={115} stroke="none">
            <Cell fill="#22c55e" />
            <Cell fill="#e5e7eb" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 bottom-6 text-center">
        <p className="text-3xl font-display font-semibold text-[var(--color-tinta)]">{porcentaje}%</p>
        <p className="text-xs text-[var(--color-tinta)]/50">{resueltos} de {total} casos resueltos</p>
      </div>
    </div>
  )
}

export default function GraficosCasos({ casos, estadosOrden, estadoColores, personal = [] }) {
  const navigate = useNavigate()
  const [config, setConfig] = useState(cargarConfig)
  const { visibles, tipos } = config

  const datos = useMemo(() => {
    const porEstado = contar(casos, (c) => c.estado)
    const estado = estadosOrden.filter((e) => porEstado[e]).map((e) => ({ nombre: e, valor: porEstado[e] }))

    const porMes = {}
    casos.forEach((c) => {
      const clave = claveMes(c.fechaRegistro)
      if (clave) porMes[clave] = (porMes[clave] || 0) + 1
    })
    const tiempo = Object.keys(porMes)
      .sort()
      .map((clave) => ({ mes: etiquetaMes(clave), casos: porMes[clave] }))

    return {
      estado,
      area: aSerie(contar(casos, (c) => c.area)),
      aldea: aSerie(contar(casos, (c) => c.aldea), 10),
      analista: aSerie(contar(casos, (c) => c.analista || 'Sin analista')),
      tiempo,
    }
  }, [casos, estadosOrden])

  function cambiarTipo(id, tipo) {
    guardarTipo(id, tipo)
    setConfig((prev) => ({ ...prev, tipos: { ...prev.tipos, [id]: tipo } }))
  }

  function contenido(id) {
    const tipo = tipos[id]
    if (id === 'estado') return <GraficoCategorias datos={datos.estado} tipo={tipo} colorDe={(n) => estadoColores[n] || '#94a3b8'} />
    if (id === 'area') return <GraficoCategorias datos={datos.area} tipo={tipo} horizontal />
    if (id === 'aldea') return <GraficoCategorias datos={datos.aldea} tipo={tipo} horizontal />
    if (id === 'analista') return <GraficoCategorias datos={datos.analista} tipo={tipo} horizontal />
    if (id === 'operario') return <CargaPersonal registros={personal} rol="Empleado" />
    if (id === 'personal') return <PersonalPorArea registros={personal} />
    if (id === 'aldeaarea') return <AldeaPorArea casos={casos} />
    if (id === 'tiempo') return <GraficoTiempo datos={datos.tiempo} tipo={tipo} />
    if (id === 'embudo') return <Embudo casos={casos} />
    if (id === 'apilado') return <EtapaPorArea casos={casos} />
    return <TasaResolucion casos={casos} />
  }

  const activos = CATALOGO.filter((g) => visibles[g.id])

  const boton = (
    <button
      type="button"
      onClick={() => navigate('/admin/casos/graficos')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-azul-piedra)] bg-[var(--color-azul-piedra)]/10 hover:bg-[var(--color-azul-piedra)]/20 transition-colors"
    >
      <Settings className="h-3.5 w-3.5" />
      Configurar gráficos
    </button>
  )

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-xs uppercase tracking-wide text-[var(--color-tinta)]/50">Gráficos</p>
        {boton}
      </div>

      {activos.length === 0 ? (
        <p className="text-sm text-[var(--color-tinta)]/60 bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-6">
          No hay gráficos activos. Usa "Configurar gráficos" para elegir cuáles mostrar.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {activos.map((g) => (
            <div
              key={g.id}
              className={`bg-[var(--color-piedra-clara)] rounded-lg border border-[var(--color-azul-piedra)]/15 p-5 ${g.ancho ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <p className="text-sm font-semibold text-[var(--color-tinta)]">{g.titulo}</p>
                <div className="flex items-center gap-1.5">
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
                </div>
              </div>
              {contenido(g.id)}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}