export function messageFromError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado. Probá de nuevo.'
}
