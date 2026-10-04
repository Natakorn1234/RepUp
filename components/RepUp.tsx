"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Dumbbell,
  Clock3,
  ChevronRight,
  ChevronLeft,
  Flame,
  Check,
  MoreHorizontal,
  Play,
  X,
  Copy,
  Pencil,
  Trash2,
  CalendarDays,
  WifiOff,
  Zap,
  Timer,
} from "lucide-react";
import {
  AppData,
  WorkoutTemplate,
  WorkoutSession,
  WorkoutExercise,
} from "@/types";
import { records } from "@/lib/progression";
import { storage } from "@/lib/storage";
import { uid, target } from "@/lib/seed";
import {
  previous,
  sessionSets,
  duration,
  displayWeight,
} from "@/lib/calculations";
import BottomNav, { Tab } from "./navigation/BottomNav";
import ExerciseCard from "./workout/ExerciseCard";
import TemplateEditor, { ExercisePicker } from "./workout/TemplateEditor";
import SessionDetail from "./workout/SessionDetail";
import ProgressView from "./progress/ProgressView";
import SettingsView from "./SettingsView";
import ExerciseMedia from "./exercises/ExerciseMedia";
export default function RepUp() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Tab>("Today");
  const [selected, setSelected] = useState("");
  const [toast, setToast] = useState("");
  const [templates, setTemplates] = useState(false);
  const [editor, setEditor] = useState<WorkoutTemplate | null>(null);
  const [picker, setPicker] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [recap, setRecap] = useState(false);
  const [exerciseId, setExerciseId] = useState<string | undefined>();
  const [now, setNow] = useState(Date.now());
  const [restEnd, setRestEnd] = useState(0);
  const [offline, setOffline] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const corrupt = useRef(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab, detail, templates, exerciseId]);
  useEffect(() => {
    const loaded = storage.load();
    setData(loaded.data);
    if (loaded.error) {
      setToast(loaded.error);
      setBlocked(true);
      corrupt.current = true;
    }
    setSelected(
      loaded.data.schedule.days[new Date().getDay()] ||
        loaded.data.templates[0]?.id ||
        "",
    );
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const status = () => setOffline(!navigator.onLine);
    status();
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          setToast(
            "Offline setup unavailable. Your data is still stored locally.",
          ),
        );
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
    };
  }, []);
  useEffect(() => {
    if (data) document.documentElement.dataset.theme = data.settings.theme;
  }, [data?.settings.theme]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (restEnd && now >= restEnd) {
      setRestEnd(0);
      setToast("Rest complete. Ready when you are.");
      navigator.vibrate?.([100, 80, 100]);
      if (data?.settings.sound && audio.current) {
        const ctx = audio.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    }
  }, [now, restEnd, data?.settings.sound]);
  function update(next: AppData) {
    if (
      corrupt.current &&
      !confirm(
        "Existing saved data is unreadable. Replace it with this new data? Cancel to keep the original.",
      )
    )
      return;
    try {
      storage.save(next);
      corrupt.current = false;
      setBlocked(false);
      setData(next);
    } catch {
      setToast(
        "Storage is full or unavailable. Changes are in memory; export a backup now.",
      );
      setData(next);
      setBlocked(true);
    }
  }
  if (!data)
    return (
      <div className="boot">
        <span className="brand-mark">↗</span>
        <strong>RepUp</strong>
      </div>
    );
  const current = data;
  const chosen =
    data.templates.find((t) => t.id === selected) || data.templates[0];
  const active = data.active;
  const scheduled = data.schedule.days[new Date().getDay()];
  const isRest = !scheduled;
  const latest = [...data.sessions].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  )[0];
  const date = new Date();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const todayCount = data.sessions.filter(
    (s) =>
      new Date(s.startedAt) >= new Date(new Date().setDate(date.getDate() - 7)),
  ).length;
  function custom(name: string, primaryMuscle: string) {
    const id = uid();
    update({
      ...current,
      exercises: [
        ...current.exercises,
        { id, name, primaryMuscle, equipment: "Custom" },
      ],
    });
    return id;
  }
  function makeExercise(
    id: string,
    template?: WorkoutTemplate,
  ): WorkoutExercise {
    const t =
      template?.exercises.find((e) => e.exerciseId === id) || target(id);
    const last = previous(current.sessions, id);
    return {
      ...t,
      name:
        current.exercises.find((e) => e.id === id)?.name || "Custom exercise",
      note: "",
      skipped: false,
      sets: Array.from({ length: t.targetSets }, (_, i) => ({
        id: uid(),
        weight:
          last?.sets.filter((s) => s.completed && s.type === "working")[i]
            ?.weight || 0,
        reps: 0,
        rir: undefined,
        completed: false,
        type: "working" as const,
      })),
    };
  }
  function start() {
    if (!chosen) return;
    const s: WorkoutSession = {
      id: uid(),
      templateId: chosen.id,
      name: chosen.name,
      startedAt: new Date().toISOString(),
      exercises: chosen.exercises.map((e) =>
        makeExercise(e.exerciseId, chosen),
      ),
    };
    update({ ...current, active: s });
    setToast("Workout started. Make it yours.");
  }
  function finish() {
    if (!active) return;
    if (!sessionSets(active).length) {
      setToast("Complete at least one working set before finishing.");
      return;
    }
    if (
      active.exercises.some(
        (e) => !e.skipped && e.sets.some((s) => !s.completed),
      ) &&
      !confirm(
        "Finish with incomplete sets? Only completed working sets count toward your progress.",
      )
    )
      return;
    const done = { ...active, finishedAt: new Date().toISOString() };
    update({ ...current, sessions: [done, ...current.sessions], active: null });
    setRestEnd(0);
    setDetail(done.id);
    setRecap(true);
    setToast("Workout saved. Nice work.");
  }
  function setComplete() {
    navigator.vibrate?.(35);
    if (current.settings.sound) {
      audio.current ||= new AudioContext();
      void audio.current.resume();
    }
    if (current.settings.autoRest)
      setRestEnd(Date.now() + current.settings.restSeconds * 1000);
    setToast("Set completed");
  }
  const viewed = data.sessions.find((s) => s.id === detail);
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <a className="brand" href="/" aria-label="RepUp home">
          <span className="brand-mark">
            <ArrowUpRight strokeWidth={3} />
          </span>
          RepUp<span className="brand-dot">.</span>
        </a>
        <p className="sidebar-caption">BUILT FOR THE WORK.</p>
        <BottomNav
          tab={tab}
          onChange={(t) => {
            setTab(t);
            setDetail(null);
            setTemplates(false);
          }}
        />
        <div className="sidebar-bottom">
          <span className="local-dot" /> Your data. Your device.
          <small>No accounts. Just progress.</small>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <a className="brand mobile-brand" href="/">
            <span className="brand-mark">
              <ArrowUpRight strokeWidth={3} />
            </span>
            RepUp<span className="brand-dot">.</span>
          </a>
          <span className="desktop-breadcrumb">
            Your training <ChevronRight size={13} /> <strong>{tab}</strong>
          </span>
          <div className="topbar-right">
            {offline ? (
              <span className="local-status">
                <WifiOff size={13} /> Offline & ready
              </span>
            ) : (
              <span className="local-status">
                <span className="local-dot" /> STORED ON DEVICE
              </span>
            )}
            <span className="avatar">YOU</span>
          </div>
        </header>
        <main>
          {blocked && (
            <div className="warning">
              Local storage needs attention. Export a backup before continuing.
              <button
                className="text-btn"
                onClick={() => {
                  try {
                    const raw = corrupt.current
                      ? storage.original()
                      : storage.export(data);
                    if (!raw) return;
                    const url = URL.createObjectURL(
                      new Blob([raw], { type: "application/json" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "repup-recovery.json";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch {
                    setToast("Browser storage cannot be accessed.");
                  }
                }}
              >
                Download recovery file
              </button>
            </div>
          )}
          {active && (tab !== "Today" || templates || detail) && (
            <button
              className="resume-banner"
              onClick={() => {
                setTab("Today");
                setDetail(null);
                setTemplates(false);
              }}
            >
              <span>
                <span className="live-dot" /> {active.name} in progress
              </span>
              <span>
                Resume <ArrowRight size={16} />
              </span>
            </button>
          )}
          {viewed ? (
            <SessionDetail
              key={viewed.id}
              session={viewed}
              data={data}
              recap={recap}
              onClose={() => {
                setDetail(null);
                setRecap(false);
              }}
              onSave={(s) => {
                update({
                  ...data,
                  sessions: data.sessions.map((x) => (x.id === s.id ? s : x)),
                });
                setToast("Workout updated");
              }}
              onDelete={() => {
                update({
                  ...data,
                  sessions: data.sessions.filter((x) => x.id !== viewed.id),
                });
                setDetail(null);
                setToast("Workout deleted");
              }}
              onExercise={(id) => {
                setExerciseId(id);
                setDetail(null);
                setTab("Progress");
              }}
            />
          ) : templates ? (
            <>
              <button
                className="text-btn back"
                onClick={() => setTemplates(false)}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <div className="page-heading">
                <p className="eyebrow">YOUR TRAINING, YOUR WAY</p>
                <h1>Workout templates.</h1>
                <p>A plan you can make your own.</p>
              </div>
              {data.templates.map((t) => (
                <section className="panel template-card" key={t.id}>
                  <div>
                    <h2>{t.name}</h2>
                    <p className="muted">
                      {t.exercises.length} exercises ·{" "}
                      {t.exercises.reduce((n, e) => n + e.targetSets, 0)} sets
                    </p>
                    <p className="fine">
                      {t.exercises
                        .map(
                          (e) =>
                            data.exercises.find((x) => x.id === e.exerciseId)
                              ?.name,
                        )
                        .join(" / ")}
                    </p>
                  </div>
                  <div className="inline">
                    <button className="secondary" onClick={() => setEditor(t)}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Duplicate ${t.name}`}
                      onClick={() => {
                        update({
                          ...data,
                          templates: [
                            ...data.templates,
                            {
                              ...structuredClone(t),
                              id: uid(),
                              name: `${t.name} copy`,
                            },
                          ],
                        });
                        setToast("Template duplicated");
                      }}
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      className="icon-btn danger"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => {
                        if (
                          confirm(
                            `Delete ${t.name}? Saved workouts will be kept.`,
                          )
                        )
                          update({
                            ...data,
                            templates: data.templates.filter(
                              (x) => x.id !== t.id,
                            ),
                            schedule: {
                              days: data.schedule.days.map((id) =>
                                id === t.id ? null : id,
                              ),
                            },
                          });
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </section>
              ))}
              <button
                className="primary"
                onClick={() =>
                  setEditor({ id: uid(), name: "New workout", exercises: [] })
                }
              >
                <Plus size={18} /> Create workout
              </button>
            </>
          ) : tab === "Today" ? (
            active ? (
              <>
                <div className="active-top">
                  <div>
                    <p className="eyebrow">
                      <span className="live-dot" /> WORKOUT IN PROGRESS
                    </p>
                    <h1>{active.name} day.</h1>
                    <p className="muted">
                      <Clock3 size={14} />{" "}
                      {Math.floor((now - Date.parse(active.startedAt)) / 60000)}
                      :
                      {String(
                        Math.floor(
                          (now - Date.parse(active.startedAt)) / 1000,
                        ) % 60,
                      ).padStart(2, "0")}{" "}
                      <span>·</span>{" "}
                      {
                        active.exercises.filter(
                          (e) => e.skipped || e.sets.every((s) => s.completed),
                        ).length
                      }
                      /{active.exercises.length} exercises
                    </p>
                  </div>
                  <button className="primary compact" onClick={finish}>
                    Finish <Check size={17} />
                  </button>
                </div>
                <div className="workout-progress">
                  <div
                    style={{
                      width: `${(active.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length / Math.max(1, active.exercises.flatMap((e) => e.sets).length)) * 100}%`,
                    }}
                  />
                </div>
                <div className="workout-columns">
                  {active.exercises.map((e, i) => (
                    <ExerciseCard
                      definition={data.exercises.find(
                        (x) => x.id === e.exerciseId,
                      )}
                      key={e.exerciseId}
                      exercise={e}
                      last={previous(
                        data.sessions,
                        e.exerciseId,
                        active.startedAt,
                      )}
                      index={i}
                      settings={data.settings}
                      history={data.sessions}
                      onComplete={setComplete}
                      onChange={(updated) => {
                        update({
                          ...data,
                          active: {
                            ...active,
                            exercises: active.exercises.map((x, j) =>
                              j === i ? updated : x,
                            ),
                          },
                        });
                        if (
                          records(updated, data.sessions).length >
                          records(e, data.sessions).length
                        )
                          setTimeout(
                            () => setToast("New PR · " + updated.name),
                            20,
                          );
                      }}
                    />
                  ))}
                </div>
                <button
                  className="secondary full"
                  onClick={() => setPicker(true)}
                >
                  <Plus size={17} /> Add exercise
                </button>
                <div className="timer-presets">
                  <Timer size={18} />
                  {[60, 90, 120, 180].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRestEnd(Date.now() + s * 1000)}
                    >
                      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
                    </button>
                  ))}
                </div>
                <button
                  className="text-btn danger discard"
                  onClick={() => {
                    if (
                      confirm(
                        "Discard this active workout? All unsaved sets will be lost.",
                      )
                    ) {
                      update({ ...data, active: null });
                      setRestEnd(0);
                    }
                  }}
                >
                  Discard workout
                </button>
              </>
            ) : (
              <>
                <div className="home-heading">
                  <div>
                    <p className="eyebrow">
                      {date
                        .toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                        .toUpperCase()}
                    </p>
                    <h1>
                      Let’s get stronger<span className="accent">.</span>
                    </h1>
                    <p>One rep better. One session at a time.</p>
                  </div>
                  <span className="heading-icon">
                    <Dumbbell size={27} />
                  </span>
                </div>
                <section className="week-strip">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + i);
                    const isToday = d.toDateString() === date.toDateString();
                    const trained = data.sessions.some(
                      (s) =>
                        new Date(s.startedAt).toDateString() ===
                        d.toDateString(),
                    );
                    return (
                      <div key={i} className={isToday ? "today" : ""}>
                        <span>
                          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i]}
                        </span>
                        <strong>{d.getDate()}</strong>
                        <i
                          className={
                            trained
                              ? "trained"
                              : data.schedule.days[d.getDay()]
                                ? "planned"
                                : ""
                          }
                        >
                          {trained ? <Check size={10} /> : null}
                        </i>
                      </div>
                    );
                  })}
                </section>
                <div className="home-grid">
                  <div>
                    <div className="section-heading">
                      <h2>Today’s workout</h2>
                      <button
                        className="text-btn muted"
                        onClick={() => setTemplates(true)}
                      >
                        My templates <ChevronRight size={14} />
                      </button>
                    </div>
                    <section className="hero-card">
                      <div className="hero-top">
                        <span className="hero-label">
                          <span className="local-dot" />
                          {isRest ? "YOUR PACE, YOUR PLAN" : "ON THE SCHEDULE"}
                        </span>
                        <span className="hero-badge">
                          <Dumbbell size={17} />
                        </span>
                      </div>
                      <h2>
                        {chosen?.name || "Your next chapter"}
                        <span className="accent">.</span>
                      </h2>
                      <p>
                        {isRest
                          ? "A rest day on your schedule. Recharge, or make it a training day."
                          : "Show up. Put in the work. Build on last time."}
                      </p>
                      <div className="hero-meta">
                        <span>
                          <Dumbbell size={15} />
                          {chosen?.exercises.length || 0} exercises
                        </span>
                        <span>
                          <Clock3 size={15} />~
                          {chosen
                            ? chosen.exercises.reduce(
                                (n, e) => n + e.targetSets,
                                0,
                              ) * 3
                            : 0}{" "}
                          min
                        </span>
                        <span>
                          <Zap size={15} />
                          Strength
                        </span>
                      </div>
                      <div className="hero-art" aria-hidden="true">
                        <div />
                        <div />
                        <div />
                      </div>
                      <button
                        className="primary full start-button"
                        onClick={start}
                        disabled={!chosen}
                      >
                        <Play size={17} fill="currentColor" /> Start workout{" "}
                        <ArrowRight size={19} />
                      </button>
                    </section>
                    <div className="choose-workout">
                      <span>Different plan today?</span>
                      <select
                        aria-label="Choose another workout"
                        value={chosen?.id || ""}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {data.templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <section className="exercise-preview">
                      <div className="section-heading">
                        <h2>The lineup</h2>
                        <span className="fine">
                          {chosen?.exercises.reduce(
                            (n, e) => n + e.targetSets,
                            0,
                          ) || 0}{" "}
                          WORKING SETS
                        </span>
                      </div>
                      {chosen?.exercises.map((e, i) => {
                        const ex = data.exercises.find(
                          (x) => x.id === e.exerciseId,
                        );
                        const last = previous(data.sessions, e.exerciseId);
                        return (
                          <button
                            className="preview-row"
                            key={e.exerciseId}
                            onClick={() => {
                              setExerciseId(e.exerciseId);
                              setTab("Progress");
                            }}
                          >
                            {ex && <ExerciseMedia exercise={ex} />}
                            <span className="preview-info">
                              <strong>{ex?.name}</strong>
                              <small>
                                {e.targetSets} sets <b>·</b> {e.minReps}–
                                {e.maxReps} reps <b>·</b> {ex?.primaryMuscle}
                              </small>
                            </span>
                            <span className="preview-last">
                              {last ? (
                                <>
                                  {displayWeight(
                                    last.sets.find((s) => s.completed)
                                      ?.weight || 0,
                                    data.settings.unit,
                                  )}
                                  <small>{data.settings.unit} LAST TIME</small>
                                </>
                              ) : (
                                <span className="fine">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                              )}
                            </span>
                            <ChevronRight size={15} />
                          </button>
                        );
                      })}
                    </section>
                  </div>
                  <div className="home-side">
                    <section className="panel week-panel">
                      <div className="section-heading">
                        <span className="eyebrow">THE LAST 7 DAYS</span>
                        <Flame size={18} className="accent" />
                      </div>
                      <div className="week-number">
                        {todayCount}
                        <span>
                          workouts
                          <br />
                          in the bank
                        </span>
                      </div>
                      <div className="week-bars">
                        {Array.from({ length: 7 }, (_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - 6 + i);
                          const count = data.sessions.filter(
                            (s) =>
                              new Date(s.startedAt).toDateString() ===
                              d.toDateString(),
                          ).length;
                          return (
                            <div key={i}>
                              <i
                                className={count ? "filled" : ""}
                                style={{
                                  height: count
                                    ? Math.min(72, 35 + count * 15)
                                    : 8,
                                }}
                              />
                              <span>
                                {d.toLocaleDateString("en-US", {
                                  weekday: "narrow",
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="fine">
                        Consistency is where progress begins.
                      </p>
                    </section>
                    <section className="panel last-session">
                      <p className="eyebrow">LAST SESSION</p>
                      {latest ? (
                        <>
                          <h3>
                            {latest.name}
                            <ArrowUpRight size={21} />
                          </h3>
                          <p>
                            {new Date(latest.startedAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}{" "}
                            <b>·</b> {duration(latest)} min <b>·</b>{" "}
                            {sessionSets(latest).length} sets
                          </p>
                          <button
                            className="text-btn"
                            onClick={() => {
                              setRecap(false);
                              setDetail(latest.id);
                            }}
                          >
                            View workout <ArrowRight size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="empty-small">
                            <Dumbbell size={24} />
                          </span>
                          <h3>Your story starts here.</h3>
                          <p>
                            Finish your first workout and we’ll keep the details
                            ready for next time.
                          </p>
                        </>
                      )}
                    </section>
                    <section className="tip-card">
                      <span className="tip-icon">
                        <TrendingIcon />
                      </span>
                      <p className="eyebrow">THE REPUP MINDSET</p>
                      <h3>
                        Progress isn’t always
                        <br />
                        another plate.
                      </h3>
                      <p>
                        One more rep. A little more control.
                        <br />
                        The small wins add up.
                      </p>
                      <span className="tip-rule" />
                    </section>
                  </div>
                </div>
                <p className="footer-note">
                  <span className="local-dot" /> No distractions. Just you and
                  the next rep.
                </p>
              </>
            )
          ) : tab === "History" ? (
            <>
              <div className="page-heading">
                <p className="eyebrow">THE WORK YOU’VE PUT IN</p>
                <h1>Your training log.</h1>
                <p>Every session is a step forward.</p>
              </div>
              {data.sessions.length ? (
                [...data.sessions]
                  .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
                  .map((s, i, all) => {
                    const month = new Date(s.startedAt).toLocaleDateString(
                      undefined,
                      { month: "long", year: "numeric" },
                    );
                    return (
                      <div key={s.id}>
                        {(i === 0 ||
                          month !==
                            new Date(all[i - 1].startedAt).toLocaleDateString(
                              undefined,
                              { month: "long", year: "numeric" },
                            )) && <p className="month-label">{month}</p>}
                        <button
                          className="history-row"
                          onClick={() => {
                            setRecap(false);
                            setDetail(s.id);
                          }}
                        >
                          <span className="history-date">
                            <strong>{new Date(s.startedAt).getDate()}</strong>
                            <small>
                              {new Date(s.startedAt).toLocaleDateString(
                                undefined,
                                { month: "short" },
                              )}
                            </small>
                          </span>
                          <span>
                            <h3>{s.name}</h3>
                            <p>
                              {duration(s)} min <b>·</b> {sessionSets(s).length}{" "}
                              working sets <b>·</b> {s.exercises.length}{" "}
                              exercises
                            </p>
                          </span>
                          <ChevronRight size={19} />
                        </button>
                      </div>
                    );
                  })
              ) : (
                <section className="panel empty">
                  <CalendarDays />
                  <h2>A fresh page.</h2>
                  <p>
                    Your completed workouts will live here.
                    <br />
                    Start a session and make your first entry.
                  </p>
                  <button className="primary" onClick={() => setTab("Today")}>
                    Let’s train <ArrowRight size={17} />
                  </button>
                </section>
              )}
            </>
          ) : tab === "Progress" ? (
            <ProgressView
              onBack={() => setExerciseId(undefined)}
              key={exerciseId || "default"}
              data={data}
              initialExercise={exerciseId}
            />
          ) : (
            <SettingsView
              data={data}
              update={update}
              toast={setToast}
              onTemplates={() => setTemplates(true)}
            />
          )}
        </main>
        <div className="mobile-nav">
          <BottomNav
            tab={tab}
            onChange={(t) => {
              setTab(t);
              setDetail(null);
              setTemplates(false);
            }}
          />
        </div>
        {restEnd > now && active && (
          <div className="rest-timer">
            <Timer size={19} />
            <div>
              <small>REST TIMER</small>
              <strong>
                {Math.floor((restEnd - now) / 60000)}:
                {String(Math.floor((restEnd - now) / 1000) % 60).padStart(
                  2,
                  "0",
                )}
              </strong>
            </div>
            <button onClick={() => setRestEnd(restEnd + 30000)}>+30s</button>
            <button
              className="icon-btn"
              aria-label="Dismiss timer"
              onClick={() => setRestEnd(0)}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {toast && (
          <div role="status" className="toast">
            <Check size={17} />
            {toast}
          </div>
        )}
        {editor && (
          <TemplateEditor
            template={editor}
            exercises={data.exercises}
            onClose={() => setEditor(null)}
            onCustom={custom}
            onSave={(t) => {
              update({
                ...data,
                templates: data.templates.some((x) => x.id === t.id)
                  ? data.templates.map((x) => (x.id === t.id ? t : x))
                  : [...data.templates, t],
              });
              setSelected(t.id);
              setEditor(null);
              setToast("Template saved");
            }}
          />
        )}
        {picker && active && (
          <ExercisePicker
            exercises={data.exercises.filter(
              (e) => !active.exercises.some((x) => x.exerciseId === e.id),
            )}
            onClose={() => setPicker(false)}
            onPick={(id) => {
              update({
                ...data,
                active: {
                  ...active,
                  exercises: [...active.exercises, makeExercise(id)],
                },
              });
              setPicker(false);
            }}
            onCustom={(name, primaryMuscle) => {
              const id = uid();
              update({
                ...data,
                exercises: [...data.exercises, { id, name, primaryMuscle }],
                active: {
                  ...active,
                  exercises: [
                    ...active.exercises,
                    { ...makeExercise(id), name },
                  ],
                },
              });
              setPicker(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
function TrendingIcon() {
  return <ArrowUpRight size={23} />;
}
