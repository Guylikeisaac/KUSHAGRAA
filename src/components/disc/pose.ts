/**
 * A disc "pose" says where the 3D disc should sit on screen when the
 * anchor element carrying it crosses the vertical middle of the viewport.
 * Between two anchors the disc interpolates — so the whole choreography
 * is authored in the DOM and follows layout on every screen size.
 */
export type DiscPose = {
  /** viewport position, 0 → 1 */
  x: number;
  y: number;
  /** diameter as a fraction of min(viewport width, height) */
  s: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** self-rotation speed around the disc's own axis (0 = settle upright) */
  spin?: number;
  /** -1 = bare chrome, 0..2 = project label */
  tex?: number;
  /** light-trail intensity 0 → 1 */
  trail?: number;
  /** 0 = full chrome, 1 = dimmed to a soft glow */
  dim?: number;
  /** steady spin of the chrome CD on its own axis, in turns per second (0 = only scroll moves it) */
  orbit?: number;
};

export type ResolvedPose = Required<Omit<DiscPose, "tex">> & { w: [number, number, number, number] };

export function resolve(p: DiscPose): ResolvedPose {
  const tex = p.tex ?? -1;
  const w: [number, number, number, number] = [0, 0, 0, 0];
  w[tex + 1] = 1;
  return {
    x: p.x,
    y: p.y,
    s: p.s,
    rx: p.rx ?? 0,
    ry: p.ry ?? 0,
    rz: p.rz ?? 0,
    spin: p.spin ?? 0,
    trail: p.trail ?? 0,
    dim: p.dim ?? 0,
    orbit: p.orbit ?? 0,
    w,
  };
}
