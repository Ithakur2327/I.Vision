"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Opens the mic (only while `enabled` is true), runs a Web Audio
 * AnalyserNode over it, and exposes a smoothed 0..1 volume level via a ref
 * (read every animation frame in the orb, so it never triggers React
 * re-renders) plus an `error` string if permission was denied.
 */
export function useMicLevel(enabled: boolean) {
  const levelRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      levelRef.current = 0;
      return;
    }

    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255; // 0..1
          // smooth toward the new value so the orb doesn't jitter frame-to-frame
          levelRef.current += (avg - levelRef.current) * 0.35;
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Microphone access denied");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
    };
  }, [enabled]);

  return { levelRef, error };
}