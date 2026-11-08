// Recuerda en este dispositivo dónde estaba la persona (pantalla, trabajo,
// pestaña) para volver ahí al reabrir la app. Si el navegador no deja guardar
// (modo privado, almacenamiento bloqueado), simplemente no recuerda nada.
const PREFIX = 'acopio:'

export function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Sin almacenamiento disponible: no pasa nada.
  }
}

export function clearStored() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento disponible: no pasa nada.
  }
}
