"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { useTransition } from "./Transition";
import { motion } from "@/lib/motion";
import { profile } from "@/lib/data";
import SoundToggle from "./SoundToggle";

const links = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "crate", label: "Music" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const bar = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hover, setHover] = useState(-1);
  const pathname = usePathname();
  const { go } = useTransition();

  // progress bar · hide on scroll down / reveal on scroll up · which section is in view
  useEffect(() => {
    let last = 0;
    let hidden = false;
    let raf = 0;
    let current = -1;
    const loop = () => {
      const y = motion.lenis ? motion.lenis.scroll : window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      const down = y > last + 2;
      const up = y < last - 2;
      if (down && y > 160 && !hidden) {
        hidden = true;
        gsap.to(header.current, { yPercent: -150, duration: 0.6, ease: "power3.out" });
      } else if ((up || y < 160) && hidden) {
        hidden = false;
        gsap.to(header.current, { yPercent: 0, duration: 0.6, ease: "power3.out" });
      }
      last = y;

      const line = window.innerHeight * 0.4;
      let idx = -1;
      links.forEach((l, i) => {
        const r = document.getElementById(l.id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) idx = i;
      });
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // the glass lens glides to the hovered link, otherwise rests on the section in view
  const target = hover >= 0 ? hover : active;
  useEffect(() => {
    const el = items.current[target];
    const l = lens.current;
    if (!l) return;
    if (!el) {
      gsap.to(l, { opacity: 0, scale: 0.85, duration: 0.3, ease: "power2.out" });
      return;
    }
    gsap.to(l, {
      x: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1,
      scale: 1,
      duration: motion.reduced ? 0 : 0.75,
      ease: "elastic.out(1, 0.72)",
    });
    // a quick squash as it sets off, like a drop of liquid
    if (!motion.reduced) gsap.fromTo(l, { scaleY: 0.82 }, { scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
  }, [target]);

  useEffect(() => {
    if (open) {
      motion.lenis?.stop();
      gsap.fromTo(".mm-item", { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, delay: 0.15 });
    } else motion.lenis?.start();
  }, [open]);

  // close the menu whenever the route changes
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  const nav = (id: string) => {
    setOpen(false);
    setTimeout(() => go(`/#${id}`), open ? 260 : 0);
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-molten" />
      </div>

      <header ref={header} className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-[var(--gutter)] pt-4">
        <div className="glass pointer-events-auto flex h-12 items-center gap-1 rounded-full p-1">
          {/* desktop: links with the gliding glass lens */}
          <nav ref={pill} className="relative hidden items-center lg:flex" aria-label="Primary" onPointerLeave={() => setHover(-1)}>
            <span ref={lens} aria-hidden className="nav-lens pointer-events-none absolute inset-y-0 left-0 w-0 rounded-full opacity-0" />
            {links.map((l, i) => (
              <button
                key={l.id}
                ref={(el) => {
                  items.current[i] = el;
                }}
                onClick={() => nav(l.id)}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(-1)}
                aria-current={active === i ? "true" : undefined}
                className={`relative z-[1] rounded-full px-[18px] py-2.5 text-[13px] transition-colors duration-300 ${
                  target === i ? "text-bone" : "text-bone/60 hover:text-bone"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* phones / tablets: a compact menu button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 items-center gap-3 rounded-full px-4 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-px w-4 bg-bone transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-4 bg-bone transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
            <span className="label text-bone">{open ? "Close" : "Menu"}</span>
          </button>

          <span aria-hidden className="mx-1 h-5 w-px bg-white/10" />
          <SoundToggle />
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col justify-end bg-ink/80 px-[var(--gutter)] pb-10 pt-28 backdrop-blur-2xl transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex flex-col" aria-label="Mobile">
          {links.map((l, i) => (
            <button key={l.id} onClick={() => nav(l.id)} className="overflow-hidden border-b border-white/10 py-2 text-left">
              <span className="mm-item flex items-baseline justify-between">
                <span className="font-display chrome text-[15vw] leading-[0.95]">{l.label}</span>
                <span className="label">0{i + 1}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
          {profile.socials.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="label text-bone">
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
