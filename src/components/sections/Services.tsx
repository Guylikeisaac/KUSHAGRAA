import DiscAnchor from "../disc/DiscAnchor";
import SpotCard from "../SpotCard";
import { FadeUp, RevealWords } from "../Reveal";
import { services } from "@/lib/data";

export default function Services() {
  return (
    <section id="services" className="relative px-[var(--gutter)] py-[16vh]" aria-labelledby="services-h">
      <DiscAnchor
        style={{ top: "30%" }}
        pose={{ x: 0.88, y: 0.2, s: 0.2, rx: 1.15, ry: 0.25, rz: 0.4, spin: 2.6, trail: 0.25 }}
        mobile={{ x: 0.86, y: 0.12, s: 0.3, rx: 1.15, ry: 0.25, spin: 2.6, trail: 0.2 }}
      />
      <DiscAnchor
        style={{ top: "82%" }}
        pose={{ x: 0.88, y: 0.2, s: 0.2, rx: 1.15, ry: 0.25, rz: 0.4, spin: 2.6, trail: 0.25 }}
        mobile={{ x: 0.86, y: 0.12, s: 0.3, rx: 1.15, ry: 0.25, spin: 2.6, trail: 0.2 }}
      />
      <div className="relative z-[4] mx-auto max-w-[1500px]">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4 md:mb-14">
          <span className="label">(03) — What I do</span>
          <span className="label hidden sm:block">For brands, founders & teams</span>
        </div>

        <h2 id="services-h" className="font-display max-w-[1200px] text-[15vw] md:text-[8.6vw]">
          <RevealWords as="span" className="block" fill="chrome" text="Websites that sell." />
          <RevealWords as="span" className="block" fill="outline-text" text="Products that work." delay={0.1} />
        </h2>

        <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2">
          {services.map((s, i) => (
            <FadeUp key={s.no} delay={(i % 2) * 0.08}>
              <SpotCard className="h-full p-6 md:p-10">
                <div className="flex items-start justify-between">
                  <span className="font-display chrome-red text-[44px] md:text-[56px]">{s.no}</span>
                  <span className="label mt-2">Service</span>
                </div>
                <h3 className="mt-10 text-[clamp(26px,2.6vw,38px)] font-medium tracking-[-0.02em] text-bone md:mt-16">{s.title}</h3>
                <p className="mt-3 max-w-[460px] text-[15.5px] leading-relaxed text-bone/60">{s.body}</p>
              </SpotCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
