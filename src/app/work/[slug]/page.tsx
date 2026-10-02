import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import DiscAnchor from "@/components/disc/DiscAnchor";
import Magnetic from "@/components/Magnetic";
import { TLink } from "@/components/Transition";
import { FadeUp, RevealWords } from "@/components/Reveal";
import { projects } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.name} — Case study · Kushagra Chaudhary`,
    description: p.summary,
    openGraph: { images: [p.cover] },
  };
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const next = projects[(p.index + 1) % projects.length];
  const prev = projects[(p.index - 1 + projects.length) % projects.length];

  const meta = [
    { k: "Category", v: p.category },
    { k: "Role", v: p.role },
    { k: "Contribution", v: p.contribution },
    { k: "Tech", v: p.tech.join(" · ") },
  ];

  return (
    <article className="relative">
      {/* header */}
      <section className="relative min-h-[100svh] px-[var(--gutter)] pb-16 pt-32 md:pt-40">
        <DiscAnchor
          style={{ top: "50svh" }}
          pose={{ x: 0.74, y: 0.48, s: 0.7, rx: -0.12, ry: -0.42, rz: 0.06, spin: 0, tex: p.index, trail: 0.8 }}
          mobile={{ x: 0.5, y: 0.34, s: 0.8, rx: -0.1, ry: -0.3, spin: 0, tex: p.index, trail: 0.6 }}
        />
        <div className="relative z-[4] mx-auto flex min-h-[calc(100svh-12rem)] max-w-[1500px] flex-col justify-end">
          <TLink href="/#work" label="Work" className="label mb-auto inline-flex w-fit items-center gap-2 text-bone transition hover:text-molten">
            ← All work
          </TLink>

          <div className="mt-[44svh] md:mt-0 md:max-w-[52%]">
            <span className="label">
              Case study {String(p.index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
            <h1 className="font-display mt-4 text-[21vw] md:text-[10vw]">
              <RevealWords as="span" className="block" fill="chrome" text={p.name} />
            </h1>
            <p className="mt-3 font-serif text-[24px] italic text-bone/75 md:text-[30px]">{p.subtitle}</p>
            <p className="mt-6 max-w-[560px] text-[16px] leading-relaxed text-bone/70">{p.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a
                  href={p.live}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="Visit"
                  className="group flex items-center gap-3 rounded-full bg-bone py-2 pl-6 pr-2 text-[14px] font-semibold text-ink transition-colors hover:bg-molten hover:text-white"
                >
                  Visit live site
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bone transition-transform duration-500 group-hover:rotate-45">
                    ↗
                  </span>
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
      </section>

      {/* meta + story */}
      <section className="relative px-[var(--gutter)] py-[12vh]">
        <DiscAnchor
          style={{ top: "40%" }}
          pose={{ x: 0.2, y: 0.72, s: 0.3, rx: 0.35, ry: 0.4, spin: 0, tex: p.index, trail: 0.3 }}
          mobile={{ x: 0.84, y: 0.1, s: 0.3, rx: 0.35, ry: 0.4, spin: 0, tex: p.index, trail: 0.2 }}
        />
        <div className="relative z-[4] mx-auto max-w-[1500px]">
          <dl className="grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {meta.map((m) => (
              <div key={m.k} className="border-b border-white/10 py-6 sm:pr-6 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <dt className="label">{m.k}</dt>
                <dd className="mt-3 text-[16px] text-bone">{m.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-20 grid gap-12 md:mt-28 md:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="label">The story</span>
              <RevealWords
                as="h2"
                text="From real needs to a working product."
                className="mt-4 font-serif text-[clamp(32px,3.8vw,56px)] italic leading-[1.04] text-bone"
              />
            </div>
            <div>
              <FadeUp>
                <p className="text-[clamp(18px,1.6vw,22px)] leading-[1.55] text-bone/80">{p.story}</p>
              </FadeUp>
              <ul className="mt-10 space-y-0 border-t border-white/10">
                {p.outcomes.map((o, i) => (
                  <li key={o} className="flex items-baseline gap-6 border-b border-white/10 py-5">
                    <span className="font-display chrome-red text-[30px]">0{i + 1}</span>
                    <span className="text-[16px] text-bone/85">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* the disc */}
      <section className="relative px-[var(--gutter)] pb-[14vh]">
        <div className="relative z-[4] mx-auto max-w-[1500px]">
          <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-4">
            <span className="label">The disc</span>
            <a href={p.live} target="_blank" rel="noreferrer" className="label text-bone transition hover:text-molten">
              Visit live site ↗
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FadeUp>
              <div className="glass flex aspect-square items-center justify-center overflow-hidden rounded-[22px]">
                <Image src={p.cover} alt={`${p.name} disc cover`} width={1254} height={1254} sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="glass flex h-full flex-col justify-between rounded-[22px] p-8 md:p-12">
                <span className="label">The disc</span>
                <p className="font-display chrome mt-10 text-[14vw] md:text-[6vw]">{p.name}</p>
                <p className="mt-4 max-w-[420px] text-[15.5px] leading-relaxed text-bone/60">
                  Every project gets its own disc cover: the product&apos;s interface pressed onto chrome. It&apos;s the signature that ties
                  this portfolio together.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* next */}
      <section className="relative overflow-hidden border-t border-white/10 px-[var(--gutter)] py-[14vh]">
        <DiscAnchor
          style={{ top: "45%" }}
          pose={{ x: 0.78, y: 0.5, s: 0.5, rx: -0.2, ry: -0.5, spin: 0, tex: next.index, trail: 0.9 }}
          mobile={{ x: 0.5, y: 0.3, s: 0.66, ry: -0.4, spin: 0, tex: next.index, trail: 0.7 }}
        />
        <div className="relative z-[4] mx-auto max-w-[1500px]">
          <span className="label">Next project</span>
          <TLink href={`/work/${next.slug}`} label={next.name} data-cursor="Next" className="group mt-[36svh] block md:mt-6 md:max-w-[60%]">
            <span className="font-display chrome block text-[21vw] transition-transform duration-700 group-hover:translate-x-4 md:text-[11vw]">
              {next.name}
            </span>
            <span className="mt-3 flex items-center gap-3 font-serif text-[24px] italic text-bone/70">
              {next.subtitle} <span className="not-italic text-molten transition-transform duration-500 group-hover:translate-x-2">→</span>
            </span>
          </TLink>

          {/* the way out: back to all work, or step back to the previous disc */}
          <nav aria-label="Case study navigation" className="mt-[10vh] flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <TLink
              href="/#work"
              label="Work"
              data-cursor="Back"
              className="group flex w-fit items-center gap-3 rounded-full bg-bone py-2 pl-2 pr-6 text-[14px] font-semibold text-ink transition-colors hover:bg-molten hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bone transition-transform duration-500 group-hover:-translate-x-1">
                ←
              </span>
              Back to all work
            </TLink>
            <div className="flex flex-wrap items-center gap-2">
              <TLink
                href={`/work/${prev.slug}`}
                label={prev.name}
                className="glass rounded-full px-5 py-3 text-[13.5px] text-bone transition hover:text-molten"
              >
                ← Previous: {prev.name}
              </TLink>
              <TLink href="/" label="Home" className="rounded-full px-5 py-3 text-[13.5px] text-bone/70 ring-1 ring-white/15 transition hover:text-molten hover:ring-molten/50">
                Home
              </TLink>
            </div>
          </nav>
        </div>
      </section>
    </article>
  );
}
