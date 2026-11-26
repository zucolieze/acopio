import estilos from './EstadoVacio.module.css'

export function EstadoVacio({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className={estilos.vacio}>
      <span className={estilos.icono} aria-hidden="true">
        🌾
      </span>
      <h2>{titulo}</h2>
      <p>{descripcion}</p>
    </div>
  )
}
