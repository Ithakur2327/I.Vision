"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useMicLevel } from "@/lib/useMicLevel";

export type OrbState = "idle" | "typing" | "listening" | "responding";

const ACCENT = "#21F1A8";

/** GLSL simplex noise (Ashima Arts, public domain) — used to displace the
 * sphere's vertices so the "glass membrane" ripples organically instead of
 * staying a perfect sphere. */
const SIMPLEX_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0,1.0/3.0);
    const vec4 D = vec4(0.0,0.5,1.0,2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

function LiquidGlassBody({
  state,
  micLevelRef
}: {
  state: OrbState;
  micLevelRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<any>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.06 },
      uFreq: { value: 1.6 },
      uSpeed: { value: 0.15 }
    }),
    []
  );

  // inject noise displacement into MeshTransmissionMaterial's vertex shader
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmp = uniforms.uAmp;
    shader.uniforms.uFreq = uniforms.uFreq;
    shader.uniforms.uSpeed = uniforms.uSpeed;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uAmp;
      uniform float uFreq;
      uniform float uSpeed;
      ${SIMPLEX_GLSL}
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
      #include <begin_vertex>
      float n = snoise(position * uFreq + uTime * uSpeed);
      transformed += normal * n * uAmp;
      `
    );
    matRef.current.userData.shader = shader;
  };

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;

    const mic = micLevelRef.current; // 0..1, only non-zero while listening

    const targets: Record<
      OrbState,
      { amp: number; freq: number; speed: number; scale: number; rotSpeed: number }
    > = {
      idle: { amp: 0.045, freq: 1.4, speed: 0.12, scale: 1, rotSpeed: 0.05 },
      typing: { amp: 0.09, freq: 2.2, speed: 0.4, scale: 1.02, rotSpeed: 0.12 },
      listening: {
        amp: 0.08 + mic * 0.35,
        freq: 2.0 + mic * 1.5,
        speed: 0.3 + mic * 0.8,
        scale: 1 + mic * 0.06,
        rotSpeed: 0.1 + mic * 0.3
      },
      responding: { amp: 0.14, freq: 2.6, speed: 0.7, scale: 1.05, rotSpeed: 0.25 }
    };
    const t = targets[state];

    uniforms.uAmp.value += (t.amp - uniforms.uAmp.value) * 0.08;
    uniforms.uFreq.value += (t.freq - uniforms.uFreq.value) * 0.08;
    uniforms.uSpeed.value += (t.speed - uniforms.uSpeed.value) * 0.08;

    if (meshRef.current) {
      const s = meshRef.current.scale;
      s.x += (t.scale - s.x) * 0.06;
      s.y += (t.scale - s.y) * 0.06;
      s.z += (t.scale - s.z) * 0.06;
      meshRef.current.rotation.y += delta * t.rotSpeed;
      meshRef.current.rotation.x = Math.sin(uniforms.uTime.value * 0.15) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.4, 64]} />
      <MeshTransmissionMaterial
        ref={matRef}
        onBeforeCompile={onBeforeCompile}
        // — glass optics, tuned to match a dense green liquid-glass membrane —
        samples={6}
        resolution={512}
        transmission={1}
        roughness={0.06}
        thickness={1.6}
        ior={1.35}
        chromaticAberration={0.04}
        anisotropy={0.15}
        distortion={0.35}
        distortionScale={0.4}
        temporalDistortion={0.15}
        clearcoat={1}
        clearcoatRoughness={0.08}
        attenuationDistance={0.6}
        attenuationColor={ACCENT}
        color={ACCENT}
        background={new THREE.Color("#0a0d0c")}
      />
    </mesh>
  );
}

function RigLights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 4, 5]} intensity={40} color={ACCENT} distance={20} />
      <pointLight position={[-4, -2, -3]} intensity={18} color="#0b5e49" distance={20} />
      <pointLight position={[0, 0, 4]} intensity={12} color="#ffffff" distance={10} />
    </>
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
          background: `radial-gradient(closest-side, ${ACCENT}55, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          transition: "opacity 0.6s ease",
          opacity: state === "idle" ? 0.5 : state === "responding" ? 1 : 0.75
        }}
      />
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.2], fov: 35 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <RigLights />
          <LiquidGlassBody state={state} micLevelRef={levelRef} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
