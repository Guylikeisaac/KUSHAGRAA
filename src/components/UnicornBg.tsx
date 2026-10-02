"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), { ssr: false });

/**
 * A Unicorn Studio scene that fills its parent. Mounts only near the
 * viewport and pauses when off-screen, so several scenes can share a page.
 */
export default function UnicornBg({
  projectId,
  className = "",
  mobileScale = 0.5,
  fps = 60,
  onReady,
  forcePaused = false,
}: {
  projectId: string;
  className?: string;
  mobileScale?: number;
  fps?: 15 | 24 | 30 | 60;
  onReady?: () => void;
  forcePaused?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) {
          setMobile(window.innerWidth < 768);
          setMounted(true);
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      {mounted && (
        <div
          className="absolute inset-0 transition-opacity duration-[1600ms] ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <UnicornScene
            projectId={projectId}
            width="100%"
            height="100%"
            scale={mobile ? mobileScale : 1}
            dpi={mobile ? 1 : 1.5}
            fps={mobile ? 30 : fps}
            lazyLoad={false}
            paused={forcePaused || !visible}
            ariaLabel="Decorative animated background"
            altText=""
            showPlaceholderWhileLoading={false}
            showPlaceholderOnError={false}
            onLoad={() => {
              setReady(true);
              onReady?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
