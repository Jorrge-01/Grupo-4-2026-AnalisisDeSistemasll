const CLAVE_STORAGE = 'adminCasosGraficos'

export const CATALOGO = [
  { id: 'estado', titulo: 'Casos por estado', tipos: ['barras', 'pastel', 'dona'], tipoInicial: 'barras', ancho: false },
  { id: 'area', titulo: 'Casos por área', tipos: ['barras', 'pastel', 'dona'], tipoInicial: 'barras', ancho: false },
  { id: 'aldea', titulo: 'Casos por aldea', tipos: ['barras', 'dona'], tipoInicial: 'barras', ancho: false },
  { id: 'analista', titulo: 'Carga por analista', tipos: ['barras', 'pastel'], tipoInicial: 'barras', ancho: false },
  { id: 'operario', titulo: 'Carga por operario', tipos: [], tipoInicial: '', ancho: false },
  { id: 'personal', titulo: 'Personal por área', tipos: [], tipoInicial: '', ancho: false },
  { id: 'aldeaarea', titulo: 'Problemas por aldea', tipos: [], tipoInicial: '', ancho: false },
  { id: 'tiempo', titulo: 'Evolución mensual de casos', tipos: ['linea', 'area', 'barras'], tipoInicial: 'linea', ancho: true },
  { id: 'embudo', titulo: 'Embudo del ciclo de vida del caso', tipos: [], tipoInicial: '', ancho: true },
  { id: 'apilado', titulo: 'Etapa del caso por área', tipos: [], tipoInicial: '', ancho: false },
  { id: 'resolucion', titulo: 'Tasa de resolución', tipos: [], tipoInicial: '', ancho: false },
]

export const ETIQUETA_TIPO = { barras: 'Barras', pastel: 'Pastel', dona: 'Dona', linea: 'Línea', area: 'Área' }

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

function escribir(visibles, tipos) {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ visibles, tipos }))
  } catch {
    return
  }
}

export function cargarConfig() {
  const guardado = leer()
  const visibles = {}
  const tipos = {}
  CATALOGO.forEach((g) => {
    visibles[g.id] = guardado?.visibles?.[g.id] ?? true
    tipos[g.id] = guardado?.tipos?.[g.id] && g.tipos.includes(guardado.tipos[g.id]) ? guardado.tipos[g.id] : g.tipoInicial
  })
  return { visibles, tipos }
}

export function guardarConfig(visibles, tipos) {
  escribir(visibles, tipos)
}

export function guardarTipo(id, tipo) {
  const actual = cargarConfig()
  escribir(actual.visibles, { ...actual.tipos, [id]: tipo })
}