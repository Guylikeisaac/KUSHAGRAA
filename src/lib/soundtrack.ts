/**
 * The site's soundtrack — a royalty-free track hosted with the site, played by
 * an invisible <audio> element (only the nav's sound bars show it's on).
 * Set SOUNDTRACK_SRC to the file in /public/audio once it's added; while it's
 * null there's no music and the intro shows a single "Enter" button.
 */
export const SOUNDTRACK_SRC: string | null = null;

const VOLUME = 0.45;
const MUTE_KEY = "kc-sound-muted";

type Listener = (state: { playing: boolean; wanted: boolean }) => void;

let el: HTMLAudioElement | null = null;
let fadeRaf = 0;
let wanted = false;
const listeners = new Set<Listener>();
const playing = () => !!el && !el.paused;
const emit = () => listeners.forEach((l) => l({ playing: playing(), wanted }));

function audio() {
  if (!el && typeof window !== "undefined" && SOUNDTRACK_SRC) {
    el = new Audio(SOUNDTRACK_SRC);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    el.addEventListener("play", emit);
    el.addEventListener("pause", emit);
  }
  return el;
}

function fadeTo(target: number, seconds: number, done?: () => void) {
  const a = audio();
  if (!a) return;
  cancelAnimationFrame(fadeRaf);
  const from = a.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / (seconds * 1000));
    a.volume = from + (target - from) * t;
    if (t < 1) fadeRaf = requestAnimationFrame(step);
    else done?.();
  };
  fadeRaf = requestAnimationFrame(step);
}

export const soundtrack = {
  /** start buffering the file early (no sound) */
  preload() {
    audio();
  },
  isMuted() {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  },
  setMuted(m: boolean) {
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {}
  },
  isPlaying: playing,
  /** fade in — call from (or after) a user gesture */
  play() {
    const a = audio();
    if (!a || this.isMuted()) return;
    wanted = true;
    emit();
    void a
      .play()
      .then(() => fadeTo(VOLUME, 1.6))
      .catch(() => {
        wanted = false;
        emit();
      });
  },
  /** fade out and pause */
  stop(seconds = 0.8) {
    const a = audio();
    wanted = false;
    emit();
    if (!a || a.paused) return;
    fadeTo(0, seconds, () => a.pause());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l({ playing: playing(), wanted });
    return () => {
      listeners.delete(l);
    };
  },
};
