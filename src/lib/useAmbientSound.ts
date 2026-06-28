"use client";

import { useCallback, useRef } from "react";

function getAC(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

function beat(ac: AudioContext, masterGain: GainNode) {
  // Lub-DUB pattern: two short bass thumps
  ([
    [58,  0.00, 0.09],
    [46,  0.14, 0.11],
  ] as [number, number, number][]).forEach(([freq, offset, dur]) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(masterGain);
    osc.type = "sine"; osc.frequency.value = freq;
    const t = ac.currentTime + offset;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  });
}

export function useAmbientSound() {
  const acRef      = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const intervalRef= useRef<ReturnType<typeof setInterval> | null>(null);

  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) return; // already running
    if (!acRef.current) acRef.current = getAC();
    const ac = acRef.current; if (!ac) return;
    if (ac.state === "suspended") ac.resume();

    const master = ac.createGain();
    master.connect(ac.destination);
    master.gain.setValueAtTime(0, ac.currentTime);
    master.gain.linearRampToValueAtTime(0.8, ac.currentTime + 5); // 5s fade-in
    masterRef.current = master;

    beat(ac, master);
    intervalRef.current = setInterval(() => beat(ac, master), 1_200);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (masterRef.current && acRef.current) {
      const ac = acRef.current;
      masterRef.current.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
      setTimeout(() => { masterRef.current = null; }, 1_600);
    }
  }, []);

  return { startHeartbeat, stopHeartbeat };
}
