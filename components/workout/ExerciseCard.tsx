import { Check, Plus, Trash2, ChevronDown, Trophy, Minus } from "lucide-react";
import {
  Exercise,
  WorkoutExercise,
  UserSettings,
  WorkoutSession,
} from "@/types";
import { DemoButton } from "@/components/exercises/ExerciseDemo";
import { displayWeight, toKg, working } from "@/lib/calculations";
import { compare, records, suggestion } from "@/lib/progression";
import { uid } from "@/lib/seed";
export default function ExerciseCard({
  exercise: e,
  last,
  settings: s,
  onChange,
  onComplete,
  index,
  history,
  definition,
}: {
  exercise: WorkoutExercise;
  last?: WorkoutExercise;
  settings: UserSettings;
  onChange: (e: WorkoutExercise) => void;
  onComplete: () => void;
  index: number;
  history: WorkoutSession[];
  definition?: Exercise;
}) {
  const update = (id: string, patch: object) =>
    onChange({
      ...e,
      sets: e.sets.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  const result = compare(e, last);
  const prs = records(e, history);
  return (
    <article className={`exercise-card ${e.skipped ? "skipped" : ""}`}>
      <div className="exercise-heading">
        <span className="exercise-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="exercise-title-row">
            <h3>{e.name}</h3>
            {definition && <DemoButton exercise={definition} />}
          </div>
          <p>
            {e.targetSets} sets <b>·</b> {e.minReps}–{e.maxReps} reps{" "}
            {s.rir && (
              <>
                {" "}
                <b>·</b> RIR {e.minRir}–{e.maxRir}
              </>
            )}
          </p>
        </div>
        <button
          className="icon-btn"
          aria-label={e.skipped ? "Restore exercise" : "Skip exercise"}
          onClick={() => onChange({ ...e, skipped: !e.skipped })}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      {!e.skipped && (
        <>
          {last && (
            <div className="target-hint">
              <span>↗</span>
              <div>
                {suggestion({
                  ...last,
                  ...{
                    targetSets: e.targetSets,
                    minReps: e.minReps,
                    maxReps: e.maxReps,
                    minRir: e.minRir,
                    maxRir: e.maxRir,
                  },
                }) === "load" ? (
                  <>
                    Rep target reached. Consider{" "}
                    {displayWeight(working(last)[0].weight, s.unit)} →{" "}
                    {Math.round(
                      (displayWeight(working(last)[0].weight, s.unit) +
                        s.increment) *
                        100,
                    ) / 100}{" "}
                    {s.unit} next time.
                  </>
                ) : (
                  <>
                    Optional target ·{" "}
                    {working(last)
                      .map(
                        (set) =>
                          `${displayWeight(set.weight, s.unit)} × ${Math.min(e.maxReps, set.reps + 1)}`,
                      )
                      .join(" / ")}
                    <small className="target-caption">
                      Try +1 rep, keeping a similar RIR. No need to force it.
                    </small>
                  </>
                )}
              </div>
            </div>
          )}
          <div className={`set-grid set-labels ${s.rir ? "" : "no-rir"}`}>
            <span>SET</span>
            <span>PREVIOUS</span>
            <span>{s.unit.toUpperCase()}</span>
            <span>REPS</span>
            {s.rir && <span>RIR</span>}
            <span>✓</span>
          </div>
          {e.sets.map((set, i) => {
            const workingIndex = e.sets
              .slice(0, i)
              .filter((s) => s.type === "working").length;
            const old =
              last && set.type === "working"
                ? working(last)[workingIndex]
                : undefined;
            return (
              <div
                key={set.id}
                className={`set-grid ${s.rir ? "" : "no-rir"} ${set.completed ? "set-done" : ""}`}
              >
                <button
                  title="Toggle warmup / working"
                  className="set-number"
                  onClick={() =>
                    update(set.id, {
                      type: set.type === "working" ? "warmup" : "working",
                    })
                  }
                >
                  {set.type === "warmup" ? "W" : i + 1}
                </button>
                <span className="previous">
                  {old
                    ? `${displayWeight(old.weight, s.unit)} × ${old.reps}`
                    : "—"}
                  {old?.rir !== undefined && s.rir && <small>@{old.rir}</small>}
                </span>
                <input
                  aria-label={`${e.name} set ${i + 1} weight`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={displayWeight(set.weight, s.unit) || ""}
                  placeholder="0"
                  onChange={(ev) =>
                    update(set.id, {
                      weight: toKg(
                        Math.max(0, Number(ev.target.value)),
                        s.unit,
                      ),
                      completed: false,
                    })
                  }
                />
                <input
                  aria-label={`${e.name} set ${i + 1} reps`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="999"
                  value={set.reps || ""}
                  placeholder="0"
                  onChange={(ev) =>
                    update(set.id, {
                      reps: Math.max(0, Math.floor(Number(ev.target.value))),
                      completed: false,
                    })
                  }
                />
                {s.rir && (
                  <input
                    aria-label={`${e.name} set ${i + 1} RIR`}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="10"
                    value={set.rir ?? ""}
                    placeholder="–"
                    onChange={(ev) =>
                      update(set.id, {
                        rir:
                          ev.target.value === ""
                            ? undefined
                            : Math.min(
                                10,
                                Math.max(0, Number(ev.target.value)),
                              ),
                        completed: false,
                      })
                    }
                  />
                )}
                <button
                  className={`complete-set ${set.completed ? "checked" : ""}`}
                  aria-label={set.completed ? "Uncomplete set" : "Complete set"}
                  onClick={() => {
                    if (!set.completed && set.reps < 1) return;
                    update(set.id, { completed: !set.completed });
                    if (!set.completed) onComplete();
                  }}
                >
                  <Check size={18} />
                </button>
              </div>
            );
          })}
          <div className="set-actions">
            <button
              className="text-btn"
              onClick={() =>
                onChange({
                  ...e,
                  sets: [
                    ...e.sets,
                    {
                      id: uid(),
                      weight: e.sets.at(-1)?.weight || 0,
                      reps: 0,
                      completed: false,
                      type: "working",
                    },
                  ],
                })
              }
            >
              <Plus size={15} /> Add set
            </button>
            <button
              className="text-btn muted"
              disabled={!e.sets.length}
              onClick={() => {
                if (
                  !e.sets.at(-1)?.completed ||
                  confirm("Remove this completed set?")
                )
                  onChange({ ...e, sets: e.sets.slice(0, -1) });
              }}
            >
              <Minus size={15} /> Remove last
            </button>
          </div>
          <details>
            <summary>Add an exercise note</summary>
            <textarea
              aria-label="Exercise note"
              placeholder="How did that feel?"
              value={e.note}
              onChange={(ev) => onChange({ ...e, note: ev.target.value })}
            />
          </details>
          {working(e).length > 0 && (
            <div className={`performance ${result.status}`}>
              {result.status === "progressed"
                ? "↗"
                : result.status === "below"
                  ? "↘"
                  : "→"}{" "}
              {result.detail}
              {prs.length > 0 && (
                <span>
                  <Trophy size={13} /> {prs.join(" · ")}
                </span>
              )}
            </div>
          )}
        </>
      )}
      {e.skipped && (
        <p className="muted">Skipped for today. Tap the arrow to restore.</p>
      )}
    </article>
  );
}
