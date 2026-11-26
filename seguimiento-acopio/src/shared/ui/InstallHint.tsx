import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function InstallHint() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isInstalled)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  if (installEvent) {
    return (
      <button
        className="button button--quiet"
        type="button"
        onClick={() => {
          void installEvent.prompt()
          setInstallEvent(null)
        }}
      >
        Instalar Acopio en el celular
      </button>
    )
  }

  if (isIos) {
    return (
      <p className="auth-hint install-hint">
        Para tener Acopio en tu celular: tocá el botón <strong>Compartir</strong> de
        Safari y después <strong>Agregar a pantalla de inicio</strong>.
      </p>
    )
  }

  return null
}
