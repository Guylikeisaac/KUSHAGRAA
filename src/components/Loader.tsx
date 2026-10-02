"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { LOADER_DONE, motion } from "@/lib/motion";

const SRC = "/img/loader-collage.jpg"; // 10 × 10 grid of album covers
const N = 10;

/**
 * Intro: the screen fills with album covers one at a time until the collage is
 * complete — the counter is tied to the tiles, so it hits 100 on the last one.
 * Then the covers flip away from the centre and the hero plays.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const seen = sessionStorageGet("kc-seen") === "1";
    motion.lenis?.stop();

    const finish = () => {
      html.dataset.loaded = "true";
      motion.lenis?.start();
      window.dispatchEvent(new Event(LOADER_DONE));
    };

    if (motion.reduced) {
      finish();
      const id = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(id);
    }

    const tiles = Array.from(grid.current!.children) as HTMLElement[];
    // random fill order, so the collage assembles like a crate being flipped through
    const order = [...tiles];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    gsap.set(tiles, { opacity: 0, scale: 0.55, rotate: () => gsap.utils.random(-14, 14) });

    const fill = seen ? 1.0 : 2.4;
    const state = { v: 0 };
    const tl = gsap.timeline({ paused: true });
    tl.to(order, {
      opacity: 1,
      scale: 1,
      rotate: 0,
      duration: 0.42,
      ease: "back.out(1.8)",
      stagger: { each: fill / order.length },
    })
      .to(
        state,
        {
          v: 100,
          duration: fill + 0.2,
          ease: "none",
          onUpdate: () => {
            if (count.current) count.current.textContent = String(Math.round(state.v)).padStart(3, "0");
            if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`;
          },
        },
        0,
      )
      // the collage, complete — a beat, then it breaks apart from the centre
      .to(".ld-meta", { opacity: 0, y: -8, duration: 0.35, stagger: 0.04 }, "+=0.35")
      .to(
        tiles,
        {
          opacity: 0,
          scale: 0.2,
          rotateY: 90,
          duration: 0.55,
          ease: "power3.in",
          stagger: { grid: [N, N], from: "center", amount: 0.55 },
        },
        "<",
      )
      .add(finish, "-=0.45")
      .to(root.current, { backgroundColor: "rgba(5,5,5,0)", duration: 0.45, ease: "power2.out" }, "-=0.35")
      .add(() => {
        setGone(true);
        sessionStorageSet("kc-seen", "1");
      });

    // start once the collage image is ready (or after a short grace period)
    const img = new Image();
    img.src = SRC;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      tl.play();
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.all([img.decode().catch(() => {}), fonts]).then(start);
    const fallback = setTimeout(start, 2500);

    return () => {
      clearTimeout(fallback);
      tl.kill();
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[200] overflow-hidden bg-ink" aria-live="polite" aria-label="Loading portfolio">
      {/* square collage sized to cover the viewport */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[max(100vw,100vh)] -translate-x-1/2 -translate-y-1/2 [perspective:1200px]">
        <div ref={grid} className="grid h-full w-full grid-cols-10 grid-rows-10">
          {Array.from({ length: N * N }, (_, i) => (
            <div
              key={i}
              className="will-change-transform"
              style={{
                backgroundImage: `url(${SRC})`,
                backgroundSize: `${N * 100}% ${N * 100}%`,
                backgroundPosition: `${((i % N) * 100) / (N - 1)}% ${(Math.floor(i / N) * 100) / (N - 1)}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* keep the type readable over the covers */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.75)_0%,transparent_22%,transparent_58%,rgba(5,5,5,0.92)_100%)]" />

      <div className="relative flex h-full flex-col justify-between px-[var(--gutter)] py-6">
        <div className="ld-meta label flex justify-between text-bone/80">
          <span>Kushagra Chaudhary</span>
          <span>Portfolio ©2026</span>
        </div>

        <div className="ld-meta">
          <div className="mb-3 flex items-end justify-between">
            <span className="label text-bone/80">Loading the crate</span>
            <span ref={count} className="font-display text-6xl text-bone md:text-8xl">
              000
            </span>
          </div>
          <div className="h-px w-full bg-white/15">
            <div ref={bar} className="h-px w-full origin-left scale-x-0 bg-molten" />
          </div>
        </div>
      </div>
    </div>
  );
}

function sessionStorageGet(k: string) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionStorageSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch {}
}
