import { WorkoutExercise, WorkoutSession, WorkoutSet } from "@/types";
export const working = (e: WorkoutExercise) =>
  e.skipped ? [] : e.sets.filter((s) => s.completed && s.type === "working");
export const e1rm = (s: WorkoutSet) =>
  s.reps >= 1 && s.reps <= 12 ? s.weight * (1 + s.reps / 30) : 0;
export const volume = (sets: WorkoutSet[]) =>
  sets.reduce((n, s) => n + s.weight * s.reps, 0);
export const sessionSets = (s: WorkoutSession) => s.exercises.flatMap(working);
export const duration = (s: WorkoutSession) =>
  Math.max(
    0,
    Math.round(
      (new Date(s.finishedAt || Date.now()).getTime() -
        new Date(s.startedAt).getTime()) /
        60000,
    ),
  );
export const displayWeight = (kg: number, unit: "kg" | "lb") =>
  Math.round(kg * (unit === "lb" ? 2.2046226218 : 1) * 100) / 100;
export const toKg = (value: number, unit: "kg" | "lb") =>
  value / (unit === "lb" ? 2.2046226218 : 1);
export function previous(
  sessions: WorkoutSession[],
  id: string,
  before = new Date().toISOString(),
) {
  return [...sessions]
    .filter((s) => s.finishedAt && s.startedAt < before)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((s) => s.exercises)
    .find((e) => e.exerciseId === id && working(e).length > 0);
}
