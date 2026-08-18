import * as React from "react"
import { Inbox } from "lucide-react"

export function EmptyState({ 
  title = "No data available", 
  message, 
  icon,
  action
}: { 
  title?: string, 
  message?: string, 
  icon?: React.ReactNode,
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
      {icon ? icon : <Inbox className="h-12 w-12 text-gray-400 mb-4" />}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {message && <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
