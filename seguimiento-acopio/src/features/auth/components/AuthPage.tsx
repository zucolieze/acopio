import type { FormEvent } from 'react'
import { Brand } from '../../../components/ui/Brand'
import { Feedback } from '../../../components/ui/Feedback'
import { InstallHint } from '../../../components/ui/InstallHint'
import type { AuthMode } from '../types'

type AuthPageProps = {
  mode: AuthMode
  email: string
  password: string
  fullName: string
  busy: boolean
  error: string
  notice: string
  linkSentTo: string | null
  resendIn: number
  onModeChange: (mode: AuthMode) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onGoogle: () => void
  onMagicLink: (event: FormEvent<HTMLFormElement>) => void
  onResendMagicLink: () => void
  onSignIn: (event: FormEvent<HTMLFormElement>) => void
  onSignUp: (event: FormEvent<HTMLFormElement>) => void
  onRecover: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthPage(props: AuthPageProps) {
  const { mode, busy, error, notice, linkSentTo, onModeChange } = props

  if (linkSentTo) {
    return (
      <AuthShell>
        <h1>Revisá tu correo</h1>
        <p className="muted">
          Te mandamos un enlace a <strong>{linkSentTo}</strong>. Abrí el correo y
          tocá el botón para entrar.
        </p>
        <p className="auth-hint">
          ¿No lo ves? Mirá en <strong>Spam</strong> o <strong>Correo no deseado</strong>.
          Puede tardar un minuto.
        </p>
        <Feedback error={error} notice={notice} />
        <button
          className="button button--secondary button--large"
          type="button"
          disabled={busy || props.resendIn > 0}
          onClick={props.onResendMagicLink}
        >
          {props.resendIn > 0
            ? `Pedir otro enlace en ${props.resendIn} s`
            : 'Pedir otro enlace'}
        </button>
        <button className="link-button" type="button" onClick={() => onModeChange('entrar')}>
          Usar otro correo
        </button>
      </AuthShell>
    )
  }

  if (mode === 'entrar') {
    return (
      <AuthShell>
        <h1>Entrá a Acopio</h1>
        <p className="muted">
          Si es tu primera vez, tu cuenta se crea sola. No hace falta recordar contraseñas.
        </p>
        <button
          className="button button--google button--large"
          type="button"
          disabled={busy}
          onClick={props.onGoogle}
        >
          <GoogleMark />
          Continuar con Google
        </button>
        <p className="auth-divider">o con tu correo</p>
        <form className="form-stack" onSubmit={props.onMagicLink}>
          <EmailField value={props.email} onChange={props.onEmailChange} />
          <button className="button button--primary button--large" disabled={busy}>
            {busy ? 'Un momento…' : 'Mandarme un enlace para entrar'}
          </button>
          <p className="auth-hint">
            Te llega un correo con un botón. Lo tocás y ya estás adentro.
          </p>
        </form>
        <Feedback error={error} notice={notice} />
        <button className="link-button" type="button" onClick={() => onModeChange('clave')}>
          Prefiero entrar con contraseña
        </button>
      </AuthShell>
    )
  }

  if (mode === 'recuperar') {
    return (
      <AuthShell>
        <h1>Recuperar contraseña</h1>
        <p className="muted">
          Poné tu correo y te mandamos un enlace para elegir una contraseña nueva.
        </p>
        <form className="form-stack" onSubmit={props.onRecover}>
          <EmailField value={props.email} onChange={props.onEmailChange} />
          <button className="button button--primary button--large" disabled={busy}>
            {busy ? 'Un momento…' : 'Mandarme el enlace'}
          </button>
        </form>
        <Feedback error={error} notice={notice} />
        <button className="link-button" type="button" onClick={() => onModeChange('clave')}>
          Volver
        </button>
      </AuthShell>
    )
  }

  const creating = mode === 'crear'
  return (
    <AuthShell>
      <h1>{creating ? 'Crear cuenta' : 'Entrar con contraseña'}</h1>
      <form className="form-stack" onSubmit={creating ? props.onSignUp : props.onSignIn}>
        {creating && (
          <label>
            Tu nombre
            <input
              autoComplete="name"
              maxLength={120}
              placeholder="Ej.: Juan"
              required
              value={props.fullName}
              onChange={(event) => props.onFullNameChange(event.target.value)}
            />
          </label>
        )}
        <EmailField value={props.email} onChange={props.onEmailChange} />
        <label>
          Contraseña
          <input
            autoComplete={creating ? 'new-password' : 'current-password'}
            minLength={creating ? 8 : undefined}
            type="password"
            required
            value={props.password}
            onChange={(event) => props.onPasswordChange(event.target.value)}
          />
          {creating && <span className="muted small-copy">Mínimo 8 caracteres.</span>}
        </label>
        <button className="button button--primary button--large" disabled={busy}>
          {busy ? 'Un momento…' : creating ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      <Feedback error={error} notice={notice} />
      {!creating && (
        <button className="link-button" type="button" onClick={() => onModeChange('recuperar')}>
          Olvidé mi contraseña
        </button>
      )}
      <button
        className="link-button"
        type="button"
        onClick={() => onModeChange(creating ? 'clave' : 'crear')}
      >
        {creating ? 'Ya tengo una cuenta' : 'Crear una cuenta con contraseña'}
      </button>
      <button className="link-button" type="button" onClick={() => onModeChange('entrar')}>
        Volver a las otras formas de entrar
      </button>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="center-page">
      <Brand />
      <section className="panel auth-panel">
        <p className="eyebrow">Seguimiento de cosecha</p>
        {children}
      </section>
      <InstallHint />
    </main>
  )
}

function EmailField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      Correo electrónico
      <input
        autoComplete="username"
        autoCapitalize="none"
        inputMode="email"
        type="email"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}
