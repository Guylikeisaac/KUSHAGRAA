/**
 * Synthesised disc-player sounds (Web Audio, no audio files). Call from a click
 * handler so the browser allows playback. Times are seconds from "now" and line
 * up with the disc-player timeline in components/Transition.tsx.
 */

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(ac: AudioContext, at: number, attack: number, hold: number, release: number, peak: number) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  return g;
}

/** roller grab → thunk + latch → spindle spin-up → ready chime */
export function playDiscInsert({ slideAt = 1.55, seatAt = 2.4, readyAt = 2.75 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.38;
  const tone = ac.createBiquadFilter(); // keep everything warm — nothing above ~3 kHz but the latch
  tone.type = "lowpass";
  tone.frequency.value = 3200;
  tone.connect(master).connect(ac.destination);

  // 1. the loading rollers grab the disc: a small gear motor with a ratchet flutter
  {
    const at = t0 + slideAt;
    const dur = 0.78;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.linearRampToValueAtTime(118, at + dur);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    lp.Q.value = 2;
    // ratchet flutter: an LFO wobbling the gain ~26 times a second
    const flutter = ac.createGain();
    flutter.gain.value = 0.55;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 26;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.45;
    lfo.connect(lfoDepth).connect(flutter.gain);
    const g = env(ac, at, 0.06, dur - 0.2, 0.14, 0.32);
    osc.connect(lp).connect(flutter).connect(g).connect(tone);
    osc.start(at);
    lfo.start(at);
    osc.stop(at + dur + 0.05);
    lfo.stop(at + dur + 0.05);

    // body: a low rumble under the motor (heavily filtered, so no hiss)
    const rumble = noise(ac, dur);
    const rl = ac.createBiquadFilter();
    rl.type = "lowpass";
    rl.frequency.value = 220;
    const rg = env(ac, at, 0.08, dur - 0.25, 0.15, 0.18);
    rumble.connect(rl).connect(rg).connect(tone);
    rumble.start(at);
    rumble.stop(at + dur);
  }

  // 2. the disc seats: a deep thunk, then the clamp latches — tk-tk
  {
    const at = t0 + seatAt;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, at);
    osc.frequency.exponentialRampToValueAtTime(36, at + 0.16);
    const g = env(ac, at, 0.003, 0.015, 0.22, 1);
    osc.connect(g).connect(tone);
    osc.start(at);
    osc.stop(at + 0.3);

    [0.05, 0.11].forEach((dt, i) => {
      const c = ac.createOscillator();
      c.type = "square";
      c.frequency.value = i ? 1700 : 2300;
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = i ? 1700 : 2300;
      bp.Q.value = 6;
      const cg = env(ac, at + dt, 0.001, 0.004, 0.03, i ? 0.12 : 0.18);
      c.connect(bp).connect(cg).connect(master); // bypass the warm filter so the latch stays crisp
      c.start(at + dt);
      c.stop(at + dt + 0.05);
    });
  }

  // 3. the spindle spins up: two soft detuned tones gliding upward
  {
    const at = t0 + seatAt + 0.12;
    [0, 7].forEach((detune) => {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.detune.value = detune;
      osc.frequency.setValueAtTime(70, at);
      osc.frequency.exponentialRampToValueAtTime(330, at + 0.9);
      const g = env(ac, at, 0.25, 0.35, 0.45, 0.06);
      osc.connect(g).connect(tone);
      osc.start(at);
      osc.stop(at + 1.1);
    });
  }

  // 4. ready: a soft, round two-note chime
  [659.25, 987.77].forEach((f, i) => {
    const at = t0 + readyAt + 0.05 + i * 0.1;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f;
    const g = env(ac, at, 0.008, 0.04, 0.35, 0.09);
    osc.connect(g).connect(tone);
    osc.start(at);
    osc.stop(at + 0.45);
  });
}

/** iPod click-wheel tick */
export function playTick() {
  const ac = audio();
  if (!ac) return;
  const at = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.value = 2900;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2900;
  bp.Q.value = 8;
  const g = env(ac, at, 0.0008, 0.002, 0.012, 0.05);
  osc.connect(bp).connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + 0.03);
}

/** eject: latch release, then the rollers push the disc back out */
export function playDiscEject(delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const out = ac.createGain();
  out.gain.value = 0.34;
  out.connect(ac.destination);

  // latch release — tk
  const c = ac.createOscillator();
  c.type = "square";
  c.frequency.value = 2100;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2100;
  bp.Q.value = 6;
  const cg = env(ac, t0, 0.001, 0.004, 0.03, 0.16);
  c.connect(bp).connect(cg).connect(out);
  c.start(t0);
  c.stop(t0 + 0.05);

  // rollers, pitching up as the disc is pushed out
  const at = t0 + 0.06;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(115, at);
  osc.frequency.linearRampToValueAtTime(160, at + 0.6);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  const flutter = ac.createGain();
  flutter.gain.value = 0.55;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 26;
  const depth = ac.createGain();
  depth.gain.value = 0.45;
  lfo.connect(depth).connect(flutter.gain);
  const g = env(ac, at, 0.05, 0.4, 0.15, 0.28);
  osc.connect(lp).connect(flutter).connect(g).connect(out);
  osc.start(at);
  lfo.start(at);
  osc.stop(at + 0.7);
  lfo.stop(at + 0.7);
}

/** hand out the shared AudioContext (resumed) for analysers */
export function audioContext() {
  return audio();
}
