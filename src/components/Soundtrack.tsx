"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { soundtrack, SOUNDTRACK } from "@/lib/soundtrack";
import { motion, onLoaderDone } from "@/lib/motion";

/**
 * Owns the "Now playing" card (which holds the visible YouTube player) and the
 * autoplay rules: on laptops/desktops the track starts on the visitor's first
 * interaction with the home page; on phones only the nav toggle starts it.
 */
export default function Soundtrack() {
  const pathname = usePathname();
  const host = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [state, setState] = useState({ playing: false, wanted: false });

  useEffect(() => soundtrack.subscribe(setState), []);

  // load the player quietly once the intro has finished
  useEffect(
    () =>
      onLoaderDone(() => {
        setTimeout(() => host.current && void soundtrack.mount(host.current), 800);
      }),
    [],
  );

  useEffect(() => {
    if (pathname !== "/") {
      soundtrack.stop();
      return;
    }
    const desktop = window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
    if (motion.reduced || !desktop) return;
    if (started.current) {
      soundtrack.play();
      return;
    }
    const begin = (e: Event) => {
      // the click that opens a case study shouldn't start the music just to stop it
      if ((e.target as HTMLElement | null)?.closest?.('a[href^="/work/"], [data-no-soundtrack]')) return;
      started.current = true;
      soundtrack.play();
      remove();
    };
    const opts = { capture: true, passive: true } as const;
    const remove = () => {
      window.removeEventListener("pointerdown", begin, opts);
      window.removeEventListener("keydown", begin, opts);
    };
    window.addEventListener("pointerdown", begin, opts);
    window.addEventListener("keydown", begin, opts);
    return remove;
  }, [pathname]);

  const shown = state.wanted || state.playing;

  return (
    <aside
      aria-label="Now playing"
      aria-hidden={!shown}
      className={`glass fixed bottom-4 right-4 z-[70] w-[216px] rounded-[18px] p-2 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] md:bottom-auto md:right-[var(--gutter)] md:top-[92px] md:w-[372px] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0 md:-translate-y-6"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1.5 pb-2 pt-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {[0.9, 0.5, 1, 0.65].map((d, i) => (
              <span
                key={i}
                className="block h-full w-[2px] origin-bottom rounded-full bg-molten"
                style={{ animation: state.playing ? `vu ${0.45 + d * 0.4}s ease-in-out ${i * 0.08}s infinite alternate` : "none", transform: state.playing ? undefined : "scaleY(0.3)" }}
              />
            ))}
          </span>
          <p className="min-w-0 truncate text-[12.5px] text-bone">
            <span className="font-semibold">{SOUNDTRACK.title}</span>
            <span className="text-bone/55"> — {SOUNDTRACK.artist}</span>
          </p>
        </div>
        <button
          data-no-soundtrack
          onClick={() => {
            soundtrack.setMuted(true);
            soundtrack.stop(0.4);
          }}
          aria-label="Stop music"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-bone/60 ring-1 ring-white/10 transition hover:text-molten hover:ring-molten/40"
        >
          ✕
        </button>
      </div>
      {/* YouTube's player must stay visible (≥ 200 × 200) while it plays */}
      <div className="h-[200px] w-[200px] overflow-hidden rounded-[12px] bg-black md:w-[356px]">
        <div ref={host} />
      </div>
      <p className="label px-1.5 pb-0.5 pt-2 text-[9.5px]">{SOUNDTRACK.credit}</p>
    </aside>
  );
}
