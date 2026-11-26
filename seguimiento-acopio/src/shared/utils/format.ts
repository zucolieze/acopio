export function formatKilos(value: number) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

// Mes y año en que se creó un trabajo, por ejemplo "Noviembre 2026".
export function formatPeriod(value: string) {
  const text = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
    .format(new Date(value))
    .replace(' de ', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
