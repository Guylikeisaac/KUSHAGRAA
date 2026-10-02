"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import DiscAnchor from "../disc/DiscAnchor";
import { process } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Process() {
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to(row.current, {
        x: () => -(row.current!.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: track.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      gsap.fromTo(
        ".pr-fill",
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: track.current, start: "top top", end: "bottom bottom", scrub: true } },
      );
    });
  });

  return (
    <section id="process" aria-labelledby="process-h" className="relative">
      <div ref={track} className="relative md:h-[300vh]">
        <DiscAnchor
          style={{ top: "20%" }}
          pose={{ x: 0.5, y: 1.38, s: 1.25, rx: -1.15, ry: 0, rz: 0, spin: 0.7, trail: 0 }}
          mobile={{ x: 0.86, y: 0.12, s: 0.26, rx: 1.1, ry: 0.3, spin: 2.5, trail: 0.2 }}
        />
        <DiscAnchor
          style={{ top: "80%" }}
          pose={{ x: 0.5, y: 1.38, s: 1.25, rx: -1.15, ry: 0, rz: 0, spin: 0.7, trail: 0 }}
          mobile={{ x: 0.86, y: 0.12, s: 0.26, rx: 1.1, ry: 0.3, spin: 2.5, trail: 0.2 }}
        />
        <div className="relative z-[4] flex flex-col overflow-hidden py-[12vh] md:sticky md:top-0 md:h-screen md:justify-center md:py-0">
          <div className="mb-10 px-[var(--gutter)] md:mb-14">
            <div className="mx-auto flex max-w-[1500px] items-end justify-between border-b border-white/10 pb-4">
              <div>
                <span className="label">(04) — Process</span>
                <h2 id="process-h" className="font-display chrome mt-4 text-[15vw] md:text-[6.5vw]">
                  How we&apos;ll work
                </h2>
              </div>
              <span className="label hidden md:block">Scroll →</span>
            </div>
          </div>

          <div
            ref={row}
            className="flex flex-col gap-4 px-[var(--gutter)] md:w-max md:flex-row md:gap-6 md:pr-[var(--gutter)] md:will-change-transform"
          >
            {process.map((p, i) => (
              <article
                key={p.no}
                className="glass relative flex min-h-[300px] flex-col justify-between rounded-[26px] p-6 md:h-[52vh] md:w-[38vw] md:min-w-[420px] md:p-10"
              >
                <div className="flex items-start justify-between">
                  <span className="font-display outline-text text-[90px] md:text-[150px]">{p.no}</span>
                  <span className="label">Step {i + 1}/4</span>
                </div>
                <div>
                  <h3 className="font-display chrome text-[56px] md:text-[80px]">{p.title}</h3>
                  <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-bone/65">{p.body}</p>
                </div>
              </article>
            ))}
            <div className="hidden w-[30vw] flex-col justify-center md:flex">
              <p className="font-serif text-[40px] italic leading-[1.05] text-bone/80">
                Remote, async-friendly,
                <br />
                <span className="text-molten">built to be owned by you.</span>
              </p>
            </div>
          </div>

          <div className="mx-[var(--gutter)] mt-10 hidden h-px bg-white/10 md:block">
            <div className="pr-fill h-px origin-left bg-molten" />
          </div>
        </div>
      </div>
    </section>
  );
}
