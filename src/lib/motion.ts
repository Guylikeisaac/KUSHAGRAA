import type Lenis from "lenis";

/**
 * Tiny shared store for things that live outside React's render cycle:
 * the Lenis instance, scroll velocity (read every frame by the 3D disc)
 * and the pointer position. Mutated in place — never trigger renders.
 */
export const motion = {
  lenis: null as Lenis | null,
  velocity: 0,
  scroll: 0,
  pointer: { x: 0, y: 0 }, // normalized -1 → 1
  reduced: false,
};

export const LOADER_DONE = "kc:loader-done";

export function onLoaderDone(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (document.documentElement.dataset.loaded === "true") {
    cb();
    return () => {};
  }
  window.addEventListener(LOADER_DONE, cb, { once: true });
  return () => window.removeEventListener(LOADER_DONE, cb);
}

export function scrollToTarget(target: string | number, immediate = false) {
  if (motion.lenis) {
    motion.lenis.scrollTo(target, { immediate, duration: 1.6, offset: 0 });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  else document.querySelector(target)?.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
}
