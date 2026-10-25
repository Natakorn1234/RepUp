import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, target } from "../lib/seed";
import { deflateSync } from "fflate";
import {
  createSharePayload, decodeShareCode, encodeLegacyShareCode, encodeShareCode,
  importSharedWorkout, MAX_DECOMPRESSED_PAYLOAD_BYTES, MAX_SHARE_CODE_LENGTH,
  missingExerciseIds, sameSharedWorkout, ShareCodeError,
} from "../lib/workout-share";

const workout = { id: "local-template", name: "Shared Upper", exercises: [{ ...target("incline-press"), targetSets: 2 }, { ...target("wide-grip-lat-pulldown"), targetSets: 3 }] };
const shareId = "RPU-7K9X-M2QP";
const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const sha256 = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes))), (byte) => byte.toString(16).padStart(2, "0")).join("");
const deflate = (bytes: Uint8Array) => deflateSync(bytes);

test("RPU2 codes round trip the full template configuration", async () => {
  const payload = createSharePayload(workout, shareId);
  const code = await encodeShareCode(payload);
  const decoded = await decodeShareCode(`  ${code.slice(0, 18)}\n${code.slice(18)}  `);
  assert.equal(decoded.shareId, shareId);
  assert.deepEqual(decoded.workout, { name: workout.name, exercises: workout.exercises });
  assert.ok(code.startsWith("RPU2."));
});

test("legacy RPU1 codes remain importable", async () => {
  const legacy = await encodeLegacyShareCode(createSharePayload(workout, shareId));
  assert.ok(legacy.startsWith("RPU1."));
  assert.deepEqual(await decodeShareCode(legacy), createSharePayload(workout, shareId));
});

test("compressed codes are shorter for representative workouts", async (t) => {
  const examples = [workout, seed().templates.find((template) => template.name === "Upper")!];
  for (const example of examples) {
    const payload = createSharePayload(example, shareId);
    const [legacy, compressed] = await Promise.all([encodeLegacyShareCode(payload), encodeShareCode(payload)]);
    t.diagnostic(`${example.name}: RPU1 ${legacy.length} chars → RPU2 ${compressed.length} chars (${legacy.length - compressed.length} fewer)`);
    assert.ok(compressed.length < legacy.length);
  }
});

test("corrupted compressed payloads fail checksum validation before decompression", async () => {
  const code = await encodeShareCode(createSharePayload(workout, shareId));
  const parts = code.split(".");
  parts[1] = `${parts[1].slice(0, -1)}${parts[1].endsWith("A") ? "B" : "A"}`;
  await assert.rejects(() => decodeShareCode(parts.join(".")), ShareCodeError);
});

test("codes reject unsupported versions and invalid targets", async () => {
  await assert.rejects(() => decodeShareCode("RPU3.payload.1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"), ShareCodeError);
  assert.throws(() => createSharePayload({ ...workout, exercises: [{ ...target("incline-press"), minReps: 12, maxReps: 8 }] }, shareId), ShareCodeError);
});

test("compressed input and decompression output limits are enforced", async () => {
  await assert.rejects(() => decodeShareCode(`RPU2.${"A".repeat(MAX_SHARE_CODE_LENGTH)}.1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`), ShareCodeError);
  const tooLarge = new TextEncoder().encode(JSON.stringify({ v: 1, i: shareId, w: { n: "X".repeat(MAX_DECOMPRESSED_PAYLOAD_BYTES + 1), e: [] } }));
  const compressed = deflate(tooLarge);
  const oversizedCode = `RPU2.${toBase64Url(compressed)}.${await sha256(compressed)}`;
  await assert.rejects(() => decodeShareCode(oversizedCode), ShareCodeError);
});

test("equivalent templates are detected without mutating either template", () => {
  const shared = createSharePayload(workout, shareId).workout;
  assert.equal(sameSharedWorkout(workout, shared), true);
  assert.equal(sameSharedWorkout({ ...workout, name: "Other" }, shared), false);
});

test("import creates a separate template and preserves existing user data", () => {
  const data = seed(); const before = structuredClone(data); const payload = createSharePayload(workout, shareId);
  const result = importSharedWorkout(data, payload, "new-local-id");
  assert.deepEqual(data, before); assert.equal(result.template.id, "new-local-id");
  assert.equal(result.data.templates.length, before.templates.length + 1); assert.deepEqual(result.data.sessions, before.sessions);
  assert.deepEqual(result.data.settings, before.settings); assert.deepEqual(result.data.importedShares, [payload.shareId]);
  const copied = importSharedWorkout(result.data, payload, "another-local-id");
  assert.equal(copied.duplicate, true); assert.equal(copied.template.name, "Shared Upper (2)");
});

test("unknown exercises are reported before import without changing data", () => {
  const data = seed(); const payload = createSharePayload({ ...workout, exercises: [{ ...target("missing-exercise") }] }, shareId);
  assert.deepEqual(missingExerciseIds(payload.workout, data.exercises), ["missing-exercise"]);
  assert.throws(() => importSharedWorkout(data, payload, "new-local-id"), ShareCodeError);
  assert.equal(data.templates.some((template) => template.id === "new-local-id"), false);
});
