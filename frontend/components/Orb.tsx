"use client";

import { Orb3D, type OrbState } from "@/components/Orb3D";

/**
 * Thin backwards-compatible wrapper around Orb3D so existing call sites
 * (`<Orb size={...} pulse={...} />`) keep working unchanged.
 *
 * For the 4 distinct states (idle / typing / listening / responding) use
 * `<Orb3D state="..." />` directly instead — see Orb3D.tsx.
 */
export function Orb({
  size = 260,
  pulse = false,
  state
}: {
  size?: number;
  pulse?: boolean;
  state?: OrbState;
}) {
  return <Orb3D size={size} state={state ?? (pulse ? "typing" : "idle")} />;
}
