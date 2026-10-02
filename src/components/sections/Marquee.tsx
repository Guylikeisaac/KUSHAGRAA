"use client";

import { useEffect, useRef } from "react";
import { motion } from "@/lib/motion";

const words = ["Websites", "Web apps", "Product design", "Portfolios", "Next.js", "Motion", "SaaS"];

function Row({ reverse = false, outline = false }: { reverse?: boolean; outline?: boolean }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0;
    let raf = 0;
    let dir = 1;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const v = motion.velocity;
      if (Math.abs(v) > 0.5) dir = Math.sign(v);
      const speed = motion.reduced ? 0 : (40 + Math.min(Math.abs(v), 80) * 9) * dir * (reverse ? -1 : 1);
      const el = track.current;
      if (el) {
        const half = el.scrollWidth / 2;
        x = (x - speed * dt) % half;
        if (x > 0) x -= half;
        el.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const items = [...words, ...words];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div ref={track} className="inline-flex will-change-transform">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {items.map((w, i) => (
              <span key={i} className="flex items-center">
                <span className={`font-display px-6 text-[15vw] md:text-[8.5vw] ${outline ? "outline-text" : "chrome"}`}>{w}</span>
                <span className="text-[5vw] text-molten md:text-[2.6vw]">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section aria-hidden className="relative z-[4] -mt-px select-none border-y border-white/10 bg-ink/60 py-4 backdrop-blur-sm md:py-6">
      <Row />
      <Row reverse outline />
    </section>
  );
}
