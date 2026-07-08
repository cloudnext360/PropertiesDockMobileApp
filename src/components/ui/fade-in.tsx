import type { ReactNode } from "react";

import { MotiView } from "@/components/ui/moti";

interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
  /** Upward travel distance (mirrors web `fade-in`: translateY(10px)). */
  distance?: number;
}

/**
 * Mirror of the web `fade-in` keyframe (opacity 0→1, translateY 10→0, ~ease-out).
 * Used for tasteful screen/section entrances.
 */
export function FadeInView({ children, className, delay = 0, distance = 10 }: FadeInViewProps) {
  return (
    <MotiView
      className={className}
      from={{ opacity: 0, translateY: distance }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
    >
      {children}
    </MotiView>
  );
}
