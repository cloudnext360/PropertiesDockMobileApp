import { MotiView } from "@/components/ui/moti";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, repeatReverse: true, type: "timing", duration: 900 }}
      className={cn("rounded-md bg-muted", className)}
    />
  );
}
