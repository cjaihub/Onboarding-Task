import * as React from "react"
import { AlertCircle } from "lucide-react"

export function ErrorState({ 
  title = "An error occurred", 
  message,
  actionLabel,
  onAction
}: { 
  title?: string; 
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-200 bg-red-50">
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-900">{title}</h3>
      {message && <p className="mt-2 text-sm text-red-700 max-w-md">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
