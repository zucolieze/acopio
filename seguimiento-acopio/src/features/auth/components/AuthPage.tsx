import type { FormEvent } from 'react'
import { Brand } from '../../../components/ui/Brand'
import { Feedback } from '../../../components/ui/Feedback'
import type { AuthMode } from '../types'

type AuthPageProps = {
  mode: AuthMode
  email: string
  password: string
  fullName: string
  busy: boolean
  error: string
  notice: string
  onModeChange: (mode: AuthMode) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthPage({
  mode,
  email,
  password,
  fullName,
  busy,
  error,
  notice,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onSubmit,
}: AuthPageProps) {
  const isCreatingAccount = mode === 'crear'

  return (
    <main className="center-page">
      <Brand />
      <section className="panel auth-panel">
        <p className="eyebrow">Seguimiento de cosecha</p>
        <h1>{isCreatingAccount ? 'Crear cuenta' : 'Entrá a Acopio'}</h1>
        <p className="muted">
          Registrá los kilos del campo y compartí el seguimiento con tu equipo.
        </p>
        <form className="form-stack" onSubmit={onSubmit}>
          {isCreatingAccount && (
            <label>
              Tu nombre
              <input
                autoComplete="name"
                maxLength={120}
                placeholder="Ej.: Juan"
                required
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
              />
            </label>
          )}
          <label>
            Correo electrónico
            <input
              autoComplete="username"
              inputMode="email"
              type="email"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
              minLength={isCreatingAccount ? 8 : undefined}
              type="password"
              required
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          <button className="button button--primary" disabled={busy}>
            {busy
              ? 'Un momento…'
              : isCreatingAccount
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
          </button>
        </form>
        <button
          className="link-button"
          type="button"
          onClick={() => onModeChange(isCreatingAccount ? 'entrar' : 'crear')}
        >
          {isCreatingAccount ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
        </button>
        <Feedback error={error} notice={notice} />
      </section>
    </main>
  )
}
