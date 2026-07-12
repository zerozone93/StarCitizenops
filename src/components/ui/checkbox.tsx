"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-cyan-500/50 bg-slate-950 cursor-pointer",
          "checked:bg-cyan-600 checked:border-cyan-600",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.currentTarget.checked);
        }}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
