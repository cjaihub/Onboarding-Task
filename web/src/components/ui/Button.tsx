import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
          {
            // default — brand (red)
            "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20": variant === "default",
            // secondary — surface-raised
            "bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-card)]": variant === "secondary",
            // danger
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            // ghost
            "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]": variant === "ghost",
            // outline
            "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-raised)]": variant === "outline",
            // sizes
            "h-9 px-3 py-1.5":   size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-6": size === "lg",
            "h-10 w-10 p-0":    size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
