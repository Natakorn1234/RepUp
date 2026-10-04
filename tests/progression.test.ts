import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, records, suggestion } from "../lib/progression";
import { e1rm, previous, displayWeight, toKg } from "../lib/calculations";
import { seed, target } from "../lib/seed";
import { validate, storage } from "../lib/storage";
import { WorkoutExercise, WorkoutSession } from "../types";
const exercise = (reps: number[], weight = 50, rir = 2): WorkoutExercise => ({
  ...target("incline-press"),
  name: "Incline Press",
  note: "",
  skipped: false,
  sets: reps.map((r, i) => ({
    id: String(i),
    weight,
    reps: r,
    rir,
    completed: true,
    type: "working",
  })),
});
const session = (
  e: WorkoutExercise,
  date = "2026-10-01T10:00:00.000Z",
): WorkoutSession => ({
  id: date,
  templateId: "push",
  name: "Push",
  startedAt: date,
  finishedAt: date,
  exercises: [e],
});
test("more reps at matching load and effort progresses", () =>
  assert.equal(
    compare(exercise([11, 10, 9]), exercise([10, 9, 8])).detail,
    "+3 total reps",
  ));
test("increased load inside rep range progresses", () =>
  assert.equal(
    compare(exercise([9], 52.5), exercise([12])).status,
    "progressed",
  ));
test("more weight outside rep range does not progress", () =>
  assert.notEqual(
    compare(exercise([5], 55), exercise([12])).status,
    "progressed",
  ));
test("harder effort does not automatically progress", () =>
  assert.notEqual(
    compare(exercise([11], 50, 0), exercise([10], 50, 3)).status,
    "progressed",
  ));
test("extra sets do not automatically progress", () =>
  assert.notEqual(
    compare(exercise([10, 10]), exercise([10])).status,
    "progressed",
  ));
test("improved RIR at identical work progresses", () =>
  assert.equal(
    compare(exercise([10], 50, 3), exercise([10], 50, 2)).status,
    "progressed",
  ));
test("lower reps are contextualized conservatively", () =>
  assert.equal(compare(exercise([9]), exercise([10])).status, "below"));
test("suggest load only at complete rep and RIR targets", () => {
  assert.equal(suggestion(exercise([12, 12, 12])), "load");
  assert.equal(suggestion(exercise([12, 12, 12], 50, 0)), "rep");
});
test("warmups and skipped sets excluded", () => {
  const e = exercise([15]);
  e.sets[0].type = "warmup";
  assert.equal(compare(e, exercise([10])).status, "baseline");
  e.skipped = true;
  assert.deepEqual(records(e, [session(exercise([10]))]), []);
});
test("epley excludes high rep sets", () => {
  assert.equal(e1rm(exercise([30]).sets[0]), 0);
  assert.equal(e1rm(exercise([10], 60).sets[0]), 80);
});
test("previous performance is latest completed eligible exercise", () => {
  const old = session(exercise([8]));
  const recent = session(exercise([9]), "2026-10-02T10:00:00.000Z");
  assert.equal(
    previous([old, recent], "incline-press", "2026-10-03T00:00:00.000Z")
      ?.sets[0].reps,
    9,
  );
});
test("PRs compare against earlier history", () => {
  assert.ok(
    records(exercise([11]), [session(exercise([10]))]).includes("Rep PR"),
  );
  assert.deepEqual(records(exercise([10]), []), []);
});
test("units convert without mutating canonical weights", () =>
  assert.ok(Math.abs(toKg(displayWeight(50, "lb"), "lb") - 50) < 0.01));
test("seed and backup round trip are valid", () => {
  const d = seed();
  assert.ok(validate(d));
  assert.deepEqual(storage.parse(storage.export(d)), d);
});
test("malformed backup is rejected before replacement", () => {
  assert.equal(validate({ version: 1 }), false);
  assert.throws(() => storage.parse("{bad"));
  const d = seed();
  d.settings.restSeconds = -10;
  assert.equal(validate(d), false);
});
test("invalid sets, schedules, versions, and references rejected", () => {
  for (const mutate of [
    (d: ReturnType<typeof seed>) => {
      d.version = 2 as 1;
    },
    (d: ReturnType<typeof seed>) => {
      d.schedule.days[0] = "missing";
    },
    (d: ReturnType<typeof seed>) => {
      d.templates[0].exercises[0].exerciseId = "missing";
    },
    (d: ReturnType<typeof seed>) => {
      d.sessions = [session(exercise([1.5]))];
    },
  ]) {
    const d = seed();
    mutate(d);
    assert.equal(validate(d), false);
  }
});
