import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          /*
           * One field surface across the form.
           *
           * This was a soft `bg-muted/50` fill with a transparent border,
           * chosen so fifteen bordered rectangles would not compete with the
           * invoice beside them. But the date pickers are `Button
           * variant="outline"` and the currency picker is a `SelectTrigger`,
           * and both of those are `border-input bg-background` — so a single
           * form row could show three different surfaces. Consistency between
           * controls that sit next to each other beats a quieter field.
           */
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "hover:border-primary/50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Invalid fields keep a real border, since that is a state the user
          // needs to see without pointing at it.
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:bg-destructive/5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
