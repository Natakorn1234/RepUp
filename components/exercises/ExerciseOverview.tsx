import { Exercise, TemplateExercise } from "@/types";
import ExerciseMedia from "./ExerciseMedia";
import { DemoButton } from "./ExerciseDemo";
export default function ExerciseOverview({
  exercise,
  target,
}: {
  exercise: Exercise;
  target?: TemplateExercise;
}) {
  return (
    <div className="exercise-overview">
      <ExerciseMedia exercise={exercise} size="card" />
      <div className="overview-info">
        <p className="eyebrow">
          {exercise.primaryMuscle} · {exercise.equipment || "Custom"}
        </p>
        <h2>{exercise.name}</h2>
        {!!exercise.secondaryMuscles?.length && (
          <p className="overview-secondary">
            {exercise.secondaryMuscles.join(" · ")}
          </p>
        )}
        <div className="overview-bottom">
          {target && (
            <p>
              {target.targetSets} × {target.minReps}–{target.maxReps}
              <span>
                RIR {target.minRir}–{target.maxRir}
              </span>
            </p>
          )}
          <DemoButton exercise={exercise} />
        </div>
      </div>
    </div>
  );
}
