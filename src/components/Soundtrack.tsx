"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { soundtrack, SOUNDTRACK } from "@/lib/soundtrack";
import { motion } from "@/lib/motion";

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

  // load the player right away, so it's ready the moment "Enter with sound" is clicked
  useEffect(() => {
    if (host.current) void soundtrack.mount(host.current);
  }, []);

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
    // the intro's "Enter" choice already decided whether music plays
    if (document.documentElement.dataset.loaded === "true" && sessionStorage.getItem("kc-entered") === "1") {
      started.current = true;
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
      className={`fixed bottom-4 left-4 z-[70] transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] md:bottom-8 md:left-[var(--gutter)] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
      }`}
    >
      <div className="group flex items-center gap-3 rounded-[16px] border border-white/10 bg-ink/70 p-1.5 pr-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {/* YouTube's player must stay visible (≥ 200 × 200) while it plays */}
        <div className="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-[11px] bg-black">
          <div ref={host} />
        </div>
        <div className="flex h-[200px] w-[130px] flex-col justify-between py-2">
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {[0.9, 0.5, 1, 0.65].map((d, i) => (
              <span
                key={i}
                className="block h-full w-[2px] origin-bottom rounded-full bg-molten"
                style={{ animation: state.playing ? `vu ${0.45 + d * 0.4}s ease-in-out ${i * 0.08}s infinite alternate` : "none", transform: state.playing ? undefined : "scaleY(0.3)" }}
              />
            ))}
          </span>
          <div>
            <p className="label text-[9.5px]">Now playing</p>
            <p className="font-display chrome mt-1 text-[30px] leading-[0.88]">{SOUNDTRACK.title}</p>
            <p className="mt-1 text-[12px] text-bone/60">{SOUNDTRACK.artist}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="label text-[9px]">{SOUNDTRACK.credit}</span>
            <button
              data-no-soundtrack
              onClick={() => {
                soundtrack.setMuted(true);
                soundtrack.stop(0.4);
              }}
              aria-label="Stop music"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] text-bone/60 ring-1 ring-white/10 transition hover:text-molten hover:ring-molten/40"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
