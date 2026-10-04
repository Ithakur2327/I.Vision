"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useMicLevel } from "@/lib/useMicLevel";
import {
  ORB_VERTEX_SHADER,
  ORB_FRAGMENT_SHADER,
  ORB_COLORS,
  ORB_STATE_TARGETS,
  type OrbState
} from "@/components/orbShader";

export type { OrbState };

export const ORB_ACCENT = "#00EBE1";

/**
 * The orb's inner sphere — a single fullscreen-quad shader (see
 * components/orbShader.ts) rather than a lit 3D mesh. A refractive glass
 * material would show the page bleeding through it and wouldn't reproduce
 * the reference art: a mostly-black sphere with slow cyan "smoke" drifting
 * inside it and a bright, uneven glow along its rim. Domain-warped fbm noise
 * drives the smoke, a fresnel term (with its own angular noise) drives the
 * rim, and everything animates continuously off uTime so the waves never
 * stop moving.
 */
function SmokeOrb({
  state,
  micLevelRef
}: {
  state: OrbState;
  micLevelRef: React.MutableRefObject<number>;
}) {
  const idle = ORB_STATE_TARGETS.idle;
  const current = useRef({ amp: idle.amp, speed: idle.speed, glow: idle.glow, scale: idle.scale });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: idle.amp },
      uSpeed: { value: idle.speed },
      uGlow: { value: idle.glow },
      uScale: { value: idle.scale },
      uColorCore: { value: new THREE.Color(...ORB_COLORS.core) },
      uColorMid: { value: new THREE.Color(...ORB_COLORS.mid) },
      uColorBright: { value: new THREE.Color(...ORB_COLORS.bright) },
      uColorHot: { value: new THREE.Color(...ORB_COLORS.hot) }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;

    // mic level is only ever non-zero while state === "listening" (the hook
    // itself no-ops otherwise), so it's safe to fold in unconditionally
    const mic = micLevelRef.current;
    const base = ORB_STATE_TARGETS[state];
    const target = {
      amp: base.amp + mic * 0.4,
      speed: base.speed + mic * 0.7,
      glow: base.glow + mic * 0.5,
      scale: base.scale + mic * 0.15
    };

    const c = current.current;
    const ease = 0.08;
    c.amp += (target.amp - c.amp) * ease;
    c.speed += (target.speed - c.speed) * ease;
    c.glow += (target.glow - c.glow) * ease;
    c.scale += (target.scale - c.scale) * ease;

    uniforms.uAmp.value = c.amp;
    uniforms.uSpeed.value = c.speed;
    uniforms.uGlow.value = c.glow;
    uniforms.uScale.value = c.scale;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={ORB_VERTEX_SHADER}
        fragmentShader={ORB_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function Orb3D({
  size = 280,
  state = "idle",
  className
}: {
  size?: number;
  state?: OrbState;
  className?: string;
}) {
  const { levelRef } = useMicLevel(state === "listening");

  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }}>
      {/* CSS ambient bloom behind the canvas — cheap, and sells the "glow cast
          on the surrounding environment" from the reference art */}
      <div
        style={{
          position: "absolute",
          inset: "-45%",
          borderRadius: "9999px",
          background: `radial-gradient(closest-side, ${ORB_ACCENT}55, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          transition: "opacity 0.6s ease",
          opacity: state === "idle" ? 0.5 : state === "responding" ? 1 : 0.75
        }}
      />
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <OrthographicCamera
          makeDefault
          position={[0, 0, 1]}
          left={-1}
          right={1}
          top={1}
          bottom={-1}
          near={0}
          far={2}
        />
        <SmokeOrb state={state} micLevelRef={levelRef} />
      </Canvas>
    </div>
  );
}