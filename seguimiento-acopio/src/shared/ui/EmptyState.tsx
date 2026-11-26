type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        🌾
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
