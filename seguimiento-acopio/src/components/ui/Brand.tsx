export function Brand({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <a className="brand" href="/" aria-label="Acopio, inicio">
      <span className="brand__mark" aria-hidden="true">
        A
      </span>
      {!iconOnly && <span>Acopio</span>}
    </a>
  )
}
