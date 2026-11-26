// El formato argentino (ABC123 o AA123BB) es solo una sugerencia: pueden llegar
// camiones de otros países. La base acepta de 4 a 10 letras o números.
export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

export function isArgentinePlate(plate: string) {
  return /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(plate)
}

export function isValidPlate(plate: string) {
  return /^[A-Z0-9]{4,10}$/.test(plate)
}
