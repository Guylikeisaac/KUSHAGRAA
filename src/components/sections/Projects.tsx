"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import UnicornBg from "../UnicornBg";
import DiscAnchor from "../disc/DiscAnchor";
import Magnetic from "../Magnetic";
import { TLink } from "../Transition";
import { RevealWords } from "../Reveal";
import { projects } from "@/lib/data";
import { scrollToTarget } from "@/lib/motion";
import { SCENES, UNICORN_ENABLED } from "@/lib/scenes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const n = projects.length;

export default function Projects() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  // cards wait until the player is pinned, so the disc never flies across them
  const [entered, setEntered] = useState(false);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setProgress(self.progress);
        setEntered(self.progress > 0.02);
        setActive(Math.min(n - 1, Math.max(0, Math.round(self.progress * n))));
      },
    });
  });

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollToTarget(top + i * window.innerHeight + 2);
  };

  return (
    <section id="work" aria-labelledby="work-h" className="relative">
      {/* intro */}
      <div className="relative px-[var(--gutter)] pb-[8vh] pt-[14vh]">
        <DiscAnchor
          style={{ top: "45%" }}
          pose={{ x: 0.8, y: 0.6, s: 0.34, rx: 0.45, ry: -0.6, rz: 0.1, spin: 0, tex: 0, trail: 0.6 }}
          mobile={{ x: 0.76, y: 0.86, s: 0.42, rx: 0.45, ry: -0.6, spin: 0, tex: 0, trail: 0.5 }}
        />
        <div className="relative z-[4] mx-auto max-w-[1500px]">
          <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4">
            <span className="label">(02) — Selected work</span>
            <span className="label">2024 — 2026</span>
          </div>
          <h2 id="work-h" className="font-display text-[19vw] md:text-[11.5vw]">
            <RevealWords as="span" className="block" fill="chrome" text="Three discs." />
            <RevealWords as="span" className="block" fill="chrome-red" text="Three products." delay={0.1} />
          </h2>
          <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-bone/60">
            Every project ships as a disc. Keep scrolling and watch each one load. Open any of them for the full case study.
          </p>
        </div>
      </div>

      {/* pinned disc player */}
      <div ref={track} className="relative" style={{ height: `${(n + 1) * 100}svh` }}>
        {projects.map((p, i) => (
          <DiscAnchor
            key={p.slug}
            style={{ top: `calc(50svh + ${i * 100}svh)` }}
            pose={{ x: 0.27, y: 0.5, s: 0.64, rx: 0, ry: i * Math.PI * 2, rz: 0, spin: 0, tex: i, trail: 0.25 }}
            mobile={{ x: 0.5, y: 0.29, s: 0.66, rx: 0, ry: i * Math.PI * 2, spin: 0, tex: i, trail: 0.3 }}
          />
        ))}
        <DiscAnchor
          style={{ top: `calc(50svh + ${n * 100}svh)` }}
          pose={{ x: 0.27, y: 0.5, s: 0.64, ry: (n - 1) * Math.PI * 2, spin: 0, tex: n - 1, trail: 0.25 }}
          mobile={{ x: 0.5, y: 0.29, s: 0.66, ry: (n - 1) * Math.PI * 2, spin: 0, tex: n - 1, trail: 0.3 }}
        />

        {/* z-0 — template 01 scene behind the player */}
        <div className="sticky top-0 z-0 h-[100svh] overflow-hidden" aria-hidden>
          {UNICORN_ENABLED ? (
            <>
              <div className="absolute inset-0 [filter:grayscale(0.85)_brightness(0.42)_contrast(1.2)]">
                <UnicornBg projectId={SCENES.projects} />
              </div>
              <div className="absolute inset-0 bg-molten opacity-[0.12] mix-blend-color" />
            </>
          ) : (
            <>
              {/* record grooves radiating from behind the disc */}
              <div className="absolute left-[27%] top-1/2 h-[180vmax] w-[180vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.035)_0_1px,transparent_1px_14px)] max-md:left-1/2 max-md:top-[29%]" />
              <div className="absolute left-[27%] top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,59,47,0.18),transparent_60%)] blur-2xl max-md:left-1/2 max-md:top-[29%]" />
            </>
          )}
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_50%,transparent,rgba(5,5,5,0.85))]" />
        </div>

        {/* z-4 — info, layered above the disc */}
        <div className="sticky top-0 z-[4] -mt-[100svh] h-[100svh] px-[var(--gutter)]">
          <div className="relative mx-auto grid h-full max-w-[1500px] grid-rows-[1fr_auto] md:grid-cols-2 md:grid-rows-1">
            {/* left: disc lives here (3D). Static fallback when WebGL is unavailable */}
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={projects[active].cover}
                alt=""
                className="gl-fallback aspect-square w-[70vw] max-w-[520px] rounded-full object-cover md:w-[34vw]"
              />
              <span className="font-display outline-text pointer-events-none absolute bottom-[8%] left-0 hidden text-[11vw] leading-none md:block" aria-hidden>
                0{active + 1}
              </span>
            </div>

            {/* right: project card */}
            <div className="relative flex items-end pb-6 md:items-center md:pb-0">
              <div className="relative grid w-full items-end md:items-center">
                {projects.map((p, i) => (
                  <article
                    key={p.slug}
                    aria-hidden={i !== active}
                    className={`glass rounded-[26px] p-5 transition-[opacity,transform,filter,visibility] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] md:p-9 col-start-1 row-start-1 ${entered && i === active ? "visible translate-y-0 opacity-100 blur-0" : "invisible translate-y-8 opacity-0 blur-md"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="label">
                        {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} — {p.category}
                      </span>
                      <span className="hidden h-2 w-2 rounded-full md:block" style={{ background: p.accent }} />
                    </div>
                    <h3 className="font-display chrome mt-4 text-[15vw] md:mt-6 md:text-[6.4vw]">{p.name}</h3>
                    <p className="mt-1 font-serif text-[20px] italic text-bone/75 md:text-[24px]">{p.subtitle}</p>
                    <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-bone/65 md:mt-5 md:line-clamp-none md:text-[15.5px]">
                      {p.summary}
                    </p>
                    <ul className="mt-5 hidden space-y-2 md:block">
                      {p.outcomes.map((o) => (
                        <li key={o} className="flex gap-3 text-[14px] text-bone/80">
                          <span className="mt-[7px] h-1 w-3 shrink-0 bg-molten" />
                          {o}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-1.5 md:mt-6">
                      {p.tech.map((t) => (
                        <span key={t} className="rounded-full border border-white/12 px-3 py-1 font-mono text-[11px] text-bone/70">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-2.5 md:mt-8">
                      <Magnetic strength={0.25}>
                        <TLink
                          href={`/work/${p.slug}`}
                          label={p.name}
                          data-cursor="Open"
                          className="group flex items-center gap-3 rounded-full bg-bone py-1.5 pl-5 pr-1.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-molten hover:text-white"
                        >
                          Case study
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bone transition-transform duration-500 group-hover:rotate-[-45deg]">
                            →
                          </span>
                        </TLink>
                      </Magnetic>
                      <a
                        href={p.live}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full px-4 py-2.5 text-[13.5px] text-bone/80 ring-1 ring-white/15 transition hover:text-molten hover:ring-molten/50"
                      >
                        Live site ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* progress rail */}
          <div className="absolute inset-x-[var(--gutter)] top-24 flex items-center gap-4 md:bottom-10 md:top-auto">
            <span className="label w-10 text-bone">{String(active + 1).padStart(2, "0")}</span>
            <div className="relative h-px flex-1 bg-white/12">
              <div className="absolute inset-y-0 left-0 bg-molten" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="hidden gap-5 md:flex">
              {projects.map((p, i) => (
                <button
                  key={p.slug}
                  onClick={() => jump(i)}
                  className={`label transition-colors ${i === active ? "text-bone" : "hover:text-bone"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
