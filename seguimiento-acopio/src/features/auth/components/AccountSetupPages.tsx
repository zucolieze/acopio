import { useState, type FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Marca } from '@/shared/ui/Marca'
import { Avisos } from '@/shared/ui/Aviso'
import { Panel } from '@/shared/ui/Panel'

type SetupProps = {
  busy: boolean
  error: string
  onSubmit: (value: string) => void
}

export function ResetPasswordPage({ busy, error, onSubmit }: SetupProps) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const mismatch = repeat.length > 0 && password !== repeat

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== repeat) return
    onSubmit(password)
  }

  return (
    <main className="center-page">
      <Marca soloIcono />
      <Panel className="auth-panel">
        <p className="eyebrow">Contraseña nueva</p>
        <h1>Elegí tu contraseña</h1>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Contraseña nueva
            <input
              autoComplete="new-password"
              minLength={8}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="muted small-copy">Mínimo 8 caracteres.</span>
          </label>
          <label>
            Repetila
            <input
              autoComplete="new-password"
              minLength={8}
              required
              type="password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
            {mismatch && <span className="field-error">Las contraseñas no coinciden.</span>}
          </label>
          <Boton
            variante="primaria" tamano="grande"
            disabled={busy || password !== repeat}
          >
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </Boton>
        </form>
        <Avisos error={error} aviso="" />
      </Panel>
    </main>
  )
}

export function ProfileNamePage({ busy, error, onSubmit }: SetupProps) {
  const [name, setName] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim()) onSubmit(name)
  }

  return (
    <main className="center-page">
      <Marca soloIcono />
      <Panel className="auth-panel">
        <p className="eyebrow">Último paso</p>
        <h1>¿Cómo te llamás?</h1>
        <p className="muted">Tu equipo va a ver este nombre en cada descarga que cargues.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Tu nombre
            <input
              autoComplete="name"
              autoFocus
              maxLength={120}
              placeholder="Ej.: Juan"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <Boton
            variante="primaria" tamano="grande"
            disabled={busy || !name.trim()}
          >
            {busy ? 'Guardando…' : 'Continuar'}
          </Boton>
        </form>
        <Avisos error={error} aviso="" />
      </Panel>
    </main>
  )
}
