import { AppData } from "@/types";
import { seed } from "@/lib/seed";
import { accentThemes } from '@/lib/theme';
import { withMediaDefaults, safeMediaUrl } from "@/lib/exercises/catalog";
const KEY = "repup:data:v1";
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const str = (v: unknown) => typeof v === "string" && v.length > 0;
function target(v: unknown): boolean {
  return (
    obj(v) &&
    str(v.exerciseId) &&
    num(v.targetSets) &&
    Number.isInteger(v.targetSets) &&
    Number(v.targetSets) > 0 &&
    Number(v.targetSets) <= 99 &&
    num(v.minReps) &&
    num(v.maxReps) &&
    Number.isInteger(v.minReps) &&
    Number.isInteger(v.maxReps) &&
    Number(v.minReps) >= 1 &&
    Number(v.maxReps) <= 999 &&
    Number(v.maxReps) >= Number(v.minReps) &&
    num(v.minRir) &&
    num(v.maxRir) &&
    Number(v.maxRir) <= 10 &&
    Number(v.maxRir) >= Number(v.minRir)
  );
}
function session(v: unknown): boolean {
  return (
    obj(v) &&
    str(v.id) &&
    str(v.templateId) &&
    str(v.name) &&
    typeof v.startedAt === "string" &&
    Number.isFinite(Date.parse(v.startedAt)) &&
    (v.finishedAt === undefined ||
      (typeof v.finishedAt === "string" &&
        Number.isFinite(Date.parse(v.finishedAt)) &&
        Date.parse(v.finishedAt) >= Date.parse(v.startedAt))) &&
    Array.isArray(v.exercises) &&
    new Set(v.exercises.map((e) => (obj(e) ? e.exerciseId : null))).size ===
      v.exercises.length &&
    v.exercises.every(
      (e) =>
        target(e) &&
        obj(e) &&
        str(e.name) &&
        typeof e.note === "string" &&
        typeof e.skipped === "boolean" &&
        Array.isArray(e.sets) &&
        new Set(e.sets.map((s) => (obj(s) ? s.id : null))).size ===
          e.sets.length &&
        e.sets.every(
          (s) =>
            obj(s) &&
            str(s.id) &&
            num(s.weight) &&
            num(s.reps) &&
            Number.isInteger(s.reps) &&
            (!s.completed || Number(s.reps) > 0) &&
            (s.rir === undefined || (num(s.rir) && Number(s.rir) <= 10)) &&
            typeof s.completed === "boolean" &&
            ["working", "warmup"].includes(String(s.type)),
        ),
    )
  );
}
export function validate(v: unknown): v is AppData {
  if (
    !obj(v) ||
    v.version !== 1 ||
    !Array.isArray(v.exercises) ||
    !Array.isArray(v.templates) ||
    !Array.isArray(v.sessions) ||
    !obj(v.settings) ||
    !obj(v.schedule)
  )
    return false;
  const s = v.settings;
  const ids = v.exercises.map((e) => (obj(e) ? e.id : null));
  const templateIds = v.templates.map((t) => (obj(t) ? t.id : null));
  return (
    v.exercises.every(
      (e) =>
        obj(e) &&
        str(e.id) &&
        str(e.name) &&
        str(e.primaryMuscle) &&
        (e.equipment === undefined || typeof e.equipment === "string") &&
        (e.imageUrl === undefined ||
          (typeof e.imageUrl === "string" && !!safeMediaUrl(e.imageUrl))) &&
        (e.animationUrl === undefined ||
          (typeof e.animationUrl === "string" &&
            !!safeMediaUrl(e.animationUrl))) &&
        (e.instructions === undefined ||
          (Array.isArray(e.instructions) && e.instructions.every(str))) &&
        (e.secondaryMuscles === undefined ||
          (Array.isArray(e.secondaryMuscles) && e.secondaryMuscles.every(str))),
    ) &&
    new Set(ids).size === ids.length &&
    new Set(templateIds).size === templateIds.length &&
    v.templates.every(
      (t) =>
        obj(t) &&
        str(t.id) &&
        str(t.name) &&
        Array.isArray(t.exercises) &&
        new Set(t.exercises.map((e) => (obj(e) ? e.exerciseId : null))).size ===
          t.exercises.length &&
        t.exercises.every(
          (e) => target(e) && obj(e) && ids.includes(e.exerciseId),
        ),
    ) &&
    v.sessions.every((s) => session(s) && obj(s) && !!s.finishedAt) &&
    new Set(v.sessions.map((s) => (obj(s) ? s.id : null))).size ===
      v.sessions.length &&
    (v.active === null ||
      (session(v.active) && obj(v.active) && !v.active.finishedAt)) &&
    ["kg", "lb"].includes(String(s.unit)) &&
    ["dark", "light"].includes(String(s.theme)) &&
    (s.accentColor === undefined || (typeof s.accentColor === 'string' && Object.hasOwn(accentThemes,s.accentColor))) &&
    (s.avatarUrl === undefined || (typeof s.avatarUrl === 'string' && s.avatarUrl.length <= 150000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(s.avatarUrl))) &&
    num(s.restSeconds) &&
    Number(s.restSeconds) <= 3600 &&
    num(s.increment) &&
    Number(s.increment) > 0 &&
    typeof s.rir === "boolean" &&
    typeof s.autoRest === "boolean" &&
    typeof s.sound === "boolean" &&
    Array.isArray(v.schedule.days) &&
    v.schedule.days.length === 7 &&
    v.schedule.days.every((d) => d === null || templateIds.includes(d))
  );
}
export const storage = {
  load(): { data: AppData; error?: string } {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { data: seed() };
      const data: unknown = JSON.parse(raw);
      if (!validate(data)) throw Error();
      return { data: withMediaDefaults(data) };
    } catch {
      return {
        data: seed(),
        error:
          "Saved data could not be read. The original is preserved until you confirm replacement.",
      };
    }
  },
  save(data: AppData) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
  export(data: AppData) {
    return JSON.stringify(data, null, 2);
  },
  original() {
    return localStorage.getItem(KEY);
  },
  parse(raw: string) {
    const data: unknown = JSON.parse(raw);
    if (!validate(data))
      throw Error("Invalid RepUp backup or unsupported schema version.");
    return withMediaDefaults(data);
  },
};
