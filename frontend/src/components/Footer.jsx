export default function Footer() {
  return (
    <footer className="bg-[var(--color-verde-oscuro)] text-[var(--color-piedra-clara)]/80">
      <div className="franja-textil" />
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm">
        <p>© {new Date().getFullYear()} Municipalidad. Todos los derechos reservados.</p>
        <p>Sistema de Quejas</p>
        <p>Desarrollado por Jorge Chávez y Alejandra Arroyo</p>
      </div>
    </footer>
  )
}