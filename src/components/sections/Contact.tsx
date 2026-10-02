"use client";

import { useState } from "react";
import DiscAnchor from "../disc/DiscAnchor";
import Magnetic from "../Magnetic";
import LocalTime from "../LocalTime";
import { RevealWords } from "../Reveal";
import { profile } from "@/lib/data";
import { scrollToTarget } from "@/lib/motion";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  const channels = [
    { label: "Email", value: profile.email, href: `mailto:${profile.email}?subject=New%20project` },
    { label: "WhatsApp", value: profile.whatsapp, href: profile.whatsappLink },
    ...profile.socials.map((s) => ({ label: s.label, value: s.href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, ""), href: s.href })),
  ];

  return (
    <section id="contact" aria-labelledby="contact-h" className="relative overflow-hidden px-[var(--gutter)] pt-[18vh]">
      <DiscAnchor
        style={{ top: "26%" }}
        pose={{ x: 0.5, y: 0.5, s: 0.56, rx: -0.25, ry: 0.35, rz: 0, spin: 1.5, trail: 1 }}
        mobile={{ x: 0.5, y: 0.42, s: 0.8, rx: -0.25, ry: 0.35, spin: 1.5, trail: 0.9 }}
      />
      {/* before the links: the disc lifts away so small text stays readable */}
      <DiscAnchor
        style={{ top: "52%" }}
        pose={{ x: 0.86, y: 0.16, s: 0.2, rx: 1.0, ry: 0.4, spin: 2.6, trail: 0.35 }}
        mobile={{ x: 0.84, y: 0.12, s: 0.28, rx: 1.0, ry: 0.4, spin: 2.6, trail: 0.25 }}
      />

      <div className="relative z-[4] mx-auto max-w-[1500px]">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="label">(06) — Contact</span>
          <span className="label flex items-center gap-2">
            <span className="pulse-dot" /> Taking new projects
          </span>
        </div>

        <h2 id="contact-h" className="font-display text-center text-[19vw] md:text-[13.5vw]">
          <RevealWords as="span" className="block" fill="chrome" text="Let's make" />
          <RevealWords as="span" className="block" fill="chrome-red" text="something loud." delay={0.12} />
        </h2>

        <div className="mt-10 flex flex-col items-center gap-5 md:mt-14">
          <p className="max-w-[520px] text-center text-[16px] leading-relaxed text-bone/65">
            Got a website, product or portfolio in mind? Tell me what you are building and where you want it to go.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <a
                href={`mailto:${profile.email}?subject=New%20project`}
                data-cursor="Write"
                className="group flex items-center gap-3 rounded-full bg-bone py-2 pl-6 pr-2 text-[15px] font-semibold text-ink transition-colors hover:bg-molten hover:text-white"
              >
                Start a project
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bone transition-transform duration-500 group-hover:rotate-[-45deg]">
                  →
                </span>
              </a>
            </Magnetic>
            <Magnetic>
              <button onClick={copy} className="glass rounded-full px-6 py-[17px] font-mono text-[12.5px] text-bone transition hover:text-molten">
                <span aria-live="polite">{copied ? "Copied to clipboard ✓" : "Copy email"}</span>
              </button>
            </Magnetic>
          </div>
        </div>

        <ul className="mt-20 grid border-t border-white/10 md:mt-28 md:grid-cols-5">
          {channels.map((c) => (
            <li key={c.label} className="border-b border-white/10 md:border-b-0 md:border-r md:last:border-r-0">
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 px-1 py-5 transition-colors hover:bg-white/[0.03] md:flex-col md:items-start md:px-5 md:py-7"
              >
                <span className="label group-hover:text-molten">{c.label}</span>
                <span className="truncate text-[14px] text-bone/85 md:max-w-full">{c.value}</span>
              </a>
            </li>
          ))}
        </ul>

        <footer className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <span className="label">© 2026 {profile.name}</span>
          <span className="label">
            Bengaluru — <LocalTime />
          </span>
          <span className="label">Designed &amp; built by Kushagra</span>
          <button onClick={() => scrollToTarget(0)} className="label text-left text-bone transition hover:text-molten md:text-right">
            Back to top ↑
          </button>
        </footer>
      </div>

      <div aria-hidden className="font-display outline-text pointer-events-none relative z-[4] -mb-[3vw] select-none text-center text-[25vw] leading-[0.8]">
        KUSHAGRA
      </div>
    </section>
  );
}
