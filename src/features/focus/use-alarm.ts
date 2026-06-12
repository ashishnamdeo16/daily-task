"use client";

import { useCallback, useRef } from "react";

/**
 * A loud, looping alarm built with the Web Audio API — no audio asset required.
 * Plays an alternating two-tone siren until stopped.
 */
export function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const beep = useCallback((ctx: AudioContext, freq: number, when: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.5, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + dur);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const cycle = () => {
      const t = ctx.currentTime;
      beep(ctx, 880, t, 0.25);
      beep(ctx, 660, t + 0.3, 0.25);
    };
    cycle();
    intervalRef.current = setInterval(cycle, 700);

    // Vibrate on supported devices.
    if ("vibrate" in navigator) {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  }, [beep]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
  }, []);

  return { start, stop };
}
