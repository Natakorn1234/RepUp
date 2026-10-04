import { WorkoutExercise, WorkoutSession } from "@/types";
import { working, e1rm } from "@/lib/calculations";
export function compare(
  today: WorkoutExercise,
  last?: WorkoutExercise,
): {
  status: "progressed" | "maintained" | "below" | "baseline";
  detail: string;
} {
  const a = working(today),
    b = last ? working(last) : [];
  if (!a.length || !b.length)
    return { status: "baseline", detail: "Building your baseline" };
  if (a.length !== b.length)
    return {
      status: "maintained",
      detail: "Different set count · compare next time",
    };
  const effort = a.every(
    (s, i) =>
      s.rir === undefined || b[i].rir === undefined || s.rir >= b[i].rir!,
  );
  const same = a.every((s, i) => Math.abs(s.weight - b[i].weight) < 0.01);
  const reps = a.reduce((n, s, i) => n + s.reps - b[i].reps, 0);
  if (same && reps > 0 && a.every((s, i) => s.reps >= b[i].reps) && effort)
    return { status: "progressed", detail: `+${reps} total reps` };
  const load =
    a.every(
      (s, i) =>
        s.weight >= b[i].weight &&
        s.reps >= today.minReps &&
        s.reps <= today.maxReps &&
        b[i].reps >= today.minReps &&
        b[i].reps <= today.maxReps,
    ) && a.some((s, i) => s.weight > b[i].weight);
  if (load && effort)
    return { status: "progressed", detail: "Increased load in target range" };
  if (
    same &&
    reps === 0 &&
    a.every(
      (s, i) =>
        s.reps === b[i].reps &&
        s.rir !== undefined &&
        b[i].rir !== undefined &&
        s.rir >= b[i].rir!,
    ) &&
    a.some((s, i) => s.rir! > b[i].rir!)
  )
    return { status: "progressed", detail: "Same work, more reps in reserve" };
  if (same && reps < 0)
    return { status: "below", detail: "Below last session · normal variation" };
  if (a.every((s, i) => s.weight < b[i].weight && s.reps <= b[i].reps))
    return { status: "below", detail: "A lighter day · keep showing up" };
  return {
    status: "maintained",
    detail: effort
      ? "Performance maintained"
      : "Different effort · keep building",
  };
}
export function suggestion(e: WorkoutExercise) {
  const s = working(e);
  return s.length >= e.targetSets &&
    s.every(
      (s) => s.reps >= e.maxReps && s.rir !== undefined && s.rir >= e.minRir,
    )
    ? "load"
    : "rep";
}
export function records(e: WorkoutExercise, history: WorkoutSession[]) {
  const old = history.flatMap((s) =>
    s.exercises.filter((x) => x.exerciseId === e.exerciseId).flatMap(working),
  );
  if (!old.length) return [];
  const sets = working(e);
  const out: string[] = [];
  if (sets.some((s) => s.weight > Math.max(...old.map((x) => x.weight))))
    out.push("Weight PR");
  if (sets.some((s) => e1rm(s) > Math.max(...old.map(e1rm))))
    out.push("Estimated 1RM PR");
  if (
    sets.some((s) => {
      const same = old.filter((x) => Math.abs(x.weight - s.weight) < 0.01);
      return same.length && s.reps > Math.max(...same.map((x) => x.reps));
    })
  )
    out.push("Rep PR");
  return out;
}
