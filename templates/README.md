# Portfolio Templates

Goal: a premium portfolio for pitching USA clients (their portfolios & websites).

| # | File | Type | Use in section |
|---|------|------|----------------|
| 01 | `01-unicorn-scene.jsx` | Unicorn Studio WebGL scene (`unicornstudio-react`, projectId `kj5YXDrIachEdo5p7MCg`) | **Projects** |
| 02 | `02-unicorn-loader.jsx` | Unicorn Studio WebGL scene (`unicornstudio-react`, projectId `xbXwZmRzuuyLfPiWCTV9`) | **Projects loading screen** (shown while projects load) |
| 03 | `03-unicorn-scene.jsx` | Unicorn Studio WebGL scene (`unicornstudio-react`, projectId `q7jAhd943BzfvUaRaNbU`, 1728×1117) | **Landing page** (blend with 04) |
| 04 | `04-unicorn-scene.jsx` | Unicorn Studio WebGL scene (`unicornstudio-react`, projectId `mHlUGXTXKE0SIMFdHiG0`, 1600×1080) | **Landing page** (blend with 03) |

## Visual references (images)

| # | File | What to take from it |
|---|------|----------------------|
| 05 | `references/05-face-ref.png` | **Face**: side-profile portrait with a transparent glass helmet, flowers and glowing neural light growing from the head, white high-collar jacket. Dreamy purple/lavender grade. Also: HUD frame with corner crosshairs, small mono data labels ("Status", "Recent research", waveform), blurred/motion big title text, yellow angled CTA button. |
| 06 | `references/06-surroundings-ref.png` | **Surroundings**: soft blue-sky gradient, out-of-focus orange flower field in the foreground (bokeh), golden-hour backlight. Huge condensed all-caps name spread across the top with the figure overlapping the letters (depth effect), and a stacked condensed role title ("FULLSTACK DEVELOPER") on the right. |

| 07 | https://lenis.dev/ | **Scrolling**: Lenis smooth scroll (`lenis` npm package) for buttery, inertia-based scrolling site-wide. Plus the **scroll-driven hand**: the 3D hand on their site moves/rotates in sync with scroll position. We want the same kind of scroll-linked 3D motion. |

Direction: the 05-style floral/glass face, placed in the 06-style open sky + flower field, with the name behind the figure.

## Landing page: mixing 03 + 04
Both scenes get layered in one hero. The exact blend (stacked layers with opacity/blend-mode, a scroll crossfade from 03 to 04, or a split) gets decided at build time.
