import DiscAnchor from "../disc/DiscAnchor";
import SpotCard from "../SpotCard";
import { FadeUp, RevealWords, ScrubWords } from "../Reveal";
import { profile } from "@/lib/data";

const facts = [
  { k: "Experience", v: profile.experience, d: "Building digital products, websites and software." },
  { k: "Education", v: "B.Tech CSE", d: profile.school },
  { k: "Based in", v: "Bengaluru", d: "India — working with clients worldwide, remote & async." },
];

export default function About() {
  return (
    <section id="about" className="relative px-[var(--gutter)] pb-[16vh] pt-[18vh]" aria-labelledby="about-h">
      <DiscAnchor
        style={{ top: "28%" }}
        pose={{ x: 0.86, y: 0.26, s: 0.24, rx: 0.9, ry: 0.5, rz: -0.3, spin: 2.2, trail: 0.45 }}
        mobile={{ x: 0.84, y: 0.14, s: 0.34, rx: 0.9, ry: 0.5, spin: 2.2, trail: 0.35 }}
      />
      <DiscAnchor
        style={{ top: "78%" }}
        pose={{ x: 0.86, y: 0.26, s: 0.24, rx: 0.9, ry: 0.5, rz: -0.3, spin: 2.2, trail: 0.45 }}
        mobile={{ x: 0.84, y: 0.14, s: 0.34, rx: 0.9, ry: 0.5, spin: 2.2, trail: 0.35 }}
      />

      <div className="relative z-[4] mx-auto max-w-[1500px]">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4 md:mb-16">
          <span className="label">(01) — About</span>
          <span className="label hidden sm:block">Who&apos;s behind the disc</span>
        </div>

        <h2 id="about-h" className="sr-only">
          About Kushagra
        </h2>
        <ScrubWords
          className="max-w-[1250px] text-[clamp(30px,5.2vw,82px)] font-medium leading-[1.02] tracking-[-0.03em] text-bone"
          accent={["designs", "details", "expensive"]}
          text="I'm Kushagra — a developer who designs. For 3+ years I've been turning rough ideas into fast, sharp, good-looking products. I sweat the details most people skip, because that's where a website starts to feel expensive."
        />

        <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3">
          {facts.map((f, i) => (
            <FadeUp key={f.k} delay={i * 0.08}>
              <SpotCard className="h-full p-6 md:p-8">
                <span className="label">{f.k}</span>
                <p className="font-display chrome mt-6 text-[64px] md:text-[84px]">{f.v}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-bone/60">{f.d}</p>
              </SpotCard>
            </FadeUp>
          ))}
        </div>

        <div className="mt-20 grid gap-8 md:mt-28 md:grid-cols-[1fr_2fr]">
          <div>
            <span className="label">Toolkit</span>
            <RevealWords
              as="h3"
              text="Only what I actually use."
              className="mt-4 font-serif text-[clamp(30px,3.4vw,48px)] italic leading-[1.05] text-bone"
            />
          </div>
          <ul className="flex flex-wrap content-start gap-2.5">
            {profile.stack.map((s) => (
              <li
                key={s}
                className="glass rounded-full px-5 py-2.5 text-[14px] text-bone/85 transition-colors duration-300 hover:text-molten"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
