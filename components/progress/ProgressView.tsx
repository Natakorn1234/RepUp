import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Trophy, Dumbbell, ArrowLeft } from "lucide-react";
import ExerciseOverview from "@/components/exercises/ExerciseOverview";
import { AppData } from "@/types";
import {
  working,
  e1rm,
  volume,
  displayWeight,
  previous,
} from "@/lib/calculations";
import { compare, records } from "@/lib/progression";
export default function ProgressView({
  data,
  initialExercise,
  onBack,
}: {
  data: AppData;
  initialExercise?: string;
  onBack?: () => void;
}) {
  const [selected, setSelected] = useState(
    initialExercise || data.exercises[0]?.id || "",
  );
  const [metric, setMetric] = useState("Estimated 1RM");
  const exercise = data.exercises.find((e) => e.id === selected);
  const target = data.templates
    .flatMap((t) => t.exercises)
    .find((e) => e.exerciseId === selected);
  const detail = !!initialExercise;
  const unit = data.settings.unit;
  const recent = data.sessions.filter(
    (s) => Date.now() - new Date(s.startedAt).getTime() < 30 * 86400000,
  );
  const prItems = data.sessions
    .flatMap((s) =>
      s.exercises.map((e) => ({
        s,
        e,
        pr: records(
          e,
          data.sessions.filter((x) => x.startedAt < s.startedAt),
        ),
      })),
    )
    .filter((x) => x.pr.length);
  const progressed = recent.reduce(
    (n, s) =>
      n +
      s.exercises.filter(
        (e) =>
          compare(e, previous(data.sessions, e.exerciseId, s.startedAt))
            .status === "progressed",
      ).length,
    0,
  );
  const rows = [...data.sessions]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((s) =>
      s.exercises
        .filter((e) => e.exerciseId === selected && working(e).length)
        .map((e) => ({ s, e, sets: working(e) })),
    );
  const points = rows.map(({ s, sets }) => ({
    date: new Date(s.startedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    value:
      Math.round(
        (metric === "Estimated 1RM"
          ? displayWeight(Math.max(...sets.map(e1rm)), unit)
          : metric === "Best weight"
            ? displayWeight(Math.max(...sets.map((x) => x.weight)), unit)
            : metric === "Best set reps"
              ? Math.max(...sets.map((x) => x.reps))
              : displayWeight(volume(sets), unit)) * 10,
      ) / 10,
  }));
  const all = rows.flatMap((r) => r.sets);
  const best = [...all].sort(
    (a, b) => e1rm(b) - e1rm(a) || b.weight - a.weight,
  )[0];
  return (
    <>
      {detail ? (
        <>
          <button className="text-btn back" onClick={onBack}>
            <ArrowLeft size={17} /> All progress
          </button>
          <div className="exercise-detail-title">
            <p className="eyebrow">EXERCISE PROGRESS</p>
            <h1>{exercise?.name || "Exercise"}</h1>
          </div>
        </>
      ) : (
        <>
          <div className="page-heading">
            <p className="eyebrow">YOUR WORK IS ADDING UP</p>
            <h1>A little stronger.</h1>
            <p>Small wins. Real progress.</p>
          </div>
          <div className="section-heading">
            <h2>Last 30 days</h2>
            <span className="pill">KEEP SHOWING UP</span>
          </div>
          <div className="stats-grid">
            <div>
              <Dumbbell />
              <strong>{recent.length}</strong>
              <span>Workouts</span>
            </div>
            <div>
              <TrendingUp />
              <strong>{progressed}</strong>
              <span>Exercises progressed</span>
            </div>
            <div>
              <Trophy />
              <strong>
                {prItems.filter((x) => recent.includes(x.s)).length}
              </strong>
              <span>PR performances</span>
            </div>
          </div>
        </>
      )}
      <section className="panel">
        {exercise && <ExerciseOverview exercise={exercise} target={target} />}
        <div className="section-heading">
          <h2>{detail ? "Progress" : "Strength over time"}</h2>
          <TrendingUp className="accent" size={20} />
        </div>
        <select
          aria-label="Exercise progress"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {data.exercises.map((e) => (
            <option value={e.id} key={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <div className="metric-tabs">
          {["Estimated 1RM", "Best weight", "Best set reps", "Volume"].map(
            (m) => (
              <button
                key={m}
                className={m === metric ? "active" : ""}
                onClick={() => setMetric(m)}
              >
                {m}
              </button>
            ),
          )}
        </div>
        {points.length ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={points}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#343832"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#92988d", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#92988d", fontSize: 11 }}
                  width={42}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#20241f",
                    border: "1px solid #454d3d",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={metric === "Best set reps" ? "reps" : unit}
                  stroke="var(--accent)"
                  strokeWidth={3}
                  fill="url(#chartFill)"
                  dot={{ r: 4, fill: "var(--accent)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty">
            <TrendingUp />
            <h3>Your first session starts the story.</h3>
            <p>Log this exercise to see your strength trend.</p>
          </div>
        )}
        <p className="fine">
          Estimated 1RM uses Epley: weight × (1 + reps ÷ 30), for 1–12 reps
          only. Volume is context, not a progression score.
        </p>
        {best && (
          <div className="mini-stats">
            <div>
              <span>BEST WEIGHT</span>
              <strong>
                {displayWeight(Math.max(...all.map((x) => x.weight)), unit)}{" "}
                <small>{unit}</small>
              </strong>
            </div>
            <div>
              <span>BEST SET · E1RM</span>
              <strong>
                {displayWeight(best.weight, unit)} × {best.reps}
              </strong>
            </div>
            <div>
              <span>ESTIMATED 1RM</span>
              <strong>
                {displayWeight(Math.max(...all.map(e1rm)), unit).toFixed(1)}{" "}
                <small>{unit}</small>
              </strong>
            </div>
          </div>
        )}
      </section>
      {!detail && (
        <>
          <section className="panel">
            <h2>Workout consistency</h2>
            <p className="muted">Each square is a day. Every session counts.</p>
            <div className="consistency">
              {Array.from({ length: 28 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 27 + i);
                const done = data.sessions.some(
                  (s) =>
                    new Date(s.startedAt).toDateString() === d.toDateString(),
                );
                return (
                  <div
                    key={i}
                    className={done ? "done" : ""}
                    title={`${d.toLocaleDateString()}: ${done ? "Trained" : "Rest"}`}
                  >
                    <span>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="section-heading fine">
              <span>4 WEEKS AGO</span>
              <span>TODAY</span>
            </div>
          </section>
          <section className="panel">
            <h2>Recent personal records</h2>
            {prItems.length ? (
              prItems.slice(0, 5).map(({ s, e, pr }) => (
                <div className="record-row" key={s.id + e.exerciseId}>
                  <span className="record-icon">
                    <Trophy size={18} />
                  </span>
                  <div>
                    <strong>{e.name}</strong>
                    <small>{pr.join(" · ")}</small>
                  </div>
                  <time>
                    {new Date(s.startedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
              ))
            ) : (
              <p className="muted">
                Your first workout sets a baseline. Your next wins will appear
                here.
              </p>
            )}
          </section>
        </>
      )}
      {rows.length > 0 && (
        <section className="panel">
          <h2>Recent sessions</h2>
          {[...rows].reverse().map(({ s, e, sets }, i) => (
            <div className="history-exercise" key={s.id}>
              <div className="section-heading">
                <strong>
                  {new Date(s.startedAt).toLocaleDateString()}
                  {i === 0 && " · Latest"}
                </strong>
                <span className="muted">{s.name}</span>
              </div>
              <p>
                {sets
                  .map(
                    (x) =>
                      `${displayWeight(x.weight, unit)} ${unit} × ${x.reps}${x.rir === undefined ? "" : ` @${x.rir}`}`,
                  )
                  .join(" / ")}
              </p>
              <p
                className={`performance ${compare(e, previous(data.sessions, e.exerciseId, s.startedAt)).status}`}
              >
                {
                  compare(e, previous(data.sessions, e.exerciseId, s.startedAt))
                    .detail
                }
              </p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
