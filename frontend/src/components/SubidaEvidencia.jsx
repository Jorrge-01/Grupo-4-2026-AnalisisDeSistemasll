import { useRef, useState } from 'react'
import { Camera, FileText, X, Upload } from 'lucide-react'

const MAX_FOTOS = 2
const MAX_TAMANO_MB = 5

export default function SubidaEvidencia({ fotos, setFotos, documento, setDocumento }) {
  const inputFotosRef = useRef(null)
  const inputDocRef = useRef(null)
  const [error, setError] = useState('')

  function validarTamano(file) {
    if (file.size > MAX_TAMANO_MB * 1024 * 1024) {
      setError(`"${file.name}" excede el tamaño máximo de ${MAX_TAMANO_MB} MB.`)
      return false
    }
    return true
  }

  function validarFormatoFoto(file) {
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      setError('La foto debe ser un archivo PNG o JPG.')
      return false
    }
    return true
  }

  function handleAgregarFotos(e) {
    setError('')
    const nuevos = Array.from(e.target.files || [])
    const validos = nuevos.filter((file) => validarFormatoFoto(file) && validarTamano(file))

    if (fotos.length + validos.length > MAX_FOTOS) {
      setError(`Solo puedes adjuntar un máximo de ${MAX_FOTOS} fotos.`)
      e.target.value = ''
      return
    }

    const conPreview = validos.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setFotos((prev) => [...prev, ...conPreview])
    e.target.value = ''
  }

  function handleQuitarFoto(index) {
    setFotos((prev) => {
      const copia = [...prev]
      URL.revokeObjectURL(copia[index].preview)
      copia.splice(index, 1)
      return copia
    })
  }

  function handleAgregarDocumento(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('El documento debe ser un archivo PDF.')
      e.target.value = ''
      return
    }
    if (!validarTamano(file)) {
      e.target.value = ''
      return
    }

    setDocumento(file)
    e.target.value = ''
  }

  function handleQuitarDocumento() {
    setDocumento(null)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-tinta)] mb-1.5">
        Evidencia <span className="font-normal text-[var(--color-tinta)]/50">(opcional)</span>
      </label>
      <p className="text-xs text-[var(--color-tinta)]/50 mb-3">
        Puedes adjuntar hasta {MAX_FOTOS} fotos y 1 documento PDF, máximo {MAX_TAMANO_MB} MB cada uno.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {/* Slots de fotos */}
        {Array.from({ length: MAX_FOTOS }).map((_, i) => {
          const foto = fotos[i]
          return (
            <div key={i}>
              {foto ? (
                <div className="relative h-28 rounded-lg overflow-hidden border border-[var(--color-azul-piedra)]/30 group">
                  <img src={foto.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleQuitarFoto(i)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputFotosRef.current?.click()}
                  disabled={fotos.length >= MAX_FOTOS}
                  className="h-28 w-full rounded-lg border-2 border-dashed border-[var(--color-azul-piedra)]/30 flex flex-col items-center justify-center gap-1.5 text-[var(--color-azul-piedra)]/60 hover:border-[var(--color-ocre)] hover:text-[var(--color-ocre)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-medium">Agregar foto</span>
                </button>
              )}
            </div>
          )
        })}

        {/* Slot de documento */}
        <div>
          {documento ? (
            <div className="relative h-28 rounded-lg border border-[var(--color-azul-piedra)]/30 bg-[var(--color-piedra)] flex flex-col items-center justify-center gap-1.5 px-2">
              <FileText className="h-6 w-6 text-[var(--color-ocre)]" />
              <span className="text-xs text-[var(--color-tinta)] text-center truncate max-w-full">
                {documento.name}
              </span>
              <button
                type="button"
                onClick={handleQuitarDocumento}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputDocRef.current?.click()}
              className="h-28 w-full rounded-lg border-2 border-dashed border-[var(--color-azul-piedra)]/30 flex flex-col items-center justify-center gap-1.5 text-[var(--color-azul-piedra)]/60 hover:border-[var(--color-ocre)] hover:text-[var(--color-ocre)] transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs font-medium">Agregar PDF</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputFotosRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        onChange={handleAgregarFotos}
        className="hidden"
      />
      <input
        ref={inputDocRef}
        type="file"
        accept="application/pdf"
        onChange={handleAgregarDocumento}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </div>
  )
}