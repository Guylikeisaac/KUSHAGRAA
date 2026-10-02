"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { soundtrack, SOUNDTRACK_SRC } from "@/lib/soundtrack";

/**
 * Invisible soundtrack controller. The intro's "Enter with sound" starts the
 * music; this fades it out on case-study pages and brings it back on the home
 * page if it was playing before.
 */
export default function Soundtrack() {
  const pathname = usePathname();
  const wasOn = useRef(false);

  useEffect(() => {
    if (SOUNDTRACK_SRC) soundtrack.preload();
    return soundtrack.subscribe(({ playing, wanted }) => {
      if (playing || wanted) wasOn.current = true;
    });
  }, []);

  useEffect(() => {
    if (pathname !== "/") soundtrack.stop();
    else if (wasOn.current) soundtrack.play();
  }, [pathname]);

  return null;
}
