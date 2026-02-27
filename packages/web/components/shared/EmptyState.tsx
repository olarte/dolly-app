interface EmptyStateProps {
  message: string
  icon?: string
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {icon && <span className="text-3xl mb-2">{icon}</span>}
      <p className="text-sm text-text-muted text-center">{message}</p>
    </div>
  )
}
