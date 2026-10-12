type FeedbackProps = {
  error: string
  notice: string
}

export function Feedback({ error, notice }: FeedbackProps) {
  return (
    <>
      {error && (
        <p className="feedback feedback--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="feedback feedback--notice" role="status">
          {notice}
        </p>
      )}
    </>
  )
}
