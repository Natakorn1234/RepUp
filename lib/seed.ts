import { AppData, Exercise, TemplateExercise } from "@/types";
import {
  withExerciseDefaults,
  additionalExercises,
} from "@/lib/exercises/catalog";
export const uid = () => crypto.randomUUID();
const groups: [string, string[]][] = [
  ["Chest", ["Incline Press", "Pec Deck", "Flat Bench Press"]],
  ["Shoulders", ["Shoulder Press", "Lateral Raise", "Reverse Pec Deck"]],
  ["Triceps", ["Triceps Pushdown", "Overhead Triceps Extension"]],
  ["Back", ["Wide-Grip Lat Pulldown", "Neutral-Grip Pulldown", "Seated Row"]],
  ["Biceps", ["Biceps Curl", "Hammer Curl"]],
  ["Quads", ["Leg Press", "Leg Extension"]],
  ["Hamstrings", ["Lying Leg Curl", "Romanian Deadlift"]],
  ["Calves", ["Calf Raise"]],
  ["Core", ["Cable Crunch", "Plank"]],
  ["Glutes", ["Hip Thrust", "Glute Bridge"]],
];
export const library: Exercise[] = [
  ...groups.flatMap(([primaryMuscle, names]) =>
    names.map((name) => ({
      id: name.toLowerCase().replaceAll(" ", "-"),
      name,
      primaryMuscle,
      equipment: /Cable|Pushdown|Pulldown/.test(name)
        ? "Cable"
        : /Curl|Raise/.test(name)
          ? "Dumbbell / machine"
          : "Machine / free weights",
    })),
  ),
  ...additionalExercises,
].map(withExerciseDefaults);
export const target = (exerciseId: string): TemplateExercise => ({
  exerciseId,
  targetSets: 3,
  minReps: 8,
  maxReps: 12,
  minRir: 2,
  maxRir: 3,
});
export function seed(): AppData {
  return {
    version: 1,
    exercises: structuredClone(library),
    templates: [
      {
        id: "push",
        name: "Push",
        exercises: [
          "incline-press",
          "pec-deck",
          "shoulder-press",
          "lateral-raise",
          "triceps-pushdown",
          "overhead-triceps-extension",
        ].map(target),
      },
      {
        id: "pull",
        name: "Pull",
        exercises: [
          "wide-grip-lat-pulldown",
          "neutral-grip-pulldown",
          "seated-row",
          "reverse-pec-deck",
          "biceps-curl",
          "hammer-curl",
        ].map(target),
      },
      {
        id: "legs",
        name: "Legs",
        exercises: [
          "leg-press",
          "lying-leg-curl",
          "romanian-deadlift",
          "leg-extension",
          "calf-raise",
          "cable-crunch",
        ].map(target),
      },
    ],
    sessions: [],
    active: null,
    settings: {
      unit: "kg",
      restSeconds: 90,
      increment: 2.5,
      rir: true,
      autoRest: true,
      sound: false,
      theme: "dark",
    },
    schedule: { days: [null, "push", "pull", "legs", null, "push", "pull"] },
  };
}
