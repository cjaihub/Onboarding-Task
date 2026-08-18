import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          // default — uses theme-aware text/bg
          "border-transparent bg-[var(--text-primary)] text-[var(--surface-card)]": variant === "default",
          // success
          "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400": variant === "success",
          // warning
          "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400": variant === "warning",
          // danger
          "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400": variant === "danger",
          // info
          "border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-400": variant === "info",
          // outline — adapts to theme
          "border-[var(--border-default)] text-[var(--text-primary)] bg-transparent": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}
