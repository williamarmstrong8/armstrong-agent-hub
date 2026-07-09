import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  variant = "raised",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "raised" | "flat" | "inset" }) {
  const variantClass =
    variant === "inset" ? "nu-inset" : variant === "flat" ? "nu-flat" : "nu-raised";
  return (
    <div
      className={cn("rounded-[var(--radius-lg)] p-5", variantClass, className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight text-foreground", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
