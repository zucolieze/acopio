// La humedad tiene siempre dos cifras enteras y como mucho un decimal
// (12 se guarda como 12.0). Si se tipea la tercera cifra sin separador, el punto
// se pone solo (125 queda 12.5). Si la persona usa coma, se respeta mientras
// escribe y se guarda y muestra con punto.
export function formatHumidityInput(value: string) {
  const match = value.match(/^(\d{0,2})(?:([.,])(\d?))?/)
  const integer = match?.[1] ?? ''
  const separator = match?.[2]
  const decimal = match?.[3] ?? ''
  if (separator !== undefined) return `${integer}${separator}${decimal}`
  const extra = value.slice(integer.length).replace(/\D/g, '').slice(0, 1)
  return integer.length === 2 && extra ? `${integer}.${extra}` : integer
}

export function parseHumidity(value: string) {
  const normalized = value.trim().replace(',', '.')
  return /^\d{2}(\.\d)?$/.test(normalized) ? Number(normalized) : null
}

export function humidityToInput(value: number | null) {
  return value === null ? '' : value.toFixed(1)
}

export function formatHumidity(value: number) {
  return `${value.toFixed(1)}%`
}

export const HUMIDITY_PATTERN = '\\d{2}([.,]\\d)?'
export const HUMIDITY_ERROR = 'La humedad va con dos cifras, por ejemplo 12 o 12.5.'
