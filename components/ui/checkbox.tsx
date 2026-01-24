'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.click();
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          className={cn(
            "h-5 w-5 shrink-0 rounded-md border border-primary ring-offset-background transition-all",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "cursor-pointer flex items-center justify-center",
            className,
            checked ? "!bg-primary !text-primary-foreground" : "bg-background hover:bg-accent",
            props.disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {checked && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
