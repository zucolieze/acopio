export type WorkMode = 'observador' | 'carrero' | 'admin'
export type AppScreen = 'login' | 'modalidad' | 'menu' | 'trabajo'

export const modeLabels: Record<WorkMode, string> = {
  observador: 'Observador',
  carrero: 'Carrero',
  admin: 'Admin de prueba',
}
