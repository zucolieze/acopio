export function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  // Los errores de la base (Supabase) llegan como objetos con "message".
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message
  }
  return 'Ocurrió un error inesperado. Probá de nuevo.'
}
