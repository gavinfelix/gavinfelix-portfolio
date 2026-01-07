import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "shimmer" | "pulse";
}) {
  const baseClasses = "rounded-md";
  
  const variantClasses = {
    default: "bg-muted",
    shimmer: "bg-muted animate-shimmer",
    pulse: "bg-muted animate-pulse",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  )
}

export { Skeleton }
