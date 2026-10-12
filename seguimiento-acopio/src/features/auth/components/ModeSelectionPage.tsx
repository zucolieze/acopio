import { Brand } from '../../../components/ui/Brand'
import { Feedback } from '../../../components/ui/Feedback'
import type { WorkMode } from '../../../types/app'

type ModeSelectionPageProps = {
  welcomeName: string
  isDebugAdmin: boolean
  busy: boolean
  error: string
  notice: string
  onChooseMode: (mode: WorkMode) => void
  onSignOut: () => void
}

export function ModeSelectionPage({
  welcomeName,
  isDebugAdmin,
  busy,
  error,
  notice,
  onChooseMode,
  onSignOut,
}: ModeSelectionPageProps) {
  return (
    <main className="center-page center-page--top">
      <header className="simple-header">
        <Brand />
        <button
          className="button button--quiet"
          type="button"
          disabled={busy}
          onClick={onSignOut}
        >
          Cerrar sesión
        </button>
      </header>
      <section className="mode-selection">
        <p className="eyebrow">Bienvenido {welcomeName}</p>
        <p className="eyebrow">Elegí cómo vas a usar Acopio</p>
        <h1>¿Qué necesitás hacer?</h1>
        <p className="muted">Después podés elegir un trabajo para continuar.</p>
        <Feedback error={error} notice={notice} />
        <div className="mode-cards">
          <button
            className="mode-card"
            type="button"
            onClick={() => onChooseMode('observador')}
          >
            <span className="mode-card__icon" aria-hidden="true">👀</span>
            <strong>Observador</strong>
            <span>Solo veo los kilos y el historial.</span>
          </button>
          <button
            className="mode-card"
            type="button"
            onClick={() => onChooseMode('carrero')}
          >
            <span className="mode-card__icon" aria-hidden="true">🚜</span>
            <strong>Carrero</strong>
            <span>Abro destinos y cargo las pesadas.</span>
          </button>
          {isDebugAdmin && (
            <button
              className="mode-card mode-card--debug"
              type="button"
              onClick={() => onChooseMode('admin')}
            >
              <span className="mode-card__icon" aria-hidden="true">🛠️</span>
              <strong>Admin de prueba</strong>
              <span>Puedo alternar entre observador y carrero.</span>
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
