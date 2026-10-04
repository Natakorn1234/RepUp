"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { Exercise } from "@/types";
import ExerciseMedia from "./ExerciseMedia";

export function DemoButton({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="demo-button"
        aria-label={`Demo: ${exercise.name}`}
        onClick={() => setOpen(true)}
      >
        <Play size={12} /> Demo
      </button>
      {open && (
        <ExerciseDemo exercise={exercise} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
export default function ExerciseDemo({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const title = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button, a[href], video[controls], [tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="demo-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="demo-sheet"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
      >
        <span className="sheet-handle" />
        <div className="section-heading">
          <div>
            <p className="eyebrow">MOVEMENT GUIDE</p>
            <h2 id={title}>{exercise.name}</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Close demonstration"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <ExerciseMedia exercise={exercise} size="demo" eager />
        <div className="demo-muscles">
          <div>
            <span>PRIMARY</span>
            <strong>{exercise.primaryMuscle}</strong>
          </div>
          {!!exercise.secondaryMuscles?.length && (
            <div>
              <span>ALSO TRAINS</span>
              <p>{exercise.secondaryMuscles.join(" · ")}</p>
            </div>
          )}
        </div>
        <p className="eyebrow">HOW TO</p>
        {exercise.instructions?.length ? (
          <ol className="demo-steps">
            {exercise.instructions.map((step, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="demo-empty">
            No movement guide is available for this custom exercise yet.
          </p>
        )}
        <p className="demo-caption">
          {exercise.equipment || "Custom exercise"}
          {exercise.imageUrl?.startsWith("/exercises/") &&
            " · RepUp original illustration"}
        </p>
        <button className="secondary full" onClick={onClose}>
          Close
        </button>
      </section>
    </div>,
    document.body,
  );
}
