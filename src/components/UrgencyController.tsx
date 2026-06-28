"use client";

import { useEffect, useState } from "react";
import { useDailyTimer } from "@/lib/DailyTimerContext";
import { useAmbientSound } from "@/lib/useAmbientSound";
import { useSound } from "@/lib/useSound";
import ShadowZone from "./ShadowZone";

/**
 * Mounts inside DailyTimerProvider.
 * - Controls the heartbeat audio based on urgency state.
 * - Renders the ShadowZone lockdown overlay when isLockdown = true.
 * - Plays a triumph chime when allDone flips to true.
 */
export default function UrgencyController() {
  const { isUrgent, isLockdown, allDone } = useDailyTimer();
  const { startHeartbeat, stopHeartbeat }  = useAmbientSound();
  const { playChime }                       = useSound();
  const [penaltyServed, setPenaltyServed]  = useState(false);
  const [prevDone, setPrevDone]            = useState(allDone);

  // Start/stop heartbeat
  useEffect(() => {
    if (isUrgent) startHeartbeat();
    else          stopHeartbeat();
  }, [isUrgent, startHeartbeat, stopHeartbeat]);

  // Triumph chime when allDone flips from false → true
  useEffect(() => {
    if (!prevDone && allDone) {
      stopHeartbeat();
      playChime();
    }
    setPrevDone(allDone);
  }, [allDone, prevDone, stopHeartbeat, playChime]);

  // ShadowZone
  const showLockdown = isLockdown && !penaltyServed && !allDone;
  if (!showLockdown) return null;

  return <ShadowZone onUnlock={() => setPenaltyServed(true)} />;
}
