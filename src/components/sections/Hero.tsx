"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import UnicornBg from "../UnicornBg";
import DiscAnchor from "../disc/DiscAnchor";
import Magnetic from "../Magnetic";
import LocalTime from "../LocalTime";
import { useTransition } from "../Transition";
import { motion, onLoaderDone } from "@/lib/motion";
import { profile } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Templates 03 + 04 are remixes that still carry another creator's text
 * ("S.M HARIS", "BIOSPHERE"), a face, and the free-plan watermark. Flip this
 * on once those layers are removed in Unicorn Studio.
 */
const USE_UNICORN_HERO = false;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { go } = useTransition();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      gsap.set(".h-letter", { yPercent: 105 });
      gsap.set([".h-photo", ".h-ui", ".h-hud"], { opacity: 0 });

      const intro = () => {
        if (motion.reduced) {
          gsap.set(".h-letter", { yPercent: 0 });
          gsap.set([".h-photo", ".h-ui", ".h-hud"], { opacity: 1 });
          return;
        }
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.to(".h-letter", { yPercent: 0, duration: 1.5, stagger: 0.055 })
          .fromTo(".h-photo", { opacity: 0, y: 80, scale: 1.08 }, { opacity: 1, y: 0, scale: 1, duration: 1.8 }, 0.25)
          .fromTo(".h-ui", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.7)
          .fromTo(".h-hud", { opacity: 0 }, { opacity: 1, duration: 1.4, stagger: 0.05 }, 0.9);
      };
      const off = onLoaderDone(intro);

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        // the name tears apart and smears, like the motion-blurred title in the reference
        gsap.to(".h-name", { yPercent: -28, letterSpacing: "0.06em", filter: "blur(10px)", opacity: 0.25, ease: "none", scrollTrigger: st });
        gsap.to(".h-photo-inner", { yPercent: 14, scale: 1.06, ease: "none", scrollTrigger: st });
        gsap.to(".h-ui-wrap", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
        // Unicorn scenes: 03 hands over to 04 as you leave the hero
        if (USE_UNICORN_HERO) {
          gsap.fromTo(".h-scene-b", { opacity: 0.15 }, { opacity: 0.9, ease: "none", scrollTrigger: st });
          gsap.to(".h-scene-a", { opacity: 0.2, ease: "none", scrollTrigger: st });
        }
      });

      return () => off();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative h-[100svh] min-h-[620px] w-full overflow-hidden" aria-label="Intro">
      {/* z-0 — Unicorn scenes, darkened and pulled toward molten red */}
      <div className="absolute inset-0 z-0" aria-hidden>
        {USE_UNICORN_HERO ? (
          <div className="absolute inset-0 [filter:grayscale(1)_contrast(1.25)_brightness(0.55)]">
            <div className="h-scene-a absolute inset-0">
              <UnicornBg projectId="q7jAhd943BzfvUaRaNbU" />
            </div>
            <div className="h-scene-b absolute inset-0 hidden mix-blend-screen md:block">
              <UnicornBg projectId="mHlUGXTXKE0SIMFdHiG0" fps={30} />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-[38%] h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,59,47,0.22),transparent_62%)] blur-2xl" />
            <div className="absolute inset-x-0 top-[44%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 bg-molten opacity-[0.16] mix-blend-color" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent_0%,rgba(5,5,5,0.55)_60%,#050505_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* z-1 — the name sits BEHIND the disc and the portrait */}
      <h1 className="absolute inset-x-0 top-[13svh] z-[1] text-center md:top-[14vh]" aria-label={`${profile.name} — ${profile.title}`}>
        <span aria-hidden className="h-name chrome font-display block whitespace-nowrap text-[25.5vw] md:text-[21.5vw]">
          {profile.heroName.split("").map((l, i) => (
            <span key={i} className="inline-block overflow-hidden align-top">
              <span className="h-letter chrome inline-block">{l}</span>
            </span>
          ))}
        </span>
      </h1>

      <DiscAnchor
        style={{ top: "50%" }}
        pose={{ x: 0.74, y: 0.5, s: 0.62, rx: -0.2, ry: -0.65, rz: 0.15, spin: 1, trail: 1, orbit: 0.12 }}
        mobile={{ x: 0.82, y: 0.47, s: 0.56, rx: -0.15, ry: -0.6, rz: 0.2, spin: 1, trail: 0.9, orbit: 0.12 }}
      />

      {/* z-3 — portrait in FRONT of the disc */}
      <div className="h-photo pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex justify-center">
        <div className="h-photo-inner relative h-[64svh] w-[min(118vw,780px)] md:h-[80vh] md:w-[min(64vw,980px)]">
          <Image
            src="/img/kushagra-cutout.png"
            alt="Portrait of Kushagra Chaudhary"
            fill
            priority
            sizes="(max-width: 768px) 118vw, 64vw"
            className="object-contain object-bottom [filter:grayscale(1)_contrast(1.12)_brightness(0.92)] [mask-image:linear-gradient(to_bottom,#000_62%,transparent_98%)]"
          />
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[46svh] bg-gradient-to-t from-ink via-ink/70 to-transparent md:h-[30vh]" />

      {/* z-4 — UI */}
      <div className="h-ui-wrap absolute inset-0 z-[4] px-[var(--gutter)]">
        <span className="h-hud crosshair left-[var(--gutter)] top-24" />
        <span className="h-hud crosshair right-[var(--gutter)] top-24" />
        <span className="h-hud crosshair bottom-8 left-[var(--gutter)] hidden md:block" />
        <span className="h-hud crosshair bottom-8 right-[var(--gutter)] hidden md:block" />

        <div className="h-hud label absolute left-[var(--gutter)] top-[7.6rem] hidden md:block">
          Portfolio / 2026
          <br />
          <span className="text-bone/70">Index 001</span>
        </div>
        <div className="h-hud label absolute right-[var(--gutter)] top-[7.6rem] hidden text-right md:block">
          {profile.coords}
          <br />
          <span className="text-bone/70">
            <LocalTime seconds />
          </span>
        </div>

        <div className="absolute inset-x-[var(--gutter)] bottom-7 flex justify-center md:bottom-12 md:justify-end">
          <div className="h-ui flex items-center gap-3">
            <Magnetic>
              <button
                onClick={() => go("/#work")}
                data-cursor="Work"
                className="group flex items-center gap-3 rounded-full bg-bone py-2 pl-6 pr-2 text-[14px] font-semibold text-ink transition-colors hover:bg-molten hover:text-white"
              >
                See the work
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bone transition-transform duration-500 group-hover:rotate-[-45deg]">
                  →
                </span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                onClick={() => go("/#contact")}
                className="glass rounded-full px-6 py-[15px] text-[14px] font-medium text-bone transition hover:text-molten"
              >
                Start a project
              </button>
            </Magnetic>
          </div>
        </div>

        <div className="h-hud absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex" aria-hidden>
          <span className="label">Scroll</span>
          <span className="relative block h-10 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-molten" />
          </span>
        </div>
      </div>
    </section>
  );
}
