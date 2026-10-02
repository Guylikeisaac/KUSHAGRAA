"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Ring cursor with a trailing dot. Elements can set data-cursor="View"
 * to morph the ring into a labelled disc.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");

    const xr = gsap.quickTo(ring.current, "x", { duration: 0.45, ease: "power3" });
    const yr = gsap.quickTo(ring.current, "y", { duration: 0.45, ease: "power3" });
    const xd = gsap.quickTo(dot.current, "x", { duration: 0.08 });
    const yd = gsap.quickTo(dot.current, "y", { duration: 0.08 });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([ring.current, dot.current], { x: e.clientX, y: e.clientY });
        gsap.to([ring.current, dot.current], { opacity: 1, duration: 0.3 });
      }
      xr(e.clientX);
      yr(e.clientY);
      xd(e.clientX);
      yd(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor]");
      const text = t?.dataset.cursor ?? "";
      setLabel(text);
      gsap.to(ring.current, {
        scale: text ? 2.6 : t ? 1.7 : 1,
        backgroundColor: text ? "rgba(255,59,47,0.92)" : "rgba(255,59,47,0)",
        borderColor: text ? "rgba(255,59,47,0)" : t ? "rgba(255,59,47,0.9)" : "rgba(255,255,255,0.55)",
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(dot.current, { scale: t ? 0 : 1, duration: 0.25 });
    };
    const down = () => gsap.to(ring.current, { scale: "*=0.85", duration: 0.15 });
    const up = () => gsap.to(ring.current, { scale: "/=0.85", duration: 0.2 });
    const leave = () => gsap.to([ring.current, dot.current], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([ring.current, dot.current], { opacity: 1, duration: 0.2 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div className="cursor-root pointer-events-none fixed inset-0 z-[1000]" aria-hidden>
      <div
        ref={ring}
        className="absolute opacity-0 -left-5 -top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/55"
      >
        <span className="font-mono text-[5px] font-semibold uppercase tracking-[0.12em] text-black">{label}</span>
      </div>
      <div ref={dot} className="absolute opacity-0 -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-molten" />
    </div>
  );
}
