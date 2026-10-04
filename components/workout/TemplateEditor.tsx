import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Exercise, WorkoutTemplate } from "@/types";
import { target } from "@/lib/seed";
import ExerciseMedia from "@/components/exercises/ExerciseMedia";
export function ExercisePicker({
  exercises,
  onPick,
  onClose,
  onCustom,
}: {
  exercises: Exercise[];
  onPick: (id: string) => void;
  onClose: () => void;
  onCustom: (name: string, muscle: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Chest");
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="section-heading">
          <h2>Add an exercise</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <input
          autoFocus
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="picker-list">
          {exercises
            .filter((e) =>
              `${e.name} ${e.primaryMuscle}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((e) => (
              <button key={e.id} onClick={() => onPick(e.id)}>
                <ExerciseMedia exercise={e} />
                <span>
                  {e.name}
                  <small>
                    {e.primaryMuscle} · {e.equipment || "Custom"}
                  </small>
                </span>
                <Plus size={18} />
              </button>
            ))}
        </div>
        <div className="custom-exercise">
          <p className="eyebrow">CREATE CUSTOM EXERCISE</p>
          <select
            aria-label="Primary muscle"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          >
            {[
              "Chest",
              "Back",
              "Shoulders",
              "Biceps",
              "Triceps",
              "Quads",
              "Hamstrings",
              "Glutes",
              "Calves",
              "Core",
            ].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button
            className="secondary"
            disabled={!query.trim()}
            onClick={() => onCustom(query.trim(), muscle)}
          >
            Create “{query.trim() || "your exercise"}”
          </button>
        </div>
      </section>
    </div>
  );
}
export default function TemplateEditor({
  template,
  exercises,
  onSave,
  onClose,
  onCustom,
}: {
  template: WorkoutTemplate;
  exercises: Exercise[];
  onSave: (t: WorkoutTemplate) => void;
  onClose: () => void;
  onCustom: (name: string, muscle: string) => string;
}) {
  const [draft, setDraft] = useState(structuredClone(template));
  const [picker, setPicker] = useState(false);
  const add = (id: string) => {
    if (!draft.exercises.some((e) => e.exerciseId === id))
      setDraft({ ...draft, exercises: [...draft.exercises, target(id)] });
    setPicker(false);
  };
  return (
    <div className="modal-backdrop">
      <section className="modal wide">
        <div className="section-heading">
          <h2>Workout template</h2>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X />
          </button>
        </div>
        <label className="field-label">
          WORKOUT NAME
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="editor-list">
          {draft.exercises.map((e, i) => (
            <div className="editor-exercise" key={e.exerciseId}>
              <div className="section-heading">
                <h3>{exercises.find((x) => x.id === e.exerciseId)?.name}</h3>
                <div className="inline">
                  <button
                    aria-label="Move up"
                    className="icon-btn"
                    disabled={i === 0}
                    onClick={() => {
                      const a = [...draft.exercises];
                      [a[i - 1], a[i]] = [a[i], a[i - 1]];
                      setDraft({ ...draft, exercises: a });
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    aria-label="Move down"
                    className="icon-btn"
                    disabled={i === draft.exercises.length - 1}
                    onClick={() => {
                      const a = [...draft.exercises];
                      [a[i + 1], a[i]] = [a[i], a[i + 1]];
                      setDraft({ ...draft, exercises: a });
                    }}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    aria-label="Remove exercise"
                    className="icon-btn danger"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        exercises: draft.exercises.filter((_, j) => i !== j),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="target-inputs">
                {(
                  [
                    ["targetSets", "Sets"],
                    ["minReps", "Min reps"],
                    ["maxReps", "Max reps"],
                    ["minRir", "Min RIR"],
                    ["maxRir", "Max RIR"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={key.includes("Rir") ? 0 : 1}
                      max={key.includes("Rir") ? 10 : 99}
                      value={e[key]}
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          exercises: draft.exercises.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  [key]: Math.max(
                                    key.includes("Rir") ? 0 : 1,
                                    Math.min(
                                      key.includes("Rir") ? 10 : 99,
                                      Math.floor(Number(ev.target.value)),
                                    ),
                                  ),
                                }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="secondary full" onClick={() => setPicker(true)}>
          <Plus size={17} /> Add exercise
        </button>
        <button
          className="primary full"
          disabled={
            !draft.name.trim() ||
            !draft.exercises.length ||
            draft.exercises.some(
              (e) => e.minReps > e.maxReps || e.minRir > e.maxRir,
            )
          }
          onClick={() => onSave({ ...draft, name: draft.name.trim() })}
        >
          Save template
        </button>
      </section>
      {picker && (
        <ExercisePicker
          exercises={exercises}
          onClose={() => setPicker(false)}
          onPick={add}
          onCustom={(n, m) => add(onCustom(n, m))}
        />
      )}
    </div>
  );
}
