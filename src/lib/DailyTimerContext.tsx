"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type TimerState = {
  hoursLeft: number;
  minutesLeft: number;
  totalSecondsLeft: number;
  isUrgent: boolean;   // < 3 h remaining & not done
  isCritical: boolean; // < 1 h remaining & not done
  isLockdown: boolean; // 0 s remaining & not done
  allDone: boolean;
  notifyAllDone: () => void;
};

const DailyTimerContext = createContext<TimerState>({
  hoursLeft: 24, minutesLeft: 0, totalSecondsLeft: 86400,
  isUrgent: false, isCritical: false, isLockdown: false,
  allDone: false, notifyAllDone: () => {},
});

export const useDailyTimer = () => useContext(DailyTimerContext);

function secsLeft(lastReset: Date) {
  const deadline = new Date(lastReset.getTime() + 86_400_000);
  return Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
}

export function DailyTimerProvider({ children }: { children: React.ReactNode }) {
  const [lastReset, setLastReset] = useState<Date | null>(null);
  const [allDone, setAllDone]     = useState(false);
  const [totalSecs, setTotalSecs] = useState(86400);
  const fetchedRef = useRef(false);

  async function fetchStatus() {
    try {
      const r = await fetch("/api/daily-status", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      if (!d.authenticated || !d.lastDailyReset) return;
      const reset = new Date(d.lastDailyReset);
      setLastReset(reset);
      setAllDone(d.dailiesCompleted);
      setTotalSecs(secsLeft(reset));
    } catch { /* unauthenticated or network error — silent */ }
  }

  // Mount + window-focus + 2-min poll
  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 120_000);
    window.addEventListener("focus", fetchStatus);
    return () => { clearInterval(poll); window.removeEventListener("focus", fetchStatus); };
  }, []);

  // Tick every 60 s
  useEffect(() => {
    if (!lastReset) return;
    const id = setInterval(() => setTotalSecs(secsLeft(lastReset)), 60_000);
    return () => clearInterval(id);
  }, [lastReset]);

  const isUrgent   = totalSecs < 10_800 && totalSecs > 0 && !allDone;
  const isCritical = totalSecs < 3_600  && totalSecs > 0 && !allDone;
  const isLockdown = totalSecs === 0 && !allDone;

  // Reflect urgency on <html> for CSS variable overrides
  useEffect(() => {
    const html = document.documentElement;
    if (isLockdown)      html.setAttribute("data-urgency", "lockdown");
    else if (isCritical) html.setAttribute("data-urgency", "critical");
    else if (isUrgent)   html.setAttribute("data-urgency", "warning");
    else                 html.removeAttribute("data-urgency");
  }, [isUrgent, isCritical, isLockdown]);

  const notifyAllDone = useCallback(() => {
    setAllDone(true);
    document.documentElement.removeAttribute("data-urgency");
  }, []);

  return (
    <DailyTimerContext.Provider value={{
      hoursLeft: Math.floor(totalSecs / 3600),
      minutesLeft: Math.floor((totalSecs % 3600) / 60),
      totalSecondsLeft: totalSecs,
      isUrgent, isCritical, isLockdown, allDone, notifyAllDone,
    }}>
      {children}
    </DailyTimerContext.Provider>
  );
}
