import { AppData, Exercise, TemplateExercise, WorkoutTemplate } from "@/types";
import { deflateSync, Inflate } from "fflate";

export const SHARE_SCHEMA_VERSION = 1;
export const MAX_SHARE_CODE_LENGTH = 12_000;
export const MAX_COMPRESSED_PAYLOAD_BYTES = 8_000;
export const MAX_DECOMPRESSED_PAYLOAD_BYTES = 12_000;
const SHARE_ID = /^RPU-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CHECKSUM = /^[a-f0-9]{64}$/i;

export interface SharedWorkout { name: string; exercises: TemplateExercise[]; }
export interface WorkoutSharePayload { schema: typeof SHARE_SCHEMA_VERSION; shareId: string; workout: SharedWorkout; }
interface CompactSharePayload { v: typeof SHARE_SCHEMA_VERSION; i: string; w: { n: string; e: [string, number, number, number, number, number][] }; }

export class ShareCodeError extends Error { constructor(message: string) { super(message); this.name = "ShareCodeError"; } }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

const validTarget = (value: unknown): value is TemplateExercise => {
  if (!record(value) || typeof value.exerciseId !== "string") return false;
  const { exerciseId, targetSets, minReps, maxReps, minRir, maxRir } = value;
  return typeof targetSets === "number" && typeof minReps === "number" && typeof maxReps === "number" && typeof minRir === "number" && typeof maxRir === "number" && exerciseId.length > 0 && exerciseId.length <= 100 && [targetSets, minReps, maxReps, minRir, maxRir].every(Number.isInteger) && targetSets > 0 && targetSets <= 99 && minReps > 0 && maxReps >= minReps && maxReps <= 999 && minRir >= 0 && maxRir >= minRir && maxRir <= 10;
};

const cleanWorkout = (value: unknown): SharedWorkout => {
  if (!record(value) || typeof value.name !== "string") throw new ShareCodeError("The workout data is missing its name.");
  const name = value.name.trim();
  if (!name || name.length > 100) throw new ShareCodeError("The workout name is not valid.");
  if (!Array.isArray(value.exercises) || !value.exercises.length) throw new ShareCodeError("The workout needs at least one exercise.");
  if (value.exercises.length > 50) throw new ShareCodeError("This workout has too many exercises to import.");
  if (!value.exercises.every(validTarget)) throw new ShareCodeError("One or more exercise targets are invalid.");
  const exercises = value.exercises.map(({ exerciseId, targetSets, minReps, maxReps, minRir, maxRir }) => ({ exerciseId, targetSets, minReps, maxReps, minRir, maxRir }));
  if (new Set(exercises.map((exercise) => exercise.exerciseId)).size !== exercises.length) throw new ShareCodeError("The workout contains the same exercise more than once.");
  return { name, exercises };
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};
const base64UrlToBytes = (value: string, limit: number) => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new ShareCodeError("The sharing code contains unsupported characters.");
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    if (bytes.byteLength > limit) throw new ShareCodeError("This sharing code is too large to import.");
    return bytes;
  } catch (error) { if (error instanceof ShareCodeError) throw error; throw new ShareCodeError("The sharing code payload could not be read."); }
};
const sha256Bytes = async (value: Uint8Array) => {
  if (!globalThis.crypto?.subtle) throw new ShareCodeError("This browser cannot verify sharing codes.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const joinChunks = (chunks: Uint8Array[], total: number) => {
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
};
const compress = (bytes: Uint8Array) => {
  const compressed = deflateSync(bytes, { level: 9 });
  if (compressed.byteLength > MAX_COMPRESSED_PAYLOAD_BYTES) throw new ShareCodeError("This workout is too large to share.");
  return compressed;
};
const decompress = (bytes: Uint8Array) => {
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    const inflater = new Inflate((chunk) => {
      total += chunk.byteLength;
      if (total > MAX_DECOMPRESSED_PAYLOAD_BYTES) throw new ShareCodeError("This sharing code expands to too much data.");
      chunks.push(chunk);
    });
    inflater.push(bytes, true);
  } catch (error) {
    if (error instanceof ShareCodeError) throw error;
    throw new ShareCodeError("The sharing code payload could not be read.");
  }
  return joinChunks(chunks, total);
};

const compact = (payload: WorkoutSharePayload): CompactSharePayload => ({
  v: payload.schema, i: payload.shareId,
  w: { n: payload.workout.name, e: payload.workout.exercises.map((item) => [item.exerciseId, item.targetSets, item.minReps, item.maxReps, item.minRir, item.maxRir]) },
});
const expand = (value: unknown): WorkoutSharePayload => {
  if (!record(value) || value.v !== SHARE_SCHEMA_VERSION || typeof value.i !== "string" || !record(value.w)) throw new ShareCodeError("The sharing code payload is not valid.");
  if (!SHARE_ID.test(value.i)) throw new ShareCodeError("The sharing code has an invalid share ID.");
  if (typeof value.w.n !== "string" || !Array.isArray(value.w.e)) throw new ShareCodeError("The sharing code payload is not valid.");
  const exercises = value.w.e.map((item) => {
    if (!Array.isArray(item) || item.length !== 6) throw new ShareCodeError("One or more exercise targets are invalid.");
    const [exerciseId, targetSets, minReps, maxReps, minRir, maxRir] = item;
    return { exerciseId, targetSets, minReps, maxReps, minRir, maxRir };
  });
  return { schema: SHARE_SCHEMA_VERSION, shareId: value.i, workout: cleanWorkout({ name: value.w.n, exercises }) };
};
const parseJson = (text: string) => { try { return JSON.parse(text) as unknown; } catch { throw new ShareCodeError("The sharing code does not contain valid workout data."); } };
const parseLegacyPayload = (value: unknown): WorkoutSharePayload => {
  if (!record(value)) throw new ShareCodeError("The sharing code payload is not valid.");
  if (value.schema !== SHARE_SCHEMA_VERSION) throw new ShareCodeError("This sharing code uses an unsupported version.");
  if (typeof value.shareId !== "string" || !SHARE_ID.test(value.shareId)) throw new ShareCodeError("The sharing code has an invalid share ID.");
  return { schema: SHARE_SCHEMA_VERSION, shareId: value.shareId, workout: cleanWorkout(value.workout) };
};

export const createShareId = () => { const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; const bytes = crypto.getRandomValues(new Uint8Array(8)); const text = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(""); return `RPU-${text.slice(0, 4)}-${text.slice(4)}`; };
export const createSharePayload = (template: WorkoutTemplate, shareId = createShareId()): WorkoutSharePayload => {
  if (!SHARE_ID.test(shareId)) throw new ShareCodeError("The sharing ID is invalid.");
  return { schema: SHARE_SCHEMA_VERSION, shareId, workout: cleanWorkout(template) };
};

/** RPU1 checksums the uncompressed UTF-8 JSON bytes. Kept only for compatibility tests. */
export const encodeLegacyShareCode = async (payload: WorkoutSharePayload) => {
  const safePayload = createSharePayload({ id: "portable", ...payload.workout }, payload.shareId);
  const bytes = new TextEncoder().encode(JSON.stringify(safePayload));
  return `RPU1.${bytesToBase64Url(bytes)}.${await sha256Bytes(bytes)}`;
};
/** RPU2: base64url(deflate(compact UTF-8 JSON)); SHA-256 checks compressed bytes before decompression. */
export const encodeShareCode = async (payload: WorkoutSharePayload) => {
  const safePayload = createSharePayload({ id: "portable", ...payload.workout }, payload.shareId);
  const compressed = compress(new TextEncoder().encode(JSON.stringify(compact(safePayload))));
  return `RPU2.${bytesToBase64Url(compressed)}.${await sha256Bytes(compressed)}`;
};
export const decodeShareCode = async (raw: string): Promise<WorkoutSharePayload> => {
  const normalized = raw.replaceAll(/\s/g, "");
  if (!normalized) throw new ShareCodeError("Paste a sharing code to continue.");
  if (normalized.length > MAX_SHARE_CODE_LENGTH) throw new ShareCodeError("This sharing code is too large to import.");
  const [prefix, encoded, checksum, ...rest] = normalized.split(".");
  if (!encoded || !checksum || rest.length) throw new ShareCodeError("This is not a valid RepUp sharing code.");
  if (prefix !== "RPU1" && prefix !== "RPU2") throw new ShareCodeError("This sharing code uses an unsupported version.");
  if (!CHECKSUM.test(checksum)) throw new ShareCodeError("The sharing code checksum is not valid.");
  const payloadBytes = base64UrlToBytes(encoded, MAX_COMPRESSED_PAYLOAD_BYTES);
  if ((await sha256Bytes(payloadBytes)) !== checksum.toLowerCase()) throw new ShareCodeError("This sharing code was changed or corrupted.");
  if (prefix === "RPU1") return parseLegacyPayload(parseJson(new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes)));
  return expand(parseJson(new TextDecoder("utf-8", { fatal: true }).decode(decompress(payloadBytes))));
};

export const sameSharedWorkout = (template: WorkoutTemplate, shared: SharedWorkout) => template.name.trim().toLocaleLowerCase() === shared.name.toLocaleLowerCase() && JSON.stringify(template.exercises) === JSON.stringify(shared.exercises);
export const missingExerciseIds = (workout: SharedWorkout, exercises: Pick<Exercise, "id">[]) => { const available = new Set(exercises.map((exercise) => exercise.id)); return workout.exercises.map((exercise) => exercise.exerciseId).filter((id) => !available.has(id)); };
export const importSharedWorkout = (data: AppData, payload: WorkoutSharePayload, templateId: string) => {
  const missing = missingExerciseIds(payload.workout, data.exercises);
  if (missing.length) throw new ShareCodeError(`This device is missing: ${missing.join(", ")}. Import was not changed.`);
  const duplicate = !!data.importedShares?.includes(payload.shareId) || data.templates.some((template) => sameSharedWorkout(template, payload.workout));
  const existingNames = new Set(data.templates.map((template) => template.name.toLocaleLowerCase())); const baseName = payload.workout.name; let name = baseName; let copyNumber = 2;
  while (existingNames.has(name.toLocaleLowerCase())) { name = `${baseName} (${copyNumber})`; copyNumber += 1; }
  const template: WorkoutTemplate = { id: templateId, name, exercises: structuredClone(payload.workout.exercises) };
  return { duplicate, template, data: { ...data, templates: [...data.templates, template], importedShares: [...(data.importedShares || []).filter((id) => id !== payload.shareId), payload.shareId].slice(-200) } };
};
