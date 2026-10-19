export const ETAPAS = ['Recibido', 'Con el analista', 'En trabajo', 'Resuelto']

const INFO = {
  Registrada: {
    etiqueta: 'Registrada',
    descripcion: 'Tu caso fue recibido y en breve será asignado a un analista.',
    etapa: 0,
    clase: 'bg-slate-100 text-slate-800',
  },
  Asignada: {
    etiqueta: 'Con el analista',
    descripcion: 'Un analista de la municipalidad ya tiene tu caso y lo revisará.',
    etapa: 1,
    clase: 'bg-blue-100 text-blue-800',
  },
  EnValidacion: {
    etiqueta: 'Con el analista',
    descripcion: 'El analista está revisando tu caso y la información que enviaste.',
    etapa: 1,
    clase: 'bg-blue-100 text-blue-800',
  },
  PendienteInformacion: {
    etiqueta: 'Necesitamos tu información',
    descripcion: 'El analista te pidió más datos. Respóndelos para que tu caso continúe.',
    etapa: 1,
    clase: 'bg-orange-100 text-orange-800',
  },
  EnAnalisis: {
    etiqueta: 'Con el analista',
    descripcion: 'Tu caso fue aceptado y el analista está preparando el trabajo a realizar.',
    etapa: 1,
    clase: 'bg-blue-100 text-blue-800',
  },
  AsignadaAOperario: {
    etiqueta: 'En trabajo',
    descripcion: 'Tu caso fue asignado al personal municipal que realizará el trabajo.',
    etapa: 2,
    clase: 'bg-cyan-100 text-cyan-800',
  },
  EnEjecucion: {
    etiqueta: 'En trabajo',
    descripcion: 'El personal municipal está trabajando en tu caso.',
    etapa: 2,
    clase: 'bg-cyan-100 text-cyan-800',
  },
  TrabajoRealizado: {
    etiqueta: 'En trabajo',
    descripcion: 'El trabajo fue realizado y pronto será revisado por el analista.',
    etapa: 2,
    clase: 'bg-cyan-100 text-cyan-800',
  },
  EnVerificacion: {
    etiqueta: 'Verificando el trabajo',
    descripcion: 'El analista está comprobando que el problema quedó resuelto.',
    etapa: 2,
    clase: 'bg-teal-100 text-teal-800',
  },
  Solucionada: {
    etiqueta: 'Resuelto',
    descripcion: 'Tu caso fue resuelto. Gracias por ayudarnos a mejorar el municipio.',
    etapa: 3,
    clase: 'bg-green-100 text-green-800',
  },
  Finalizada: {
    etiqueta: 'Resuelto',
    descripcion: 'Tu caso fue resuelto. Gracias por ayudarnos a mejorar el municipio.',
    etapa: 3,
    clase: 'bg-green-100 text-green-800',
  },
  NoProcedente: {
    etiqueta: 'No procedente',
    descripcion: 'Tu caso fue revisado y no procede.',
    etapa: -1,
    clase: 'bg-gray-100 text-gray-800',
  },
}

export function infoEstado(estado) {
  return (
    INFO[estado] || {
      etiqueta: estado,
      descripcion: '',
      etapa: -1,
      clase: 'bg-gray-100 text-gray-800',
    }
  )
}