"use client";

import { useEffect, useState } from "react";
import { soundtrack, SOUNDTRACK_SRC } from "@/lib/soundtrack";

/** Nav control: animated bars while the soundtrack plays; click to start / stop it. */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => soundtrack.subscribe(({ playing, wanted }) => setOn(playing || wanted)), []);

  if (!SOUNDTRACK_SRC) return null;

  const toggle = () => {
    if (on) {
      soundtrack.setMuted(true);
      soundtrack.stop(0.4);
    } else {
      soundtrack.setMuted(false);
      soundtrack.play();
    }
  };

  return (
    <button
      onClick={toggle}
      data-no-soundtrack
      aria-pressed={on}
      aria-label={on ? "Stop the music" : "Play the music"}
      className="flex h-10 items-center gap-2 rounded-full px-3 ring-1 ring-white/15 transition hover:ring-molten/50"
    >
      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
        {[0.9, 0.5, 1, 0.65].map((d, i) => (
          <span
            key={i}
            className="block h-full w-[2px] origin-bottom rounded-full bg-bone"
            style={{
              transform: on ? undefined : "scaleY(0.25)",
              animation: on ? `vu ${0.45 + d * 0.4}s ease-in-out ${i * 0.08}s infinite alternate` : "none",
            }}
          />
        ))}
      </span>
      <span className="label hidden text-bone/80 xl:inline">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
