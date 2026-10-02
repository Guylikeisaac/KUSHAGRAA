"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import UnicornBg from "./UnicornBg";
import { motion, onLoaderDone, scrollToTarget } from "@/lib/motion";
import { projects } from "@/lib/data";
import { SCENES, UNICORN_ENABLED } from "@/lib/scenes";
import { playDiscInsert } from "@/lib/sfx";
import { soundtrack } from "@/lib/soundtrack";

type Ctx = { go: (href: string, label?: string) => void };
const TransitionCtx = createContext<Ctx>({ go: () => {} });


export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [machine, setMachine] = useState(false);
  const display = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [preload, setPreload] = useState(false);
  const pending = useRef<{ from: string; startedAt: number } | null>(null);

  useEffect(() => onLoaderDone(() => setTimeout(() => setPreload(true), 1500)), []);

  const go = useCallback(
    (href: string, text = "") => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        if (url.hash) scrollToTarget(url.hash);
        return;
      }
      if (pending.current) return;
      const project = projects.find((p) => url.pathname === `/work/${p.slug}`);
      if (project) soundtrack.stop(0.6);
      setLabel(text || project?.name || "");
      setCover(project?.cover ?? null);
      const useMachine = !!project && !motion.reduced;
      setMachine(useMachine);
      setActive(true);
      setPreload(true);
      pending.current = { from: window.location.pathname, startedAt: performance.now() };
      motion.lenis?.stop();
      router.prefetch(href);
      gsap.set(overlay.current, { visibility: "visible" });

      if (useMachine) {
        // a disc player rises, the project's disc drops into the slot, it reads, then the page loads
        const name = (text || project!.name).toUpperCase();
        const say = (msg: string) => () => {
          if (display.current) display.current.textContent = msg;
        };
        // sounds are scheduled on the click itself, timed to the timeline below
        playDiscInsert({ slideAt: 1.55, seatAt: 2.4, readyAt: 2.75 });
        const tl = gsap.timeline();
        tl.call(say("INSERT DISC"))
          .fromTo(overlay.current, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut" })
          .fromTo(".trm-machine", { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, 0.3)
          .fromTo(".trm-disc", { yPercent: -40, opacity: 0, scale: 0.9 }, { yPercent: -10, opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }, 0.6)
          .to(".trm-disc", { yPercent: 104, duration: 0.85, ease: "power3.in" }, 1.55)
          .fromTo(".trm-slotglow", { opacity: 0 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 1 }, 2.25)
          .call(say("READING…"), undefined, 2.3)
          .fromTo(".trm-progress", { scaleX: 0 }, { scaleX: 1, duration: 0.65, ease: "power2.inOut" }, 2.35)
          .call(say(`▶ ${name}`), undefined, 2.75)
          .call(() => router.push(href, { scroll: false }), undefined, 3.0);
        return;
      }

      gsap.fromTo(
        overlay.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: motion.reduced ? 0.01 : 0.85,
          ease: "expo.inOut",
          onComplete: () => router.push(href, { scroll: false }),
        },
      );
      gsap.fromTo(".tr-line", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", delay: 0.35, stagger: 0.06 });
    },
    [router],
  );

  // the new route rendered → hold briefly, then reveal it
  useEffect(() => {
    const p = pending.current;
    if (!p || p.from === pathname) return;
    const held = performance.now() - p.startedAt;
    const wait = Math.max(0, 1500 - held) / 1000;
    gsap.to(overlay.current, {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: motion.reduced ? 0.01 : 0.95,
      ease: "expo.inOut",
      delay: motion.reduced ? 0 : wait,
      onStart: () => motion.lenis?.start(),
      onComplete: () => {
        gsap.set(overlay.current, { visibility: "hidden" });
        pending.current = null;
        setActive(false);
      },
    });
  }, [pathname]);

  return (
    <TransitionCtx.Provider value={{ go }}>
      {children}
      <div
        ref={overlay}
        className="invisible fixed inset-0 z-[150] overflow-hidden bg-ink"
        style={{ clipPath: "inset(100% 0% 0% 0%)" }}
        aria-hidden={!active}
      >
        {UNICORN_ENABLED && preload && (
          <>
            <UnicornBg
              projectId={SCENES.loading}
              forcePaused={!active}
              className="opacity-80 [filter:grayscale(1)_contrast(1.3)_brightness(0.6)]"
            />
            <div className="absolute inset-0 bg-molten opacity-25 mix-blend-color" />
          </>
        )}
        {/* always mounted so the GSAP timeline can find it the moment a project link is clicked */}
        <div className={machine ? "" : "hidden"}>
          <DiscPlayer cover={cover} display={display} active={active && machine} />
        </div>
        {!machine && (
          <>
            {!UNICORN_ENABLED && (
              <div aria-hidden className="absolute inset-0">
                <div className="absolute right-[-12vmin] top-1/2 h-[95vmin] w-[95vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,59,47,0.28),transparent_62%)] blur-2xl md:right-[4vw]" />
                {/* the chrome disc spins up while the page loads */}
                <div className="absolute right-[-18vmin] top-1/2 h-[78vmin] w-[78vmin] -translate-y-1/2 md:right-[8vw] md:h-[70vmin] md:w-[70vmin]">
                  <div className={`h-full w-full rounded-full shadow-[0_40px_120px_-30px_rgba(255,59,47,0.45)] ${active ? "animate-[spin_2.6s_linear_infinite]" : ""}`}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/img/chrome-cd.webp" alt="" className="h-full w-full object-contain" />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,5,0.85)_75%)]" />
            <div className="relative flex h-full flex-col justify-between px-[var(--gutter)] py-8">
              <span className="label">Loading</span>
              <div className="overflow-hidden">
                <div className="tr-line font-display chrome text-[18vw] md:text-[11vw]">{label || "Loading"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="pulse-dot" />
                <span className="label text-bone">Spinning up the disc</span>
              </div>
            </div>
          </>
        )}
      </div>
    </TransitionCtx.Provider>
  );
}

export const useTransition = () => useContext(TransitionCtx);

/** Brushed-metal slot-loading disc player used when opening a case study. */
function DiscPlayer({
  cover,
  display,
  active,
}: {
  cover: string | null;
  display: React.RefObject<HTMLSpanElement | null>;
  active: boolean;
}) {
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center px-[var(--gutter)]">
      <div className="absolute left-1/2 top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,59,47,0.18),transparent_62%)] blur-2xl" />
      <span className="label absolute left-[var(--gutter)] top-8">Loading project</span>

      <div className="relative w-[min(86vw,620px)]">
        {/* lane above the slot: the disc is clipped as it slides in */}
        <div className="absolute bottom-[calc(100%-14px)] left-1/2 h-[min(80vw,560px)] w-[min(96vw,720px)] -translate-x-1/2 overflow-hidden">
          <div className="trm-disc absolute bottom-0 left-[calc(50%-min(28vw,195px))] aspect-square w-[min(56vw,390px)] opacity-0">
            <div className={`h-full w-full overflow-hidden rounded-full shadow-[0_30px_80px_-20px_rgba(255,59,47,0.5)] ${active ? "animate-[spin_1.6s_linear_infinite]" : ""}`}>
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full scale-[1.067] object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="trm-machine relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#2c2c31_0%,#151517_55%,#0c0c0e_100%)] px-[6%] pb-[5%] pt-[9%] opacity-0 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.18)]">
          {/* brushed metal grain */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_3px)]" />
          {/* the slot */}
          <div className="absolute left-[14%] right-[14%] top-[10px] h-[9px] rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.14)]" />
          <div className="trm-slotglow absolute left-[16%] right-[16%] top-[12px] h-[5px] rounded-full bg-molten opacity-0 blur-[5px]" />

          <div className="relative flex items-stretch gap-4">
            <div className="flex-1 rounded-[12px] border border-white/5 bg-[#0b0303] px-4 py-3 shadow-[inset_0_0_24px_rgba(255,59,47,0.12)]">
              <span
                ref={display}
                className="block truncate font-mono text-[12px] uppercase tracking-[0.22em] text-molten [text-shadow:0_0_8px_rgba(255,59,47,0.85)] md:text-[14px]"
              >
                INSERT DISC
              </span>
              <div className="mt-3 h-[2px] w-full bg-white/10">
                <div className="trm-progress h-full origin-left scale-x-0 bg-molten shadow-[0_0_8px_rgba(255,59,47,0.9)]" />
              </div>
            </div>
            <div className="hidden items-end gap-[3px] pb-1 sm:flex" aria-hidden>
              {[0.9, 0.5, 1, 0.7, 0.4, 0.8, 0.6].map((d, i) => (
                <span
                  key={i}
                  className="block h-8 w-[5px] origin-bottom rounded-sm bg-gradient-to-t from-molten to-[#ffb3a9]"
                  style={{ animation: active ? `vu ${0.5 + d * 0.5}s ease-in-out ${i * 0.07}s infinite alternate` : "none" }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {["▶", "⏏"].map((g) => (
                <span
                  key={g}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#3a3a40,#1b1b1e)] text-[12px] text-bone/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.6)]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/35">KC—01 · Disc player</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-molten shadow-[0_0_8px_rgba(255,59,47,1)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/35">Power</span>
            </span>
          </div>
        </div>
      </div>

      <span className="label absolute bottom-8 left-[var(--gutter)] flex items-center gap-3 text-bone">
        <span className="pulse-dot" /> Inserting disc
      </span>
    </div>
  );
}

/** Drop-in link that plays the page transition for route changes. */
export function TLink({
  href,
  label,
  children,
  className,
  ...rest
}: {
  href: string;
  label?: string;
  children: ReactNode;
  className?: string;
  "data-cursor"?: string;
  "aria-label"?: string;
}) {
  const { go } = useTransition();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    go(href, label);
  };
  return (
    <NextLink href={href} onClick={onClick} className={className} {...rest}>
      {children}
    </NextLink>
  );
}
