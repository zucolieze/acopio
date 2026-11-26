/** Une nombres de clase y descarta los vacíos. */
export function unirClases(...clases: Array<string | false | null | undefined>) {
  return clases.filter(Boolean).join(' ')
}
