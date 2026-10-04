import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, Check, Trophy } from "lucide-react";
import { AppData, WorkoutSession } from "@/types";
import {
  sessionSets,
  duration,
  volume,
  displayWeight,
  previous,
  working,
} from "@/lib/calculations";
import { compare, records } from "@/lib/progression";
import ExerciseCard from "./ExerciseCard";
export default function SessionDetail({
  session: s,
  data,
  onClose,
  onSave,
  onDelete,
  recap,
  onExercise,
}: {
  session: WorkoutSession;
  data: AppData;
  onClose: () => void;
  onSave: (s: WorkoutSession) => void;
  onDelete: () => void;
  recap: boolean;
  onExercise: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(structuredClone(s));
  const sets = sessionSets(s);
  const prior = data.sessions.filter((x) => x.startedAt < s.startedAt);
  const progressed = s.exercises.filter(
    (e) =>
      compare(e, previous(prior, e.exerciseId, s.startedAt)).status ===
      "progressed",
  ).length;
  const prs = s.exercises.filter((e) => records(e, prior).length).length;
  return (
    <>
      <button className="text-btn back" onClick={onClose}>
        <ArrowLeft size={17} /> Back to {recap ? "today" : "history"}
      </button>
      <div className="page-heading">
        {recap && (
          <span className="recap-check">
            <Check />
          </span>
        )}
        <p className="eyebrow">
          {recap
            ? "WORKOUT COMPLETE"
            : new Date(s.startedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
        </p>
        <h1>
          {s.name}
          {recap ? " complete." : ""}
        </h1>
        <p>{recap ? "You showed up. That’s a win." : "Every set, saved."}</p>
      </div>
      <div className="stats-grid">
        <div>
          <strong>
            {duration(s)}
            <small>m</small>
          </strong>
          <span>Duration</span>
        </div>
        <div>
          <strong>{sets.length}</strong>
          <span>Working sets</span>
        </div>
        <div>
          <strong>
            {Math.round(
              displayWeight(volume(sets), data.settings.unit),
            ).toLocaleString()}
          </strong>
          <span>{data.settings.unit} volume</span>
        </div>
      </div>
      <div className="recap-banner">
        <span>↗ {progressed} exercises progressed</span>
        <span>
          <Trophy size={16} /> {prs} PR performances
        </span>
      </div>
      {editing
        ? draft.exercises.map((e, i) => (
            <ExerciseCard
              definition={data.exercises.find((x) => x.id === e.exerciseId)}
              key={e.exerciseId}
              exercise={e}
              index={i}
              settings={data.settings}
              history={prior}
              last={previous(prior, e.exerciseId, s.startedAt)}
              onComplete={() => {}}
              onChange={(updated) =>
                setDraft({
                  ...draft,
                  exercises: draft.exercises.map((x, j) =>
                    j === i ? updated : x,
                  ),
                })
              }
            />
          ))
        : s.exercises.map((e) => {
            const result = compare(
              e,
              previous(prior, e.exerciseId, s.startedAt),
            );
            return (
              <section className="panel" key={e.exerciseId}>
                <button
                  className="plain exercise-link"
                  onClick={() => onExercise(e.exerciseId)}
                >
                  <h3>{e.name}</h3>
                  <span>↗</span>
                </button>
                <p className={`performance ${result.status}`}>
                  {e.skipped ? "Skipped" : result.detail}
                </p>
                {e.sets.map((set, i) => (
                  <div className="logged-set" key={set.id}>
                    <span>
                      {set.type === "warmup" ? "WARMUP" : `SET ${i + 1}`}
                    </span>
                    <strong>
                      {displayWeight(set.weight, data.settings.unit)}{" "}
                      {data.settings.unit} × {set.reps}
                    </strong>
                    <span>
                      {set.rir === undefined ? "" : `@${set.rir} RIR`}{" "}
                      {set.completed ? "✓" : "—"}
                    </span>
                  </div>
                ))}
                {e.note && <p className="note">{e.note}</p>}
              </section>
            );
          })}
      <div className="inline">
        <button
          className="secondary"
          onClick={() => {
            if (editing) {
              onSave(draft);
              setEditing(false);
            } else setEditing(true);
          }}
        >
          {editing ? <Check size={16} /> : <Pencil size={16} />}{" "}
          {editing ? "Save changes" : "Edit workout"}
        </button>
        {editing && (
          <button
            className="secondary"
            onClick={() => {
              setDraft(structuredClone(s));
              setEditing(false);
            }}
          >
            Cancel
          </button>
        )}
        <button
          className="icon-btn danger"
          aria-label="Delete workout"
          onClick={() => {
            if (confirm("Permanently delete this workout?")) onDelete();
          }}
        >
          <Trash2 size={19} />
        </button>
      </div>
    </>
  );
}
