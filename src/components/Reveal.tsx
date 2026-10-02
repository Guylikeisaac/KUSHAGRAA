"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Line-mask reveal: each word slides up out of its own clipping box. */
export function RevealWords({
  text,
  as: Tag = "div",
  className = "",
  delay = 0,
  stagger = 0.04,
  fill = "",
}: {
  text: string;
  /** text fill applied per word — gradients clipped to text don't reach transformed children */
  fill?: "" | "chrome" | "chrome-red" | "outline-text";
  as?: "div" | "span" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const words = ref.current!.querySelectorAll(".rw");
      gsap.fromTo(
        words,
        { yPercent: 115, rotate: 4 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger,
          delay,
          scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-top">
          <span className={`rw inline-block will-change-transform ${fill}`}>{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  );
}

/** Words light up one by one as the paragraph scrolls through the viewport. */
export function ScrubWords({ text, className = "", accent = [] }: { text: string; className?: string; accent?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ref.current!.querySelectorAll(".sw"),
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <p ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => {
        const clean = w.replace(/[.,—]/g, "");
        const hot = accent.includes(clean);
        return (
          <span key={i} aria-hidden className={`sw ${hot ? "font-serif italic text-molten" : ""}`}>
            {w}{" "}
          </span>
        );
      })}
    </p>
  );
}

/** Generic fade-up for blocks. */
export function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "expo.out",
          delay,
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
