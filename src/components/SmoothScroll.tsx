"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // ?still renders the final state of every animation (handy for previews/screenshots)
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(window.location.search).has("still");
    motion.reduced = reduced;

    history.scrollRestoration = "manual";

    const onPointer = (e: PointerEvent) => {
      motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      motion.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    if (reduced) {
      const onScroll = () => {
        motion.scroll = window.scrollY;
        ScrollTrigger.update();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
      };
    }

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      syncTouch: false,
    });
    motion.lenis = lenis;

    lenis.on("scroll", (l: Lenis) => {
      motion.velocity = l.velocity;
      motion.scroll = l.scroll;
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      motion.lenis = null;
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // On route change: jump to the hash target (e.g. "/#work") or to the top.
  useEffect(() => {
    const hash = window.location.hash;
    const go = () => {
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          if (motion.lenis) motion.lenis.scrollTo(el as HTMLElement, { immediate: true, force: true });
          else el.scrollIntoView();
        }
        // drop the #section so a later refresh starts on the landing page again
        history.replaceState(history.state, "", window.location.pathname + window.location.search);
      } else if (motion.lenis) motion.lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(go));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
