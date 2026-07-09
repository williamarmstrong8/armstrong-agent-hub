import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium select-none nu-pressable nu-focus disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        raised: "nu-raised-sm text-foreground hover:text-foreground",
        accent:
          "bg-accent text-accent-fg shadow-[var(--shadow)] border border-transparent",
        inset: "nu-inset text-muted hover:text-foreground",
        ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
        default:
          "bg-accent text-accent-fg shadow-[var(--shadow)] border border-transparent",
        outline: "border border-border bg-background hover:bg-surface-2",
        secondary: "nu-inset text-foreground",
        destructive: "bg-danger/10 text-danger hover:bg-danger/15",
        link: "text-info underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-10 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-6 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "h-10 w-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "h-7 w-7 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: { variant: "raised", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
