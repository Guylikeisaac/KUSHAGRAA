import type { CSSProperties } from "react";
import type { DiscPose } from "./pose";

/** Invisible marker read by the disc stage. Its top edge is the trigger line. */
export default function DiscAnchor({
  pose,
  mobile,
  style,
  className = "",
}: {
  pose: DiscPose;
  mobile?: DiscPose;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-disc={JSON.stringify(pose)}
      data-disc-m={mobile ? JSON.stringify(mobile) : undefined}
      className={`pointer-events-none absolute left-0 h-px w-px ${className}`}
      style={style}
    />
  );
}
