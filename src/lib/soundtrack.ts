/**
 * The site's soundtrack: Travis Scott – "RHYNO", streamed from the official
 * Atlantic Records upload through YouTube's embedded player (the site never
 * hosts the audio). YouTube's terms require the player to stay visible
 * (≥ 200 × 200) while it plays, so it lives in a small "Now playing" card.
 */
export const SOUNDTRACK = {
  videoId: "3Ev1PQEm7ns",
  title: "RHYNO",
  artist: "Travis Scott",
  credit: "Atlantic Records · YouTube",
};

const VOLUME = 45; // YouTube volume is 0–100
const MUTE_KEY = "kc-sound-muted";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  getVolume(): number;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: { onReady: () => void; onStateChange: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Listener = (state: { playing: boolean; wanted: boolean }) => void;

let player: YTPlayer | null = null;
let ready = false;
let playing = false;
let wanted = false; // a play was requested (card shows while loading too)
let fadeRaf = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l({ playing, wanted }));

function loadApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

function fadeTo(target: number, seconds: number, done?: () => void) {
  if (!player) return;
  cancelAnimationFrame(fadeRaf);
  const p = player;
  const from = p.getVolume?.() ?? 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / (seconds * 1000));
    p.setVolume(Math.round(from + (target - from) * t));
    if (t < 1) fadeRaf = requestAnimationFrame(step);
    else done?.();
  };
  fadeRaf = requestAnimationFrame(step);
}

function startPlayback() {
  if (!player) return;
  player.setVolume(0);
  player.playVideo();
  fadeTo(VOLUME, 1.6);
}

export const soundtrack = {
  /** create the (visible) YouTube player inside `el` — call once */
  async mount(el: HTMLElement) {
    if (player) return;
    const YT = await loadApi();
    player = new YT.Player(el, {
      videoId: SOUNDTRACK.videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: SOUNDTRACK.videoId, // required for loop to work
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          ready = true;
          if (wanted) startPlayback();
        },
        onStateChange: (e) => {
          playing = e.data === 1; // YT.PlayerState.PLAYING
          emit();
        },
      },
    });
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
  isPlaying: () => playing,
  /** fade in — call from (or after) a user gesture */
  play() {
    if (this.isMuted()) return;
    wanted = true;
    emit();
    if (ready) startPlayback();
  },
  /** fade out, pause, and let the card slide away */
  stop(seconds = 0.8) {
    if (!wanted && !playing) return;
    wanted = false;
    emit();
    if (!player || !ready) return;
    fadeTo(0, seconds, () => player?.pauseVideo());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l({ playing, wanted });
    return () => {
      listeners.delete(l);
    };
  },
};
