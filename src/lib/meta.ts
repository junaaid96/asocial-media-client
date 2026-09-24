import type { Battery, Mood, Pace, ReactionKind } from "./types";

export const MOODS: Record<Mood, { label: string; emoji: string; color: string }> = {
  calm: { label: "Calm", emoji: "🌊", color: "#5b8fb9" },
  reflective: { label: "Reflective", emoji: "🌙", color: "#8a78c2" },
  joyful: { label: "Joyful", emoji: "☀️", color: "#cf8f1f" },
  grateful: { label: "Grateful", emoji: "🌿", color: "#4f9a6e" },
  tired: { label: "Tired", emoji: "☁️", color: "#7c8794" },
  anxious: { label: "Anxious", emoji: "🌀", color: "#cf6f7a" },
  curious: { label: "Curious", emoji: "🔭", color: "#2f9c9c" },
  melancholy: { label: "Melancholy", emoji: "🌧️", color: "#6a6fb0" },
};

export const MOOD_KEYS = Object.keys(MOODS) as Mood[];

export const REACTIONS: Record<ReactionKind, { label: string; emoji: string; verb: string }> = {
  felt: { label: "Felt this", emoji: "🤍", verb: "felt" },
  hug: { label: "Sending a hug", emoji: "🫂", verb: "sent a hug for" },
  insight: { label: "Insightful", emoji: "💡", verb: "found insight in" },
  relate: { label: "Relate", emoji: "🌱", verb: "related to" },
};

export const REACTION_KEYS = Object.keys(REACTIONS) as ReactionKind[];

export const BATTERY: Record<Battery, { label: string; hint: string; color: string; level: number }> = {
  full: { label: "Fully charged", hint: "Happy to chat and reply", color: "#4f9a6e", level: 4 },
  half: { label: "Half charged", hint: "Some energy for conversation", color: "#cf9b2a", level: 2 },
  low: { label: "Low battery", hint: "Replies may be slow", color: "#d9774f", level: 1 },
  recharging: { label: "Recharging", hint: "Taking quiet time — notifications hushed", color: "#8a78c2", level: 0 },
};

export const BATTERY_KEYS = Object.keys(BATTERY) as Battery[];

export const PACES: Record<Pace, { label: string; eta: string; description: string }> = {
  breeze: { label: "On a breeze", eta: "~15 minutes", description: "A short hop across town" },
  afternoon: { label: "By afternoon", eta: "~3 hours", description: "Time for it to settle" },
  overnight: { label: "Overnight", eta: "~12 hours", description: "Wakes them up gently" },
};

export function tint(color: string, percent: number) {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
}
