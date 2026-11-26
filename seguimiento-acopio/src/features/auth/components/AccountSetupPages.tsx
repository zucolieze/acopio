import { useState, type FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Marca } from '@/shared/ui/Marca'
import { Avisos } from '@/shared/ui/Aviso'
import { FormularioApilado } from '@/shared/ui/FormularioApilado'
import { PaginaCentrada } from '@/shared/ui/PaginaCentrada'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import { PanelAcceso } from './PanelAcceso'
import estilos from './AccountSetupPages.module.css'

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
    <PaginaCentrada>
      <Marca soloIcono />
      <PanelAcceso sobretitulo="Contraseña nueva" titulo="Elegí tu contraseña">
        <FormularioApilado onSubmit={submit}>
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
            <TextoSuave como="span" chico>Mínimo 8 caracteres.</TextoSuave>
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
            {mismatch && <span className={estilos.errorCampo}>Las contraseñas no coinciden.</span>}
          </label>
          <Boton
            variante="primaria" tamano="grande"
            disabled={busy || password !== repeat}
          >
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </Boton>
        </FormularioApilado>
        <Avisos error={error} aviso="" />
      </PanelAcceso>
    </PaginaCentrada>
  )
}

export function ProfileNamePage({ busy, error, onSubmit }: SetupProps) {
  const [name, setName] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim()) onSubmit(name)
  }

  return (
    <PaginaCentrada>
      <Marca soloIcono />
      <PanelAcceso
        sobretitulo="Último paso"
        titulo="¿Cómo te llamás?"
        introduccion="Tu equipo va a ver este nombre en cada descarga que cargues."
      >
        <FormularioApilado onSubmit={submit}>
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
        </FormularioApilado>
        <Avisos error={error} aviso="" />
      </PanelAcceso>
    </PaginaCentrada>
  )
}
