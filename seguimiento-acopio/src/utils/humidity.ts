// La humedad siempre se escribe como NN.N (por ejemplo 14.5), así nunca se
// confunde con los kilos de una pesada. Se arma sola mientras se tipea.
export function formatHumidityInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 3)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}.${digits[2]}`
}

export function parseHumidity(value: string) {
  return /^\d{2}\.\d$/.test(value.trim()) ? Number(value) : null
}

export function humidityToInput(value: number | null) {
  return value === null ? '' : formatHumidityInput(value.toFixed(1))
}

export const HUMIDITY_PATTERN = '\\d{2}\\.\\d'
export const HUMIDITY_ERROR =
  'La humedad va con dos cifras y un decimal, por ejemplo 14.5.'
