export function Spinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-green-600">
      <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <span className="text-4xl mb-3">😵</span>
      <p className="text-red-500 text-sm text-center mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = '🎾', title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="text-gray-600 font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
