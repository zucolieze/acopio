import { useEffect, useState } from 'react'

type FeedbackProps = {
  error: string
  notice: string
}

// Los avisos de acción completada se van solos a los 10 segundos; los errores
// quedan a la vista hasta que la persona hace otra cosa.
const NOTICE_SECONDS = 10

export function Feedback({ error, notice }: FeedbackProps) {
  const [hiddenNotice, setHiddenNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    setHiddenNotice('')
    const timer = window.setTimeout(() => setHiddenNotice(notice), NOTICE_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [notice])

  return (
    <>
      {error && (
        <p className="feedback feedback--error" role="alert">
          {error}
        </p>
      )}
      {notice && notice !== hiddenNotice && (
        <p className="feedback feedback--notice" role="status">
          {notice}
        </p>
      )}
    </>
  )
}
