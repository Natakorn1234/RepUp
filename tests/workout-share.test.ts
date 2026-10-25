import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, target } from "../lib/seed";
import {
  createSharePayload,
  decodeShareCode,
  encodeShareCode,
  importSharedWorkout,
  missingExerciseIds,
  sameSharedWorkout,
  ShareCodeError,
} from "../lib/workout-share";

const workout = {
  id: "local-template",
  name: "Shared Upper",
  exercises: [
    { ...target("incline-press"), targetSets: 2 },
    { ...target("wide-grip-lat-pulldown"), targetSets: 3 },
  ],
};

test("workout share codes round trip the full template configuration", async () => {
  const payload = createSharePayload(workout, "RPU-7K9X-M2QP");
  const code = await encodeShareCode(payload);
  const decoded = await decodeShareCode(`  ${code.slice(0, 18)}\n${code.slice(18)}  `);
  assert.equal(decoded.shareId, "RPU-7K9X-M2QP");
  assert.deepEqual(decoded.workout, { name: workout.name, exercises: workout.exercises });
  assert.ok(code.startsWith("RPU1."));
});

test("corrupted share codes fail checksum validation before import", async () => {
  const code = await encodeShareCode(createSharePayload(workout, "RPU-7K9X-M2QP"));
  const parts = code.split(".");
  parts[1] = `${parts[1].slice(0, -1)}${parts[1].endsWith("A") ? "B" : "A"}`;
  await assert.rejects(() => decodeShareCode(parts.join(".")), ShareCodeError);
});

test("share codes reject unsupported schema and invalid workout targets", async () => {
  await assert.rejects(() => decodeShareCode("RPU1.bad.1234567890abcdef"), ShareCodeError);
  assert.throws(
    () => createSharePayload({ ...workout, exercises: [{ ...target("incline-press"), minReps: 12, maxReps: 8 }] }, "RPU-7K9X-M2QP"),
    ShareCodeError,
  );
});

test("equivalent templates are detected without mutating either template", () => {
  const shared = createSharePayload(workout, "RPU-7K9X-M2QP").workout;
  assert.equal(sameSharedWorkout(workout, shared), true);
  assert.equal(sameSharedWorkout({ ...workout, name: "Other" }, shared), false);
});

test("import creates a separate template and preserves existing user data", () => {
  const data = seed();
  const before = structuredClone(data);
  const payload = createSharePayload(workout, "RPU-7K9X-M2QP");
  const result = importSharedWorkout(data, payload, "new-local-id");
  assert.deepEqual(data, before);
  assert.equal(result.template.id, "new-local-id");
  assert.equal(result.data.templates.length, before.templates.length + 1);
  assert.deepEqual(result.data.sessions, before.sessions);
  assert.deepEqual(result.data.settings, before.settings);
  assert.deepEqual(result.data.importedShares, [payload.shareId]);
  const copied = importSharedWorkout(result.data, payload, "another-local-id");
  assert.equal(copied.duplicate, true);
  assert.equal(copied.template.name, "Shared Upper (2)");
});

test("unknown exercises are reported before import without changing data", () => {
  const data = seed();
  const payload = createSharePayload(
    { ...workout, exercises: [{ ...target("missing-exercise") }] },
    "RPU-7K9X-M2QP",
  );
  assert.deepEqual(missingExerciseIds(payload.workout, data.exercises), ["missing-exercise"]);
  assert.throws(() => importSharedWorkout(data, payload, "new-local-id"), ShareCodeError);
  assert.equal(data.templates.some((template) => template.id === "new-local-id"), false);
});
