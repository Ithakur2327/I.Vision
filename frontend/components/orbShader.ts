// Shared shader source for the I.Vision orb.
//
// Visual target (sampled directly from the reference mockup):
//   - background / core:  near-black                         (~#000000–#020304)
//   - mid "smoke" wisps:  mid-brightness cyan-teal            (~#0F8E96)
//   - rim / hot streaks:  bright cyan → near-white            (~#00EBE1 → #FFFFFF)
//
// Technique: a single fullscreen-quad fragment shader (no textures, no
// external assets). Domain-warped fbm noise produces the slow drifting
// "smoke" bands inside the sphere; a fresnel-style term brightens near the
// silhouette edge with its own angular noise so the rim glow isn't perfectly
// even (matching the uneven bright arcs visible in the reference); a small
// gaussian blob adds the top-left specular highlight. Everything is driven
// by uTime so all of the "waves" are continuously animating.

export const ORB_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ORB_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uAmp;    // 0..~1.4  — smoke/vein intensity
  uniform float uSpeed;  // flow speed multiplier
  uniform float uGlow;   // 0..~1.4  — rim + specular intensity
  uniform float uScale;  // noise zoom

  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorBright;
  uniform vec3 uColorHot;

  // --- Ashima Arts 2D simplex noise (public domain) ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      sum += amp * snoise(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  // domain-warped flow so the noise looks like drifting smoke, not static noise
  vec2 warp(vec2 p, float t) {
    float n1 = fbm(p + vec2(1.7, 9.2) + t * 0.15);
    float n2 = fbm(p + vec2(8.3, 2.8) - t * 0.126);
    vec2 q = vec2(n1, n2);

    float n3 = fbm(p + 1.4 * q + vec2(5.3, 1.2) + t * 0.08);
    float n4 = fbm(p + 1.4 * q + vec2(0.8, 6.6) - t * 0.09);
    vec2 r = vec2(n3, n4);

    return p + 1.1 * r;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);

    if (r > 1.4) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float t = uTime * uSpeed;

    vec2 p = uv * uScale;
    vec2 wp = warp(p, t);
    float n01 = fbm(wp * 1.15) * 0.5 + 0.5;

    float veins = smoothstep(0.38, 0.55, n01) * (1.0 - smoothstep(0.6, 0.92, n01));
    veins = clamp(veins, 0.0, 1.0);

    float n2 = fbm(wp * 2.4 - t * 0.4) * 0.5 + 0.5;
    float fine = smoothstep(0.55, 0.95, n2);

    float wisp = clamp(veins * 1.0 + fine * 0.45, 0.0, 1.0) * uAmp;

    vec3 col = uColorCore;
    col += uColorMid * wisp;

    // fresnel-style rim, brighter toward the silhouette edge
    float rim = smoothstep(0.45, 1.0, r);
    float rimShape = pow(rim, 1.6);

    float ang = atan(uv.y, uv.x);
    vec2 angUv = vec2(cos(ang), sin(ang)) * 3.0;
    float rimNoise = fbm(angUv + t * 0.4) * 0.5 + 0.5;

    float rimGlow = rimShape * (0.35 + 0.85 * rimNoise) * uGlow;
    col += uColorBright * rimGlow;

    float hot = smoothstep(0.72, 1.0, rimNoise) * rimShape * uGlow;
    col += uColorHot * hot;

    // soft specular highlight, upper-left (matches the reference art's key light)
    vec2 specPos = vec2(-0.34, 0.4);
    float specD = dot(uv - specPos, uv - specPos);
    float spec = exp(-specD * 9.0) * uGlow;
    col += uColorHot * spec * 0.5;

    float core = smoothstep(1.05, 0.88, r);
    float haze = smoothstep(1.4, 1.0, r) * (rimGlow + hot) * 0.6;
    float alpha = clamp(max(core, haze), 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

export type OrbState = "idle" | "typing" | "listening" | "responding";

export const ORB_COLORS = {
  core: [0.006, 0.016, 0.018] as [number, number, number],
  mid: [0.04, 0.5, 0.53] as [number, number, number],
  bright: [0.02, 0.86, 0.86] as [number, number, number],
  hot: [0.82, 1.0, 1.0] as [number, number, number]
};

export const ORB_STATE_TARGETS: Record<
  OrbState,
  { amp: number; speed: number; glow: number; scale: number }
> = {
  idle: { amp: 0.62, speed: 0.32, glow: 0.55, scale: 1.55 },
  typing: { amp: 0.82, speed: 0.55, glow: 0.75, scale: 1.65 },
  listening: { amp: 0.75, speed: 0.5, glow: 0.7, scale: 1.6 },
  responding: { amp: 0.98, speed: 0.85, glow: 1.05, scale: 1.75 }
};