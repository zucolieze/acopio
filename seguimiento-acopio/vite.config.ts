import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Versión visible en el login: 0.MM.DD con el mes y el día de la compilación
// (hora de Argentina), por ejemplo 0.11.18. La primera cifra sigue en 0.
function appVersion() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const month = parts.find((part) => part.type === 'month')?.value ?? '00'
  const day = parts.find((part) => part.type === 'day')?.value ?? '00'
  return `0.${month}.${day}`
}

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.svg'],
      manifest: {
        name: 'Acopio | Seguimiento de cosecha',
        short_name: 'Acopio',
        description: 'Seguimiento simple y en tiempo real de cada descarga de cereal.',
        theme_color: '#173f35',
        background_color: '#f6f7f2',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
