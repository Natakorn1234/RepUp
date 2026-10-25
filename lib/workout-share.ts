import { AppData, Exercise, TemplateExercise, WorkoutTemplate } from "@/types";

export const SHARE_SCHEMA_VERSION = 1;
export const MAX_SHARE_CODE_LENGTH = 12_000;
const MAX_PAYLOAD_BYTES = 8_000;
const SHARE_ID = /^RPU-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CHECKSUM = /^[a-f0-9]{64}$/i;

export interface SharedWorkout {
  name: string;
  exercises: TemplateExercise[];
}

export interface WorkoutSharePayload {
  schema: typeof SHARE_SCHEMA_VERSION;
  shareId: string;
  workout: SharedWorkout;
}

export class ShareCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShareCodeError";
  }
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const validTarget = (value: unknown): value is TemplateExercise => {
  if (!record(value) || typeof value.exerciseId !== "string") return false;
  const { exerciseId, targetSets, minReps, maxReps, minRir, maxRir } = value;
  return (
    exerciseId.length > 0 &&
    exerciseId.length <= 100 &&
    [targetSets, minReps, maxReps, minRir, maxRir].every(
      (number) => typeof number === "number" && Number.isInteger(number),
    ) &&
    typeof targetSets === "number" &&
    typeof minReps === "number" &&
    typeof maxReps === "number" &&
    typeof minRir === "number" &&
    typeof maxRir === "number" &&
    targetSets > 0 &&
    targetSets <= 99 &&
    minReps > 0 &&
    maxReps >= minReps &&
    maxReps <= 999 &&
    minRir >= 0 &&
    maxRir >= minRir &&
    maxRir <= 10
  );
};

const cleanWorkout = (value: unknown): SharedWorkout => {
  if (!record(value) || typeof value.name !== "string")
    throw new ShareCodeError("The workout data is missing its name.");
  const name = value.name.trim();
  if (!name || name.length > 100)
    throw new ShareCodeError("The workout name is not valid.");
  if (!Array.isArray(value.exercises) || !value.exercises.length)
    throw new ShareCodeError("The workout needs at least one exercise.");
  if (value.exercises.length > 50)
    throw new ShareCodeError("This workout has too many exercises to import.");
  if (!value.exercises.every(validTarget))
    throw new ShareCodeError("One or more exercise targets are invalid.");
  const exercises = value.exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    targetSets: exercise.targetSets,
    minReps: exercise.minReps,
    maxReps: exercise.maxReps,
    minRir: exercise.minRir,
    maxRir: exercise.maxRir,
  }));
  if (new Set(exercises.map((exercise) => exercise.exerciseId)).size !== exercises.length)
    throw new ShareCodeError("The workout contains the same exercise more than once.");
  return { name, exercises };
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const base64UrlToText = (value: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new ShareCodeError("The sharing code contains unsupported characters.");
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    if (bytes.byteLength > MAX_PAYLOAD_BYTES)
      throw new ShareCodeError("This sharing code is too large to import.");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof ShareCodeError) throw error;
    throw new ShareCodeError("The sharing code payload could not be read.");
  }
};

const sha256 = async (value: string) => {
  if (!globalThis.crypto?.subtle)
    throw new ShareCodeError("This browser cannot verify sharing codes.");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const createShareId = () => {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const text = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `RPU-${text.slice(0, 4)}-${text.slice(4)}`;
};

export const createSharePayload = (
  template: WorkoutTemplate,
  shareId = createShareId(),
): WorkoutSharePayload => {
  if (!SHARE_ID.test(shareId)) throw new ShareCodeError("The sharing ID is invalid.");
  return {
    schema: SHARE_SCHEMA_VERSION,
    shareId,
    workout: cleanWorkout(template),
  };
};

export const encodeShareCode = async (payload: WorkoutSharePayload) => {
  const safePayload = createSharePayload(
    { id: "portable", ...payload.workout },
    payload.shareId,
  );
  const json = JSON.stringify(safePayload);
  const encoded = bytesToBase64Url(new TextEncoder().encode(json));
  const checksum = await sha256(json);
  return `RPU1.${encoded}.${checksum}`;
};

export const decodeShareCode = async (raw: string): Promise<WorkoutSharePayload> => {
  const normalized = raw.replaceAll(/\s/g, "");
  if (!normalized) throw new ShareCodeError("Paste a sharing code to continue.");
  if (normalized.length > MAX_SHARE_CODE_LENGTH)
    throw new ShareCodeError("This sharing code is too large to import.");
  const [prefix, encoded, checksum, ...rest] = normalized.split(".");
  if (prefix !== "RPU1" || !encoded || !checksum || rest.length)
    throw new ShareCodeError("This is not a valid RepUp sharing code.");
  if (!CHECKSUM.test(checksum))
    throw new ShareCodeError("The sharing code checksum is not valid.");
  const json = base64UrlToText(encoded);
  if ((await sha256(json)) !== checksum.toLowerCase())
    throw new ShareCodeError("This sharing code was changed or corrupted.");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ShareCodeError("The sharing code does not contain valid workout data.");
  }
  if (!record(value)) throw new ShareCodeError("The sharing code payload is not valid.");
  if (value.schema !== SHARE_SCHEMA_VERSION)
    throw new ShareCodeError("This sharing code uses an unsupported version.");
  if (typeof value.shareId !== "string" || !SHARE_ID.test(value.shareId))
    throw new ShareCodeError("The sharing code has an invalid share ID.");
  return {
    schema: SHARE_SCHEMA_VERSION,
    shareId: value.shareId,
    workout: cleanWorkout(value.workout),
  };
};

export const sameSharedWorkout = (template: WorkoutTemplate, shared: SharedWorkout) =>
  template.name.trim().toLocaleLowerCase() === shared.name.toLocaleLowerCase() &&
  JSON.stringify(template.exercises) === JSON.stringify(shared.exercises);

export const missingExerciseIds = (
  workout: SharedWorkout,
  exercises: Pick<Exercise, "id">[],
) => {
  const available = new Set(exercises.map((exercise) => exercise.id));
  return workout.exercises
    .map((exercise) => exercise.exerciseId)
    .filter((id) => !available.has(id));
};

export const importSharedWorkout = (
  data: AppData,
  payload: WorkoutSharePayload,
  templateId: string,
) => {
  const missing = missingExerciseIds(payload.workout, data.exercises);
  if (missing.length)
    throw new ShareCodeError(`This device is missing: ${missing.join(", ")}. Import was not changed.`);
  const duplicate =
    !!data.importedShares?.includes(payload.shareId) ||
    data.templates.some((template) => sameSharedWorkout(template, payload.workout));
  const existingNames = new Set(
    data.templates.map((template) => template.name.toLocaleLowerCase()),
  );
  const baseName = payload.workout.name;
  let name = baseName;
  let copyNumber = 2;
  while (existingNames.has(name.toLocaleLowerCase())) {
    name = `${baseName} (${copyNumber})`;
    copyNumber += 1;
  }
  const template: WorkoutTemplate = {
    id: templateId,
    name,
    exercises: structuredClone(payload.workout.exercises),
  };
  return {
    duplicate,
    template,
    data: {
      ...data,
      templates: [...data.templates, template],
      importedShares: [
        ...(data.importedShares || []).filter((id) => id !== payload.shareId),
        payload.shareId,
      ].slice(-200),
    },
  };
};
