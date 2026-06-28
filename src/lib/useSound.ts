"use client";

import { useCallback, useRef } from "react";

// Lazily create one shared AudioContext per page lifecycle
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  function ctx(): AudioContext | null {
    if (!ctxRef.current) ctxRef.current = getCtx();
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }

  // ── Crisp sci-fi chime — mission complete ────────────────────────────────
  const playChime = useCallback(() => {
    const ac = ctx();
    if (!ac) return;

    const notes = [880, 1108, 1320, 1760];
    notes.forEach((freq, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.07);

      const t0 = ac.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.25, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

      osc.start(t0);
      osc.stop(t0 + 0.35);
    });
  }, []);

  // ── Epic energy surge — level up / rank up ────────────────────────────────
  const playEnergySurge = useCallback(() => {
    const ac = ctx();
    if (!ac) return;

    // Low rumble
    const rumble = ac.createOscillator();
    const rGain  = ac.createGain();
    rumble.connect(rGain);
    rGain.connect(ac.destination);
    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(55, ac.currentTime);
    rumble.frequency.linearRampToValueAtTime(110, ac.currentTime + 0.8);
    rGain.gain.setValueAtTime(0, ac.currentTime);
    rGain.gain.linearRampToValueAtTime(0.3, ac.currentTime + 0.1);
    rGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.9);
    rumble.start(ac.currentTime);
    rumble.stop(ac.currentTime + 0.9);

    // Rising sweep
    const sweep = ac.createOscillator();
    const sGain = ac.createGain();
    sweep.connect(sGain);
    sGain.connect(ac.destination);
    sweep.type = "triangle";
    sweep.frequency.setValueAtTime(200, ac.currentTime + 0.05);
    sweep.frequency.exponentialRampToValueAtTime(1800, ac.currentTime + 0.7);
    sGain.gain.setValueAtTime(0, ac.currentTime + 0.05);
    sGain.gain.linearRampToValueAtTime(0.4, ac.currentTime + 0.2);
    sGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.75);
    sweep.start(ac.currentTime + 0.05);
    sweep.stop(ac.currentTime + 0.75);

    // Impact chords
    const chords = [880, 1100, 1320, 1760, 2200];
    chords.forEach((freq, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ac.currentTime + 0.65 + i * 0.04);
      const t = ac.currentTime + 0.65 + i * 0.04;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }, []);

  return { playChime, playEnergySurge };
}
