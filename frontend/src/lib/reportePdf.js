import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const AZUL = [15, 23, 42]
const GRIS = [238, 241, 245]

export function exportarPdf({ titulo, filtros, columnas, filas, archivo }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const ahora = new Date()

  doc.setFillColor(...AZUL)
  doc.rect(0, 0, ancho, 56, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('MuniAtiende', 40, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(titulo, ancho - 40, 34, { align: 'right' })

  doc.setTextColor(...AZUL)
  doc.setFontSize(10)
  let y = 80
  doc.text(`Generado: ${ahora.toLocaleString('es-GT')}`, 40, y)
  y += 15

  filtros.forEach(([etiqueta, valor]) => {
    doc.text(`${etiqueta}: ${valor}`, 40, y)
    y += 15
  })

  doc.setFont('helvetica', 'bold')
  doc.text(`Total de registros: ${filas.length}`, 40, y)

  autoTable(doc, {
    startY: y + 12,
    head: [columnas],
    body: filas,
    margin: { left: 40, right: 40, bottom: 40 },
    styles: { fontSize: 9, cellPadding: 5, textColor: AZUL },
    headStyles: { fillColor: AZUL, textColor: 255 },
    alternateRowStyles: { fillColor: GRIS },
  })

  const paginas = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.text(`Página ${i} de ${paginas}`, ancho - 40, alto - 20, { align: 'right' })
  }

  doc.save(`${archivo}_${ahora.toISOString().split('T')[0]}.pdf`)
}