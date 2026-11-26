import estilos from './Marca.module.css'

export function Marca({ soloIcono = false }: { soloIcono?: boolean }) {
  return (
    <a className={estilos.marca} href="/" aria-label="Acopio, inicio">
      <span className={estilos.simbolo} aria-hidden="true">
        A
      </span>
      {!soloIcono && <span>Acopio</span>}
    </a>
  )
}
