import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { seed, target } from "../lib/seed";
import { storage, validate } from "../lib/storage";
import { withMediaDefaults, safeMediaUrl } from "../lib/exercises/catalog";
import { compare, records } from "../lib/progression";
import { WorkoutExercise } from "../types";

test("old v1 data gains optional media without changing workout snapshots or custom content", () => {
  const old = seed();
  old.exercises = old.exercises
    .filter((e) => !["cable-sldl", "calf-raise-on-leg-press"].includes(e.id))
    .map(({ imageUrl, instructions, secondaryMuscles, ...e }) => e);
  old.exercises.push({
    id: "custom",
    name: "My movement",
    primaryMuscle: "Back",
  });
  const exercise: WorkoutExercise = {
    ...target("incline-press"),
    name: "Incline Press",
    note: "Keep this note",
    skipped: false,
    sets: [
      {
        id: "s1",
        weight: 50,
        reps: 10,
        rir: 2,
        completed: true,
        type: "working",
      },
    ],
  };
  old.sessions = [
    {
      id: "old-session",
      templateId: "push",
      name: "Original name",
      startedAt: "2026-10-01T10:00:00.000Z",
      finishedAt: "2026-10-01T11:00:00.000Z",
      exercises: [exercise],
    },
  ];
  old.active = {
    id: "active-session",
    templateId: "push",
    name: "Unfinished",
    startedAt: "2026-10-04T10:00:00.000Z",
    exercises: [structuredClone(exercise)],
  };
  const snapshot = structuredClone(old);
  const migrated = storage.parse(JSON.stringify(old));
  assert.ok(validate(old));
  assert.deepEqual(migrated.sessions, snapshot.sessions);
  assert.deepEqual(migrated.active, snapshot.active);
  assert.deepEqual(migrated.templates, snapshot.templates);
  assert.deepEqual(migrated.settings, snapshot.settings);
  assert.deepEqual(migrated.schedule, snapshot.schedule);
  assert.ok(migrated.exercises[0].imageUrl);
  assert.equal(
    migrated.exercises.find((e) => e.id === "custom")?.imageUrl,
    undefined,
  );
  assert.deepEqual(old, snapshot);
  assert.deepEqual(
    compare(migrated.active!.exercises[0], migrated.sessions[0].exercises[0]),
    compare(snapshot.active!.exercises[0], snapshot.sessions[0].exercises[0]),
  );
  assert.deepEqual(
    records(migrated.active!.exercises[0], migrated.sessions),
    records(snapshot.active!.exercises[0], snapshot.sessions),
  );
  assert.deepEqual(withMediaDefaults(migrated), migrated);
});
test("global identity reuses media and respects provided custom metadata", () => {
  const data = seed();
  data.templates.push({
    id: "upper",
    name: "Upper",
    exercises: [target("incline-press")],
  });
  const image = data.exercises.find((e) => e.id === "incline-press")!.imageUrl;
  const result = withMediaDefaults(data);
  assert.equal(
    result.exercises.filter((e) => e.id === "incline-press").length,
    1,
  );
  assert.equal(
    result.exercises.find((e) => e.id === "incline-press")!.imageUrl,
    image,
  );
  data.exercises[0].imageUrl = "/my-own.svg";
  data.exercises[0].instructions = ["My cue"];
  assert.equal(withMediaDefaults(data).exercises[0].imageUrl, "/my-own.svg");
  assert.deepEqual(withMediaDefaults(data).exercises[0].instructions, [
    "My cue",
  ]);
});
test("every default exercise has a small local illustration and cues", () => {
  let total = 0;
  for (const e of seed().exercises) {
    assert.ok(e.instructions?.length);
    assert.ok(e.imageUrl?.startsWith("/exercises/"));
    const path = `public${e.imageUrl}`;
    assert.ok(existsSync(path), path);
    const bytes = statSync(path).size;
    assert.ok(bytes < 16000);
    total += bytes;
  }
  assert.ok(total < 250000);
});
test("import validates optional media fields and rejects unsafe media schemes", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,evil",
    "//tracking.test/a.png",
    "/\\tracking.test/a.png",
    "http://insecure.test/a.png",
  ])
    assert.equal(safeMediaUrl(url), undefined);
  assert.equal(
    safeMediaUrl("/exercises/incline-press.svg"),
    "/exercises/incline-press.svg",
  );
  assert.equal(
    safeMediaUrl("https://example.com/demo.webm"),
    "https://example.com/demo.webm",
  );
  const data = seed();
  data.exercises[0].instructions = [42 as unknown as string];
  assert.equal(validate(data), false);
  data.exercises[0].instructions = [];
  data.exercises[0].animationUrl = "javascript:evil";
  assert.equal(validate(data), false);
});
