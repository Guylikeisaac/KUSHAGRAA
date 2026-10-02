"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { gsap } from "gsap";
import albumsData from "@/data/albums.json";
import DiscAnchor from "../disc/DiscAnchor";
import { RevealWords } from "../Reveal";
import { motion } from "@/lib/motion";
import { audioContext, playDiscEject, playDiscInsert, playTick } from "@/lib/sfx";
import { soundtrack } from "@/lib/soundtrack";

type Track = { n: number; name: string; artist: string; ms: number; preview: string | null };
type Album = { slug: string; title: string; artist: string; year: string; artwork: string; appleUrl: string; tracks: Track[] };
type Phase = "idle" | "inserting" | "reading" | "ready" | "ejecting";
type View = "list" | "now";

const ALBUMS = albumsData as Album[];
const caseSrc = (slug: string) => `/img/albums/${slug}-case.jpg`;
const discSrc = (slug: string) => `/img/albums/${slug}-disc.webp`;

// iPod photo geometry, as fractions of its box (measured from /img/albums/ipod.webp)
const SCREEN = { left: 7.62, right: 8.08, top: 4.42, bottom: 57.04 };
const WHEEL = { cx: 50, cy: 70.6, r: 30.9 }; // r as % of width
const DISC = 0.7; // disc diameter as a fraction of iPod width
const SLOT_Y = 0.25; // slot centre as a fraction of iPod height

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export default function Crate() {
  const stage = useRef<HTMLDivElement>(null);
  const ipod = useRef<HTMLDivElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const flyerImg = useRef<HTMLImageElement>(null);
  const slotGlow = useRef<HTMLDivElement>(null);
  const caseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);
  const remainRef = useRef<HTMLSpanElement>(null);
  const vizRef = useRef<HTMLCanvasElement>(null);

  const audio = useRef<HTMLAudioElement | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const busy = useRef(false);
  const queue = useRef<string | null>(null);
  const loadedRef = useRef<string | null>(null);
  const curRef = useRef(0);

  const [loaded, setLoaded] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [view, setView] = useState<View>("list");
  const [sel, setSel] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);

  const album = ALBUMS.find((a) => a.slug === loaded) ?? null;

  /* ——————————————————————————————— audio */

  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "anonymous"; // Apple serves previews with CORS, so the visualiser can read them
    a.preload = "auto";
    audio.current = a;
    const onPlay = () => {
      setPlaying(true);
      if (!a.muted) soundtrack.stop(0.5);
    };
    const onPause = () => setPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.pause();
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      audio.current = null;
    };
  }, []);

  const ensureAnalyser = () => {
    if (analyser.current || !audio.current) return;
    const ctx = audioContext();
    if (!ctx) return;
    try {
      const src = ctx.createMediaElementSource(audio.current);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.78;
      src.connect(an).connect(ctx.destination);
      analyser.current = an;
    } catch {
      // already wired, or the browser refused — playback still works without the visualiser
    }
  };

  const playTrack = useCallback((i: number) => {
    const a = audio.current;
    const al = ALBUMS.find((x) => x.slug === loadedRef.current);
    if (!a || !al) return;
    const n = al.tracks.length;
    let idx = ((i % n) + n) % n;
    // skip any track without a preview
    for (let k = 0; k < n && !al.tracks[idx].preview; k++) idx = (idx + 1) % n;
    const t = al.tracks[idx];
    if (!t.preview) return;
    ensureAnalyser();
    a.muted = false;
    a.src = t.preview;
    a.currentTime = 0;
    void a.play().catch(() => setPlaying(false));
    curRef.current = idx;
    setCur(idx);
    setSel(idx);
    setView("now");
  }, []);

  // auto-advance to the next preview
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onEnded = () => playTrack(curRef.current + 1);
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [playTrack]);

  // progress + visualiser
  useEffect(() => {
    if (phase !== "ready") return;
    let raf = 0;
    const data = new Uint8Array(32);
    const loop = () => {
      const a = audio.current;
      if (a) {
        const d = a.duration || 30;
        const p = Math.min(1, a.currentTime / d);
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (elapsedRef.current) elapsedRef.current.textContent = fmt(a.currentTime);
        if (remainRef.current) remainRef.current.textContent = `-${fmt(d - a.currentTime)}`;
      }
      const c = vizRef.current;
      if (c) {
        const g = c.getContext("2d")!;
        const w = (c.width = c.clientWidth * 2);
        const h = (c.height = c.clientHeight * 2);
        g.clearRect(0, 0, w, h);
        const bars = 24;
        if (analyser.current) analyser.current.getByteFrequencyData(data);
        for (let i = 0; i < bars; i++) {
          const v = analyser.current ? data[Math.min(31, i + 1)] / 255 : 0;
          const bh = Math.max(2, v * h);
          const bw = w / bars - 3;
          const grad = g.createLinearGradient(0, h, 0, h - bh);
          grad.addColorStop(0, "rgba(255,59,47,0.9)");
          grad.addColorStop(1, "rgba(255,180,170,0.9)");
          g.fillStyle = grad;
          g.fillRect(i * (w / bars), h - bh, bw, bh);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // keep the highlighted row in view
  useEffect(() => {
    const l = listRef.current;
    const row = l?.querySelector<HTMLElement>(`[data-row="${sel}"]`);
    if (!l || !row) return;
    const top = row.offsetTop;
    if (top < l.scrollTop) l.scrollTop = top;
    else if (top + row.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = top + row.offsetHeight - l.clientHeight;
  }, [sel, view]);

  /* ——————————————————————————————— geometry */

  const geo = () => {
    const s = stage.current!.getBoundingClientRect();
    const ip = ipod.current!.getBoundingClientRect();
    const D = ip.width * DISC;
    const y = ip.top - s.top + ip.height * SLOT_Y - D / 2;
    return {
      D,
      edge: ip.right - s.left, // the slot is on the iPod's right side
      inside: { x: ip.left - s.left + ip.width / 2 - D / 2, y },
      outside: { x: ip.right - s.left + 4, y },
    };
  };

  const caseDisc = (slug: string) => {
    const s = stage.current!.getBoundingClientRect();
    const r = caseRefs.current[slug]!.getBoundingClientRect();
    const size = r.width * 0.87; // case crops are framed so the disc fills 87%
    return { x: r.left - s.left + (r.width - size) / 2, y: r.top - s.top + (r.height - size) / 2, size };
  };

  // clip the part of the disc that has gone through the slot
  const clipAtSlot = (edge: number) => () => {
    const f = flyer.current!;
    const x = Number(gsap.getProperty(f, "x"));
    f.style.clipPath = `inset(0 0 0 ${Math.max(0, edge - x)}px)`;
  };

  /* ——————————————————————————————— insert / eject */

  const insert = (slug: string) => {
    if (busy.current) return;
    soundtrack.stop(0.6);
    if (loadedRef.current === slug) return;
    if (loadedRef.current) {
      queue.current = slug;
      eject();
      return;
    }
    const al = ALBUMS.find((a) => a.slug === slug)!;
    busy.current = true;
    loadedRef.current = slug;

    // unlock playback inside this click so the first preview can start on its own later
    audioContext();
    const a = audio.current;
    const first = al.tracks.find((t) => t.preview);
    if (a && first) {
      a.muted = true;
      a.src = first.preview!;
      void a
        .play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        })
        .catch(() => {});
    }

    setLoaded(slug);
    setPhase("inserting");
    setView("list");
    setSel(0);
    setCur(0);
    curRef.current = 0;

    const done = () => {
      setPhase("reading");
      setTimeout(() => {
        setPhase("ready");
        busy.current = false;
        playTrack(0);
      }, motion.reduced ? 100 : 1100);
    };

    if (motion.reduced) {
      done();
      return;
    }

    const f = flyer.current!;
    const img = flyerImg.current!;
    img.src = discSrc(slug);
    const from = caseDisc(slug);
    const g = geo();
    f.style.clipPath = "none";
    gsap.set(f, { display: "block", x: from.x, y: from.y, width: from.size, height: from.size, opacity: 1 });
    gsap.set(img, { rotate: 0, scale: 1 });

    playDiscInsert({ slideAt: 1.85, seatAt: 2.62, readyAt: 3.75 });
    const tl = gsap.timeline({ onComplete: done });
    tl.to(f, { y: from.y - from.size * 0.22, duration: 0.45, ease: "power2.out" })
      .to(img, { rotate: 160, scale: 1.06, duration: 0.45, ease: "power2.out" }, 0)
      // arc across to the iPod's side, growing to disc size
      .to(f, { x: g.outside.x + g.D * 0.3, width: g.D, height: g.D, duration: 1.0, ease: "power3.inOut" }, 0.45)
      .to(f, { y: g.outside.y, duration: 1.0, ease: "power2.inOut" }, 0.45)
      .to(img, { rotate: 900, scale: 1, duration: 1.0, ease: "power3.inOut" }, 0.45)
      // line up with the slot
      .to(f, { x: g.outside.x, duration: 0.4, ease: "power2.out" }, 1.45)
      .fromTo(slotGlow.current, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 1.6)
      // slide in through the side
      .to(f, { x: g.inside.x, duration: 0.75, ease: "power2.in", onUpdate: clipAtSlot(g.edge) }, 1.87)
      .to(img, { rotate: 1260, duration: 0.75, ease: "power2.in" }, 1.87)
      .to(slotGlow.current, { opacity: 0, duration: 0.5 }, 2.62)
      .set(f, { display: "none" });
  };

  const eject = () => {
    const slug = loadedRef.current;
    if (!slug || (busy.current && !queue.current)) return;
    busy.current = true;
    audio.current?.pause();
    setPhase("ejecting");

    const finish = () => {
      loadedRef.current = null;
      setLoaded(null);
      setPhase("idle");
      busy.current = false;
      const next = queue.current;
      queue.current = null;
      if (next) insert(next);
    };

    if (motion.reduced) {
      finish();
      return;
    }

    const f = flyer.current!;
    const img = flyerImg.current!;
    img.src = discSrc(slug);
    const g = geo();
    const to = caseDisc(slug);
    gsap.set(f, { display: "block", x: g.inside.x, y: g.inside.y, width: g.D, height: g.D, opacity: 1 });
    gsap.set(img, { rotate: 0, scale: 1 });
    clipAtSlot(g.edge)();

    playDiscEject(0.1);
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(slotGlow.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .to(f, { x: g.outside.x + g.D * 0.3, duration: 0.7, ease: "power2.out", onUpdate: clipAtSlot(g.edge) }, 0.12)
      .to(img, { rotate: -420, duration: 0.7, ease: "power2.out" }, 0.12)
      .to(slotGlow.current, { opacity: 0, duration: 0.4 }, 0.6)
      .set(f, { clipPath: "none" })
      .to(f, { x: to.x, width: to.size, height: to.size, duration: 0.9, ease: "power3.inOut" }, 0.85)
      .to(f, { y: to.y - to.size * 0.18, duration: 0.6, ease: "power2.inOut" }, 0.85)
      .to(img, { rotate: -1100, duration: 0.9, ease: "power3.inOut" }, 0.85)
      .to(f, { y: to.y, duration: 0.3, ease: "power2.in" }, 1.45)
      .to(f, { opacity: 0, duration: 0.15 }, 1.72)
      .set(f, { display: "none" });
  };

  /* ——————————————————————————————— click wheel */

  const ready = phase === "ready";

  const move = (d: number) => {
    if (!ready || !album) return;
    playTick();
    setView("list");
    setSel((s) => Math.max(0, Math.min(album.tracks.length - 1, s + d)));
  };

  const menu = () => {
    playTick();
    if (!ready) return;
    if (view === "now") setView("list");
    else eject();
  };

  const center = () => {
    playTick();
    if (!ready) return;
    if (view === "list") playTrack(sel);
    else setView("list");
  };

  const playPause = () => {
    playTick();
    const a = audio.current;
    if (!ready || !a) return;
    if (!a.src) return playTrack(sel);
    if (a.paused) void a.play();
    else a.pause();
  };

  const skip = (d: number) => {
    playTick();
    if (!ready) return;
    const a = audio.current;
    if (view === "list") return move(d);
    if (d < 0 && a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    playTrack(cur + d);
  };

  // drag around the wheel to scroll, like the real thing
  const wheelDrag = useRef<{ angle: number; acc: number } | null>(null);
  const angleAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const onWheelDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    wheelDrag.current = { angle: angleAt(e), acc: 0 };
  };
  const onWheelMove = (e: PointerEvent<HTMLDivElement>) => {
    const w = wheelDrag.current;
    if (!w) return;
    const a = angleAt(e);
    let d = a - w.angle;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    w.angle = a;
    w.acc += d;
    const step = Math.PI / 9; // 20° per row
    while (Math.abs(w.acc) >= step) {
      move(w.acc > 0 ? 1 : -1);
      w.acc -= Math.sign(w.acc) * step;
    }
  };
  const onWheelUp = () => (wheelDrag.current = null);

  // mouse wheel / trackpad over the click wheel: one row per ~60px of scroll
  const wheelAcc = useRef(0);
  const onScrollWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    wheelAcc.current += e.deltaY;
    while (Math.abs(wheelAcc.current) >= 60) {
      move(wheelAcc.current > 0 ? 1 : -1);
      wheelAcc.current -= Math.sign(wheelAcc.current) * 60;
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    if (k === "ArrowDown") move(1);
    else if (k === "ArrowUp") move(-1);
    else if (k === "ArrowRight") skip(1);
    else if (k === "ArrowLeft") skip(-1);
    else if (k === "Enter") center();
    else if (k === " ") playPause();
    else if (k === "Escape" || k === "Backspace") menu();
    else return;
    e.preventDefault();
  };

  /* ——————————————————————————————— render */

  const track = album?.tracks[cur];

  return (
    <section id="crate" aria-labelledby="crate-h" className="relative overflow-x-clip px-[var(--gutter)] py-[16vh]">
      {/* the chrome disc steps aside — this section has its own */}
      <DiscAnchor style={{ top: "25%" }} pose={{ x: -0.35, y: 0.3, s: 0.2, spin: 2, trail: 0 }} mobile={{ x: -0.4, y: 0.3, s: 0.25, spin: 2, trail: 0 }} />
      <DiscAnchor style={{ top: "80%" }} pose={{ x: -0.35, y: 0.3, s: 0.2, spin: 2, trail: 0 }} mobile={{ x: -0.4, y: 0.3, s: 0.25, spin: 2, trail: 0 }} />

      <div className="relative z-[4] mx-auto max-w-[1500px]">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4 md:mb-14">
          <span className="label">(05) — On rotation</span>
          <span className="label hidden sm:block">30-sec previews · Apple Music</span>
        </div>
        <h2 id="crate-h" className="font-display max-w-[1200px] text-[15vw] md:text-[8.6vw]">
          <RevealWords as="span" className="block" fill="chrome" text="What's spinning." />
          <RevealWords as="span" className="block" fill="outline-text" text="Pick a disc." delay={0.1} />
        </h2>
        <p className="mt-6 max-w-[460px] text-[15.5px] leading-relaxed text-bone/60">
          The records on repeat while I build. Pull one from the crate and slide it into the iPod — the click wheel works.
        </p>

        <div ref={stage} className="relative mt-14 grid grid-cols-[minmax(0,1fr)] gap-12 md:mt-20 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-[clamp(56px,7vw,120px)]">
          {/* —— the iPod */}
          <div className="relative z-[2] flex justify-center md:block">
            <div
              ref={ipod}
              tabIndex={0}
              onKeyDown={onKey}
              aria-label="iPod. Use the arrow keys to browse, Enter to select, Space to play or pause, Escape for menu."
              className="relative aspect-[760/1279] w-[clamp(220px,58vw,300px)] outline-none drop-shadow-[0_40px_60px_rgba(0,0,0,0.7)] focus-visible:ring-2 focus-visible:ring-molten/60 md:w-[clamp(260px,24vw,350px)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/albums/ipod.webp" alt="" className="absolute inset-0 h-full w-full select-none" draggable={false} />

              {/* side slot */}
              <div className="absolute right-[-1px] top-[5%] h-[40%] w-[4px] rounded-full bg-black/80 shadow-[inset_1px_0_2px_rgba(0,0,0,0.9),-1px_0_0_rgba(255,255,255,0.35)]" />
              <div ref={slotGlow} className="pointer-events-none absolute right-[-4px] top-[6%] h-[38%] w-[8px] rounded-full bg-molten opacity-0 blur-[6px]" />

              {/* screen */}
              <div
                className="absolute overflow-hidden rounded-[3%] bg-[linear-gradient(180deg,#141418,#08080a)] text-bone"
                style={{ left: `${SCREEN.left}%`, right: `${SCREEN.right}%`, top: `${SCREEN.top}%`, bottom: `${SCREEN.bottom}%` }}
              >
                <Screen
                  phase={phase}
                  view={view}
                  album={album}
                  sel={sel}
                  cur={cur}
                  playing={playing}
                  track={track}
                  listRef={listRef}
                  barRef={barRef}
                  elapsedRef={elapsedRef}
                  remainRef={remainRef}
                  vizRef={vizRef}
                  onRow={(i) => (i === sel ? playTrack(i) : setSel(i))}
                />
                {/* LCD texture */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,#fff_0_1px,transparent_1px_3px)]" />
              </div>

              {/* click wheel */}
              <div
                className="absolute touch-none rounded-full"
                style={{
                  left: `${WHEEL.cx - WHEEL.r}%`,
                  width: `${WHEEL.r * 2}%`,
                  top: `${WHEEL.cy - WHEEL.r * (760 / 1279)}%`, // r is % of width; the photo is 760×1279
                  aspectRatio: "1",
                }}
                onPointerDown={onWheelDown}
                onPointerMove={onWheelMove}
                onPointerUp={onWheelUp}
                onPointerCancel={onWheelUp}
                onWheel={onScrollWheel}
                data-lenis-prevent
              >
                <WheelButton label="Menu" className="left-1/2 top-[3%] -translate-x-1/2" onClick={menu} />
                <WheelButton label="Previous" className="left-[3%] top-1/2 -translate-y-1/2" onClick={() => skip(-1)} />
                <WheelButton label="Next" className="right-[3%] top-1/2 -translate-y-1/2" onClick={() => skip(1)} />
                <WheelButton label="Play or pause" className="bottom-[3%] left-1/2 -translate-x-1/2" onClick={playPause} />
                <button
                  aria-label="Select"
                  onClick={center}
                  className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full transition active:scale-95 active:bg-black/10"
                />
              </div>
            </div>
          </div>

          {/* —— the crate */}
          <div className="relative z-[3] min-w-0">
            <div className="no-scrollbar -mx-[var(--gutter)] flex snap-x gap-4 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
              {ALBUMS.map((a) => {
                const inside = loaded === a.slug && phase !== "idle";
                return (
                  <button
                    key={a.slug}
                    onClick={() => insert(a.slug)}
                    data-cursor={inside ? "" : "Play"}
                    aria-label={`Play ${a.title} by ${a.artist}`}
                    className="group w-[40vw] shrink-0 snap-start text-left [perspective:900px] sm:w-[28vw] md:w-auto"
                  >
                    <div
                      ref={(el) => {
                        caseRefs.current[a.slug] = el;
                      }}
                      className="relative aspect-square overflow-hidden rounded-[6px] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:[transform:rotateX(9deg)_rotateY(-11deg)_translateY(-8px)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={caseSrc(a.slug)}
                        alt={`${a.title} disc in a clear case`}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-opacity duration-500 ${inside ? "opacity-25" : "opacity-100"}`}
                      />
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      {inside && (
                        <span className="label absolute inset-0 flex items-center justify-center text-bone">
                          <span className="pulse-dot mr-2" /> In the iPod
                        </span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-[13.5px] font-medium text-bone transition group-hover:text-molten">{a.title}</p>
                    <p className="label mt-1 truncate">
                      {a.artist} · {a.year}
                    </p>
                  </button>
                );
              })}
              <div className="hidden flex-col justify-between rounded-[6px] border border-white/10 p-5 md:flex">
                <span className="label">Now loaded</span>
                <div>
                  <p className="text-[15px] font-medium text-bone">{album ? album.title : "Nothing yet"}</p>
                  <p className="label mt-1">{album ? album.artist : "Pick a disc"}</p>
                </div>
                {album ? (
                  <a href={album.appleUrl} target="_blank" rel="noreferrer" className="label text-bone transition hover:text-molten">
                    Full album on Apple Music ↗
                  </a>
                ) : (
                  <span className="label">Previews via Apple Music</span>
                )}
              </div>
            </div>
          </div>

          {/* the disc in flight — clipped where it passes through the slot */}
          <div ref={flyer} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[30] hidden will-change-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={flyerImg} alt="" className="h-full w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function WheelButton({ label, className, onClick }: { label: string; className: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`absolute h-[24%] w-[24%] rounded-full transition active:scale-90 active:bg-black/10 ${className}`}
    />
  );
}

function Screen({
  phase,
  view,
  album,
  sel,
  cur,
  playing,
  track,
  listRef,
  barRef,
  elapsedRef,
  remainRef,
  vizRef,
  onRow,
}: {
  phase: Phase;
  view: View;
  album: Album | null;
  sel: number;
  cur: number;
  playing: boolean;
  track: Track | undefined;
  listRef: React.RefObject<HTMLDivElement | null>;
  barRef: React.RefObject<HTMLDivElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  remainRef: React.RefObject<HTMLSpanElement | null>;
  vizRef: React.RefObject<HTMLCanvasElement | null>;
  onRow: (i: number) => void;
}) {
  return (
    <div className="flex h-full flex-col text-[clamp(8px,0.75vw,11px)]">
      {/* status bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-[5%] py-[2.5%] font-mono uppercase tracking-[0.12em] text-bone/70">
        <span className="truncate">{phase === "ready" && album ? (view === "now" ? "Now playing" : album.title) : "iPod"}</span>
        <span className="flex items-center gap-1.5">
          {phase === "ready" && <span className="text-molten">{playing ? "▶" : "❚❚"}</span>}
          <span className="relative inline-block h-[0.8em] w-[1.6em] rounded-[2px] border border-bone/60">
            <span className="absolute inset-[1px] right-[30%] bg-bone/70" />
          </span>
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        {phase === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-[6%] text-center">
            <span className="relative block h-[34%] aspect-square animate-[spin_6s_linear_infinite] rounded-full border border-dashed border-bone/30">
              <span className="absolute inset-[38%] rounded-full border border-bone/30" />
            </span>
            <span className="font-mono uppercase tracking-[0.2em] text-bone">Insert a disc</span>
            <span className="text-bone/45">
              <span className="hidden md:inline">Pick one from the crate →</span>
              <span className="md:hidden">Pick one from the crate ↓</span>
            </span>
          </div>
        )}

        {(phase === "inserting" || phase === "reading") && album && (
          <div className="flex h-full flex-col items-center justify-center gap-[7%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/albums/${album.slug}-disc.webp`} alt="" className="h-[38%] animate-[spin_1.2s_linear_infinite]" />
            <span className="font-mono uppercase tracking-[0.2em] text-molten [text-shadow:0_0_8px_rgba(255,59,47,0.7)]">
              {phase === "inserting" ? "Loading…" : "Reading disc…"}
            </span>
            <span className="h-[2px] w-[60%] overflow-hidden bg-white/10">
              <span className={`block h-full bg-molten transition-[width] duration-[1000ms] ease-out ${phase === "reading" ? "w-full" : "w-[15%]"}`} />
            </span>
          </div>
        )}

        {phase === "ejecting" && (
          <div className="flex h-full items-center justify-center font-mono uppercase tracking-[0.2em] text-bone/70">Ejecting…</div>
        )}

        {phase === "ready" && album && view === "list" && (
          <div ref={listRef} className="no-scrollbar h-full overflow-y-auto" data-lenis-prevent>
            <div className="flex items-center gap-[5%] border-b border-white/10 px-[5%] py-[3%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={album.artwork} alt="" className="aspect-square w-[18%] rounded-[2px]" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-bone">{album.title}</p>
                <p className="truncate text-bone/55">
                  {album.artist} · {album.tracks.length} songs
                </p>
              </div>
            </div>
            {album.tracks.map((t, i) => (
              <button
                key={i}
                data-row={i}
                onClick={() => onRow(i)}
                className={`flex w-full items-center gap-[4%] px-[5%] py-[2.2%] text-left ${
                  i === sel ? "bg-gradient-to-b from-[#ff5a4f] to-[#d4221a] text-white" : "text-bone/80"
                }`}
              >
                <span className={`w-[8%] shrink-0 font-mono ${i === sel ? "text-white/80" : "text-bone/40"}`}>{t.n}</span>
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {i === cur && playing && <span className="shrink-0">▶</span>}
              </button>
            ))}
          </div>
        )}

        {phase === "ready" && album && view === "now" && track && (
          <div className="relative flex h-full flex-col px-[6%] pb-[5%] pt-[5%]">
            <canvas ref={vizRef} className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] w-full opacity-40" />
            <div className="relative flex min-h-0 flex-1 gap-[6%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={album.artwork}
                alt={`${album.title} cover`}
                className="aspect-square h-full max-h-full rounded-[3px] object-cover shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-[4%]">
                <p className="line-clamp-2 font-semibold leading-tight text-bone">{track.name}</p>
                <p className="truncate text-bone/60">{track.artist}</p>
                <p className="truncate text-bone/40">{album.title}</p>
              </div>
            </div>
            <div className="relative mt-[4%]">
              <p className="mb-[2%] text-center text-bone/50">
                {cur + 1} of {album.tracks.length}
              </p>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-molten" />
              </div>
              <div className="mt-[2%] flex justify-between font-mono text-bone/55">
                <span ref={elapsedRef}>0:00</span>
                <span ref={remainRef}>-0:30</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
