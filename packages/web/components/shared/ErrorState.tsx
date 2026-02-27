import { UI } from '@/lib/strings'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="bg-white/80 rounded-3xl p-8 w-full max-w-xs text-center shadow-sm">
        <span className="text-3xl">⚠️</span>
        <p className="mt-3 text-sm font-semibold text-text-primary">
          {message ?? UI.errors.generic}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-5 py-2 bg-text-primary text-white text-sm font-semibold rounded-full transition-opacity active:opacity-70"
          >
            {UI.errors.retry}
          </button>
        )}
      </div>
    </div>
  )
}
