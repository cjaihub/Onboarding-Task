/**
 * FeedbackBanner — shared inline feedback component.
 *
 * Replaces all native alert()/prompt()/confirm() and one-off inline error divs
 * with a single consistent, accessible, theme-aware banner.
 *
 * Usage:
 *   <FeedbackBanner type="error" message="Something failed" onDismiss={() => setBanner(null)} />
 *
 * - type="error"   → red border, red icon, red text
 * - type="success" → green border, green icon
 * - type="warning" → amber border, amber icon
 * - type="info"    → gray border, gray icon
 *
 * Accessibility:
 * - role="alert" on error/warning (live region, announced immediately)
 * - role="status" on success/info (polite, non-intrusive)
 * - aria-label on dismiss button
 * - Dismiss button is keyboard-focusable
 */
import * as React from "react"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

export type FeedbackType = "error" | "success" | "warning" | "info"

export interface FeedbackBannerProps {
  type: FeedbackType
  message: string
  onDismiss?: () => void
  /** If true, renders without the dismiss button (e.g. persistent field errors) */
  persistent?: boolean
  className?: string
}

const CONFIG: Record<
  FeedbackType,
  { icon: React.ElementType; iconCls: string; borderCls: string; bgCls: string; textCls: string; role: string }
> = {
  error: {
    icon: AlertCircle,
    iconCls: "text-red-500",
    borderCls: "border-red-300 dark:border-red-800",
    bgCls: "bg-red-50 dark:bg-red-950/40",
    textCls: "text-red-800 dark:text-red-300",
    role: "alert",
  },
  success: {
    icon: CheckCircle2,
    iconCls: "text-green-500",
    borderCls: "border-green-300 dark:border-green-800",
    bgCls: "bg-green-50 dark:bg-green-950/40",
    textCls: "text-green-800 dark:text-green-300",
    role: "status",
  },
  warning: {
    icon: AlertTriangle,
    iconCls: "text-amber-500",
    borderCls: "border-amber-300 dark:border-amber-800",
    bgCls: "bg-amber-50 dark:bg-amber-950/40",
    textCls: "text-amber-800 dark:text-amber-300",
    role: "alert",
  },
  info: {
    icon: Info,
    iconCls: "text-gray-500",
    borderCls: "border-gray-300 dark:border-gray-800",
    bgCls: "bg-gray-50 dark:bg-gray-950/40",
    textCls: "text-gray-800 dark:text-gray-300",
    role: "status",
  },
}

export function FeedbackBanner({ type, message, onDismiss, persistent = false, className = "" }: FeedbackBannerProps) {
  const { icon: Icon, iconCls, borderCls, bgCls, textCls, role } = CONFIG[type]

  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={[
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        bgCls,
        borderCls,
        textCls,
        className,
      ].join(" ")}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${iconCls}`} aria-hidden="true" />
      <span className="flex-1 leading-relaxed">{message}</span>
      {!persistent && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1 rounded"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** Hook: auto-dismiss success banners after `delay` ms */
export function useFeedback(delay = 4000) {
  const [banner, setBanner] = React.useState<{ type: FeedbackType; message: string } | null>(null)

  React.useEffect(() => {
    if (!banner || banner.type !== "success") return
    const t = setTimeout(() => setBanner(null), delay)
    return () => clearTimeout(t)
  }, [banner, delay])

  const showError = React.useCallback((msg: string) => setBanner({ type: "error", message: msg }), [])
  const showSuccess = React.useCallback((msg: string) => setBanner({ type: "success", message: msg }), [])
  const clear = React.useCallback(() => setBanner(null), [])

  return { banner, setBanner, showError, showSuccess, clear }
}
