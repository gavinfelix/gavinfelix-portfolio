import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "shimmer" | "pulse";
}) {
  const baseClasses = "rounded-xl";
  
  const variantClasses = {
    default: "bg-slate-200 dark:bg-slate-800",
    shimmer: "bg-slate-200 dark:bg-slate-800 animate-shimmer",
    pulse: "bg-slate-200 dark:bg-slate-800 animate-pulse",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

export { Skeleton };






