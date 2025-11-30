"use client";

import * as React from "react";
import { Switch as SwitchPrimitives } from "radix-ui";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked ?? false);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  return (
    <div className="inline-flex items-center gap-2">
      {/* Left label: show "off" when unchecked */}
      <span
        className={cn(
          "text-xs font-medium text-black dark:text-white transition-opacity",
          !isChecked ? "opacity-100" : "opacity-0"
        )}
      >
        off
      </span>

      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          // Checked state: primary color with border (lighter)
          "data-[state=checked]:bg-primary/70 data-[state=checked]:border-primary/50",
          // Unchecked state: muted background with visible border (lighter)
          "data-[state=unchecked]:bg-muted/30 data-[state=unchecked]:border-border/50",
          "!opacity-100",
          className
        )}
        checked={checked}
        onCheckedChange={(checked) => {
          setIsChecked(checked);
          props.onCheckedChange?.(checked);
        }}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-black dark:bg-white shadow-md ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            "border-2 border-black dark:border-white",
            "!bg-opacity-100"
          )}
        />
      </SwitchPrimitives.Root>

      {/* Right label: show "on" when checked */}
      <span
        className={cn(
          "text-xs font-medium text-black dark:text-white transition-opacity",
          isChecked ? "opacity-100" : "opacity-0"
        )}
      >
        on
      </span>
    </div>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
