"use client";

import type { ReactNode, PointerEvent } from "react";

/** Glass card with a molten spotlight that follows the pointer. */
export default function SpotCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onPointerMove={move} className={`glass group overflow-hidden rounded-[22px] ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(255,59,47,0.16), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
