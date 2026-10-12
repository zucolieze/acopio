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
