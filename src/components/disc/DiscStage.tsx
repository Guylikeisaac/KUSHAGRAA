"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { motion } from "@/lib/motion";
import { projects } from "@/lib/data";
import { resolve, type DiscPose, type ResolvedPose } from "./pose";

const FOV = 30;
const CAM_Z = 12;
const HOLE = 0.17;
const DEPTH = 0.035;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic PRNG so the starfield is stable across renders. */
function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** /img/chrome-cd.webp is 1175 × 1137 with the CD + chrome ~1141px wide; plane sized so that span is 2 units. */
const CHROME_CD = { src: "/img/chrome-cd.webp", planeW: 2 * (1175 / 1141), planeH: 2 * (1137 / 1141) };

const FALLBACK: ResolvedPose = resolve({ x: 0.7, y: 0.5, s: 0.5, spin: 1, trail: 1 });

/* ——————————————————————————————————————— anchors */

type Anchor = { el: Element; desk: ResolvedPose; mob: ResolvedPose };

function readAnchors(): Anchor[] {
  return Array.from(document.querySelectorAll("[data-disc]")).map((el) => {
    const desk = resolve(JSON.parse(el.getAttribute("data-disc")!) as DiscPose);
    const m = el.getAttribute("data-disc-m");
    return { el, desk, mob: m ? resolve(JSON.parse(m) as DiscPose) : desk };
  });
}

/** Interpolated target pose for the current scroll position. */
function sample(anchors: Anchor[], vw: number, vh: number): ResolvedPose {
  if (!anchors.length) return FALLBACK;
  const mobile = vw < 768;
  const mid = vh * 0.5;
  const pts = anchors.map((a) => ({ top: a.el.getBoundingClientRect().top - mid, p: mobile ? a.mob : a.desk }));

  if (pts[0].top >= 0) return pts[0].p;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.top <= 0 && b.top > 0) {
      const t = clamp01(-a.top / (b.top - a.top));
      const e = smooth(t);
      // labels swap while the disc is edge-on / showing its back
      const differs = a.p.w.some((v, k) => v !== b.p.w[k]);
      const bareChange = a.p.w[0] !== b.p.w[0];
      const tw = differs ? smooth(clamp01((t - (bareChange ? 0.25 : 0.42)) / (bareChange ? 0.5 : 0.16))) : e;
      return {
        x: lerp(a.p.x, b.p.x, e),
        y: lerp(a.p.y, b.p.y, e),
        s: lerp(a.p.s, b.p.s, e),
        rx: lerp(a.p.rx, b.p.rx, e),
        ry: lerp(a.p.ry, b.p.ry, e),
        rz: lerp(a.p.rz, b.p.rz, e),
        spin: lerp(a.p.spin, b.p.spin, e),
        trail: lerp(a.p.trail, b.p.trail, e),
        dim: lerp(a.p.dim, b.p.dim, e),
        orbit: lerp(a.p.orbit, b.p.orbit, e),
        w: a.p.w.map((v, k) => lerp(v, b.p.w[k], tw)) as ResolvedPose["w"],
      };
    }
  }
  return pts[pts.length - 1].p;
}

/* ——————————————————————————————————————— materials */

function grooveTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(40,40,40)";
  g.fillRect(0, 0, size, size);
  const rand = prng(7);
  for (let r = size * 0.09; r < size * 0.5; r += 1.6) {
    const v = 25 + rand() * 70;
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  // ExtrudeGeometry caps use shape coordinates (-1 → 1) as UVs
  tex.repeat.set(0.5, 0.5);
  tex.offset.set(0.5, 0.5);
  return tex;
}

const faceVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    // the CD artwork fills ~93.7% of each square cover
    vUv = position.xy * 0.4685 + 0.5;
    vLocal = position.xy;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const faceFragment = /* glsl */ `
  uniform sampler2D uT0;
  uniform sampler2D uT1;
  uniform sampler2D uT2;
  uniform vec3 uW;
  uniform float uTime;
  uniform float uSpin;
  uniform vec2 uTilt;
  uniform float uDim;
  varying vec2 vUv;
  varying vec2 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewPos;

  vec3 spectrum(float x) {
    return 0.5 + 0.5 * cos(6.2831 * (x + vec3(0.0, 0.33, 0.67)));
  }

  // A procedural pressed CD: silver fans that stay locked to the light while
  // the disc spins underneath, diffraction rainbows, grooves and a clear hub.
  vec3 cd(vec2 q) {
    float r = length(q);
    float ang = atan(q.y, q.x) + uSpin;
    float t = uTilt.x;
    float fan = pow(0.5 + 0.5 * cos(2.0 * (ang - t)), 7.0);
    float fan2 = pow(0.5 + 0.5 * cos(2.0 * (ang - t - 1.15)), 16.0);
    vec3 base = vec3(0.36, 0.36, 0.39) + vec3(0.22) * (0.5 + 0.5 * cos(2.0 * (ang - t + 0.7)));
    vec3 rb = spectrum(r * 1.7 + ang * 0.16 + uTilt.y);
    vec3 col = base * 0.85 + vec3(0.95) * fan + rb * fan * 0.75 + rb * fan2 * 0.7;
    float red = pow(0.5 + 0.5 * cos(ang - t + 2.4), 12.0);
    col += vec3(1.0, 0.23, 0.18) * red * 0.75;
    col *= 0.93 + 0.07 * sin(r * 900.0);
    float hub = smoothstep(0.335, 0.355, r);
    col = mix(vec3(0.10, 0.10, 0.11) + fan * 0.3, col, hub);
    col += smoothstep(0.005, 0.0, abs(r - 0.355)) * 0.5;
    col += smoothstep(0.965, 1.0, r) * 0.4;
    return col * 0.86;
  }

  void main() {
    float wt = clamp(uW.x + uW.y + uW.z, 0.0, 1.0);
    vec3 chrome = cd(vLocal);
    vec3 c = chrome;
    if (wt > 0.002) {
      vec3 label = texture2D(uT0, vUv).rgb * uW.x
                 + texture2D(uT1, vUv).rgb * uW.y
                 + texture2D(uT2, vUv).rgb * uW.z;
      label /= max(uW.x + uW.y + uW.z, 0.0001);
      // view-dependent iridescent sheen across the printed label
      vec3 v = normalize(vViewPos);
      float f = pow(1.0 - abs(dot(normalize(vNormalV), v)), 2.0);
      vec2 p = vUv - 0.5;
      float band = smoothstep(0.8, 1.0, sin(atan(p.y, p.x) * 2.0 + uTilt.x * 2.0 + f * 6.0));
      label += spectrum(length(p) * 3.0 + uTime * 0.05) * band * 0.10 + f * 0.2;
      c = mix(chrome, label, wt);
    }
    gl_FragColor = vec4(c * (1.0 - 0.55 * uDim), 1.0);
  }
`;

const trailVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    float along = vUv.x;
    float across = (vUv.y - 0.5) * 2.0;
    float body = exp(-across * across * 5.0);
    float core = exp(-across * across * 70.0);
    float grow = pow(smoothstep(0.0, 1.0, along), 1.7);
    float flow = 0.72 + 0.28 * sin(along * 38.0 - uTime * 5.0 + uSeed * 10.0);
    float tip = 1.0 - smoothstep(0.86, 1.0, along);
    float a = (body * 0.45 + core) * grow * flow * tip * uIntensity;
    vec3 molten = vec3(1.0, 0.23, 0.18);
    vec3 hot = vec3(1.0, 0.82, 0.78);
    vec3 col = mix(molten, hot, core * 0.8);
    gl_FragColor = vec4(col * a, a);
  }
`;

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScroll;
  uniform float uPx;
  varying float vTw;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uScroll * (0.4 + aSize * 0.25) + 9.0, 18.0) - 9.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vTw = 0.45 + 0.55 * sin(uTime * (0.6 + aPhase) + aPhase * 30.0);
    vColor = aColor;
    gl_PointSize = aSize * uPx * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const starFragment = /* glsl */ `
  varying float vTw;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vTw;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

/* ——————————————————————————————————————— scene parts */

function Stars({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const rand = prng(1337);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 26;
      pos[i * 3 + 1] = (rand() - 0.5) * 18;
      pos[i * 3 + 2] = -2 - rand() * 6;
      size[i] = 0.6 + rand() * 1.6;
      phase[i] = rand();
      const red = rand() < 0.18;
      col.set(red ? [1, 0.45, 0.4] : [1, 1, 1], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uScroll: { value: 0 }, uPx: { value: gl.getPixelRatio() } }),
    [gl],
  );

  useFrame((s) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = s.clock.elapsedTime;
    mat.current.uniforms.uScroll.value = motion.scroll * 0.0016;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Trail({ seed, widthScale }: { seed: number; widthScale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1).translate(0.5, 0, 0), []);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 0 }, uSeed: { value: seed } }),
    [seed],
  );
  return (
    <mesh ref={ref} geometry={geo} frustumCulled={false} name={`trail-${seed}`} userData={{ widthScale }}>
      <shaderMaterial
        vertexShader={trailVertex}
        fragmentShader={trailFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Disc() {
  const pathname = usePathname();
  const { camera, size, scene } = useThree();
  const group = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.ShaderMaterial>(null);
  const anchors = useRef<Anchor[]>([]);
  const frame = useRef(0);
  const spinAngle = useRef(0);
  const spriteSpin = useRef(0);
  const sprite = useRef<THREE.Group>(null);
  const cur = useRef<ResolvedPose | null>(null);

  const covers = useTexture(projects.map((p) => p.cover));
  // the signature disc: a sculpted chrome CD, shown whenever no project label is on
  const chrome = useTexture(CHROME_CD.src, (t) => {
    const tex = t as THREE.Texture;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  });
  const spriteGeo = useMemo(() => new THREE.PlaneGeometry(CHROME_CD.planeW, CHROME_CD.planeH), []);
  useMemo(() => {
    covers.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });
  }, [covers]);

  const body = useMemo(() => {
    const shape = new THREE.Shape().absarc(0, 0, 1, 0, Math.PI * 2, false);
    shape.holes.push(new THREE.Path().absarc(0, 0, HOLE, 0, Math.PI * 2, true));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 4,
      curveSegments: 128,
    });
    g.center();
    return g;
  }, []);

  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e6e6ea"),
        metalness: 1,
        roughness: 0.22,
        roughnessMap: grooveTexture(),
        iridescence: 1,
        iridescenceIOR: 1.45,
        iridescenceThicknessRange: [180, 820],
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.6,
      }),
    [],
  );

  const face = useMemo(() => new THREE.RingGeometry(HOLE + 0.004, 0.996, 128, 1), []);
  const faceZ = DEPTH / 2 + 0.012 + 0.002;
  // the back carries the same project art, so a flip between projects never shows bare chrome
  const backMat = useRef<THREE.ShaderMaterial>(null);
  const backUniforms = useMemo(
    () => ({
      uT0: { value: covers[0] },
      uT1: { value: covers[1] },
      uT2: { value: covers[2] },
      uW: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uSpin: { value: 0 },
      uTilt: { value: new THREE.Vector2() },
      uDim: { value: 0 },
    }),
    [covers],
  );

  const faceUniforms = useMemo(
    () => ({
      uT0: { value: covers[0] },
      uT1: { value: covers[1] },
      uT2: { value: covers[2] },
      uW: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uSpin: { value: 0 },
      uTilt: { value: new THREE.Vector2() },
      uDim: { value: 0 },
    }),
    [covers],
  );

  useEffect(() => {
    anchors.current = readAnchors();
    const t1 = setTimeout(() => (anchors.current = readAnchors()), 120);
    const t2 = setTimeout(() => (anchors.current = readAnchors()), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 20);
    if (++frame.current % 30 === 0) anchors.current = readAnchors();

    const vw = size.width;
    const vh = size.height;
    const target = sample(anchors.current, vw, vh);
    if (!cur.current) cur.current = { ...target, w: [...target.w] as ResolvedPose["w"] };
    const c = cur.current;
    const k = motion.reduced ? 1 : 1 - Math.exp(-d * 5.5);
    (["x", "y", "s", "rx", "ry", "rz", "spin", "trail", "dim", "orbit"] as const).forEach((key) => {
      c[key] = lerp(c[key], target[key], k);
    });
    c.w = c.w.map((v, i) => lerp(v, target.w[i], k)) as ResolvedPose["w"];

    // screen → world at z = 0
    const persp = camera as THREE.PerspectiveCamera;
    const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)) * CAM_Z;
    const upp = worldH / vh;
    const t = state.clock.elapsedTime;
    const radius = (c.s * Math.min(vw, vh) * 0.5) * upp;
    const wx = (c.x * vw - vw / 2) * upp;
    const wy = -(c.y * vh - vh / 2) * upp + (motion.reduced ? 0 : Math.sin(t * 0.8) * 0.05 * radius);

    const g = group.current!;
    g.position.set(wx, wy, 0);
    g.scale.setScalar(Math.max(radius, 0.0001));
    const px = motion.reduced ? 0 : motion.pointer.x;
    const py = motion.reduced ? 0 : motion.pointer.y;
    g.rotation.set(c.rx + py * 0.16, c.ry + px * 0.22, c.rz);

    // self spin — speeds up with scroll velocity, settles upright when a label is showing
    const spinner_ = spinner.current!;
    if (!motion.reduced && target.spin > 0.01) {
      spinAngle.current -= d * c.spin * (0.9 + Math.min(Math.abs(motion.velocity), 60) * 0.06);
    } else {
      const rest = Math.round(spinAngle.current / (Math.PI * 2)) * Math.PI * 2;
      spinAngle.current = lerp(spinAngle.current, rest, 1 - Math.exp(-d * 6));
    }
    spinner_.rotation.z = spinAngle.current;

    const tiltX = c.ry * 1.4 + c.rx * 0.9 + px * 0.7 + (motion.reduced ? 0 : t * 0.12);
    const tiltY = c.rx * 0.5 + c.ry * 0.3 + t * 0.03;
    if (faceMat.current) {
      const u = faceMat.current.uniforms;
      u.uTime.value = t;
      u.uSpin.value = spinAngle.current;
      u.uTilt.value.set(tiltX, tiltY);
      u.uDim.value = c.dim;
    }
    if (backMat.current) {
      backMat.current.uniforms.uSpin.value = -spinAngle.current;
      backMat.current.uniforms.uTilt.value.set(-tiltX + 1.3, tiltY + 0.4);
      backMat.current.uniforms.uDim.value = c.dim;
    }

    // coin-flip handoff between the chrome CD (bare) and the pressed 3D disc (label):
    // the chrome CD turns edge-on, and at that instant the 3D disc — also edge-on —
    // turns to face the viewer. No transparency, so it reads as one object flipping.
    const bare = c.w[0];
    const outFlip = (1 - smooth(clamp01((bare - 0.5) / 0.5))) * (Math.PI / 2); // chrome CD: 0 → 90°
    const inFlip = smooth(clamp01(bare / 0.5)) * (Math.PI / 2); // 3D disc: 90° → 0
    const showSprite = bare >= 0.5;

    g.visible = !showSprite;
    g.rotation.y += inFlip;
    // labels at full strength the moment the 3D disc takes over
    if (faceMat.current) {
      const lw = Math.max(1 - bare, 1e-3);
      faceMat.current.uniforms.uW.value.set(Math.min(1, c.w[1] / lw), Math.min(1, c.w[2] / lw), Math.min(1, c.w[3] / lw));
      backMat.current?.uniforms.uW.value.copy(faceMat.current.uniforms.uW.value);
    }

    const sp = sprite.current!;
    sp.visible = showSprite;
    sp.position.set(wx, wy, 0.05);
    sp.scale.setScalar(Math.max(radius, 0.0001));
    if (!motion.reduced) {
      // steady turn on its own axis (landing page), easing off as the pose's orbit fades to 0…
      spriteSpin.current -= d * c.orbit * Math.PI * 2;
      // …plus the usual kick from scroll speed everywhere else
      spriteSpin.current -= d * Math.min(Math.abs(motion.velocity), 60) * 0.02 * Math.sign(motion.velocity || 1) * Math.min(c.spin, 1.5);
    }
    // it's a photographed object, so it only tilts a little and sways rather than flipping freely
    sp.rotation.set(
      THREE.MathUtils.clamp(c.rx, -0.6, 0.6) * 0.45 + py * 0.18,
      THREE.MathUtils.clamp(c.ry, -0.7, 0.7) * 0.45 + px * 0.26 + outFlip,
      c.rz * 0.5 + spriteSpin.current + (motion.reduced ? 0 : Math.sin(t * 0.7) * 0.06),
    );

    // light trails reaching in from the bottom-right corner, like an arm of light
    const mobile = vw < 768;
    const sx = ((mobile ? 1.15 : 1.08) * vw - vw / 2) * upp;
    const sy = -((mobile ? 1.2 : 1.3) * vh - vh / 2) * upp;
    ["trail-1", "trail-2"].forEach((name, i) => {
      const m = scene.getObjectByName(name) as THREE.Mesh | undefined;
      if (!m) return;
      const ox = i === 0 ? 0 : radius * 0.9;
      const oy = i === 0 ? 0 : -radius * 0.4;
      // stop at the rim facing the source so the tip never shows through an edge-on disc
      const tx = sx + ox - wx;
      const ty = sy + oy - wy;
      const tl = Math.hypot(tx, ty) || 1;
      const ex = wx + (tx / tl) * radius * 0.75;
      const ey = wy + (ty / tl) * radius * 0.75;
      const dx = ex - (sx + ox);
      const dy = ey - (sy + oy);
      const len = Math.hypot(dx, dy);
      m.position.set(sx + ox, sy + oy, -0.6 - i * 0.2);
      m.rotation.z = Math.atan2(dy, dx);
      m.scale.set(len, radius * 0.95 * (m.userData.widthScale as number), 1);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uTime.value = t;
      u.uIntensity.value = c.trail * (i === 0 ? 0.9 : 0.45) * (0.85 + 0.15 * Math.sin(t * 1.3 + i));
    });
  });

  return (
    <>
      <Trail seed={1} widthScale={1} />
      <Trail seed={2} widthScale={0.4} />
      <group ref={sprite}>
        <mesh geometry={spriteGeo}>
          <meshBasicMaterial map={chrome} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      <group ref={group}>
        <group ref={spinner}>
          <mesh geometry={body} material={bodyMat} />
          <mesh geometry={face} position={[0, 0, faceZ]}>
            <shaderMaterial
              ref={faceMat}
              vertexShader={faceVertex}
              fragmentShader={faceFragment}
              uniforms={faceUniforms}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={face} position={[0, 0, -faceZ]} rotation={[0, Math.PI, 0]}>
            <shaderMaterial
              ref={backMat}
              vertexShader={faceVertex}
              fragmentShader={faceFragment}
              uniforms={backUniforms}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}

function Lights() {
  // a dark studio: thin white strips for crisp chrome highlights, molten red from the side
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#060606"]} />
      <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[10, 0.8, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={1.4} position={[0, -4, 3]} scale={[10, 0.4, 1]} color="#ffffff" />
      {[-4.5, -2, 1.5, 4].map((x, i) => (
        <Lightformer key={x} form="rect" intensity={0.9 + i * 0.25} position={[x, 0, 4]} scale={[0.18 + i * 0.05, 8, 1]} color="#ffffff" />
      ))}
      <Lightformer form="rect" intensity={1.8} position={[-6, 1, 1]} scale={[1.4, 7, 1]} color="#ff3b2f" />
      <Lightformer form="rect" intensity={0.9} position={[6, -2, 0]} scale={[1, 5, 1]} color="#ff6a5c" />
      <Lightformer form="ring" intensity={1.2} position={[2, 2, 6]} scale={1.6} color="#ffe2dd" />
    </Environment>
  );
}

export default function DiscStage() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      className="!fixed inset-0 z-[2] !pointer-events-none"
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 50 }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        document.documentElement.classList.add("gl-ready");
      }}
    >
      <Stars count={mobile ? 260 : 650} />
      <Suspense fallback={null}>
        <Lights />
        <Disc />
      </Suspense>
    </Canvas>
  );
}
