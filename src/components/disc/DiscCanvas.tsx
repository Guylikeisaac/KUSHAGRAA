"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DiscStage = dynamic(() => import("./DiscStage"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function DiscCanvas() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // let the loader + hero paint first, then bring the 3D stage in
    const id = requestAnimationFrame(() => setOk(hasWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);
  return ok ? <DiscStage /> : null;
}
