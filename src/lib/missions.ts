import { MissionType } from "@prisma/client";

// ── The 7 Shinka System Mandatory Daily Missions ─────────────────────────────
// These are refreshed every 24 hours. Failure to complete = EXP penalty.

export const DAILY_MISSION_DEFINITIONS = [
  // ── The 5 Sacred Prayers ──────────────────────────────────────────────────
  {
    title: "Fajr Prayer",
    description: "صلاة الفجر · Dawn prayer before sunrise",
    expReward: 10,
    type: MissionType.STANDARD,
    category: "prayer",
    prayerIndex: 1,
  },
  {
    title: "Dhuhr Prayer",
    description: "صلاة الظهر · Noon prayer",
    expReward: 10,
    type: MissionType.STANDARD,
    category: "prayer",
    prayerIndex: 2,
  },
  {
    title: "Asr Prayer",
    description: "صلاة العصر · Afternoon prayer",
    expReward: 10,
    type: MissionType.STANDARD,
    category: "prayer",
    prayerIndex: 3,
  },
  {
    title: "Maghrib Prayer",
    description: "صلاة المغرب · Sunset prayer",
    expReward: 10,
    type: MissionType.STANDARD,
    category: "prayer",
    prayerIndex: 4,
  },
  {
    title: "Isha Prayer",
    description: "صلاة العشاء · Night prayer",
    expReward: 10,
    type: MissionType.STANDARD,
    category: "prayer",
    prayerIndex: 5,
  },
  // ── Physical Overhaul ─────────────────────────────────────────────────────
  {
    title: "Physical Overhaul",
    description: "Complete today's full workout or sport session",
    expReward: 40,
    type: MissionType.STANDARD,
    category: "physical",
    prayerIndex: null,
  },
  // ── Cognitive Evolution ───────────────────────────────────────────────────
  {
    title: "Cognitive Evolution",
    description: "Study or learn something new for at least 20 minutes",
    expReward: 30,
    type: MissionType.STANDARD,
    category: "cognitive",
    prayerIndex: null,
  },
  // ── Discipline ────────────────────────────────────────────────────────────
  {
    title: "Hydration Protocol",
    description: "Drink 8+ glasses of water throughout the day",
    expReward: 20,
    type: MissionType.STANDARD,
    category: "discipline",
    prayerIndex: null,
  },
  {
    title: "Digital Detox",
    description: "Avoid screens for 1 hour before sleep — protect your mind",
    expReward: 25,
    type: MissionType.STANDARD,
    category: "discipline",
    prayerIndex: null,
  },
] as const;

export const TOTAL_DAILY_EXP = DAILY_MISSION_DEFINITIONS.reduce(
  (sum, m) => sum + m.expReward,
  0
);
