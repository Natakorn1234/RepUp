import { useRef } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { AppData } from "@/types";
import { storage } from "@/lib/storage";
import { seed } from "@/lib/seed";
export default function SettingsView({
  data,
  update,
  toast,
  onTemplates,
}: {
  data: AppData;
  update: (d: AppData) => void;
  toast: (s: string) => void;
  onTemplates: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const set = (p: object) =>
    update({ ...data, settings: { ...data.settings, ...p } });
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h1>Your setup.</h1>
        <p>Less setup. More lifting.</p>
      </div>
      <section className="panel">
        <h2>Training preferences</h2>
        <label className="setting-row">
          <span>
            Weight unit<small>Existing weights convert automatically</small>
          </span>
          <select
            value={data.settings.unit}
            onChange={(e) => set({ unit: e.target.value })}
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            Weight increment<small>Suggestions only, never automatic</small>
          </span>
          <select
            value={data.settings.increment}
            onChange={(e) => set({ increment: Number(e.target.value) })}
          >
            {[1, 1.25, 2.5, 5].map((n) => (
              <option key={n} value={n}>
                {n} {data.settings.unit}
              </option>
            ))}
          </select>
        </label>
        <label className="setting-row">
          <span>
            Default rest<small>Seconds between sets</small>
          </span>
          <input
            aria-label="Default rest seconds"
            type="number"
            min="0"
            max="3600"
            value={data.settings.restSeconds}
            onChange={(e) =>
              set({
                restSeconds: Math.min(
                  3600,
                  Math.max(0, Number(e.target.value)),
                ),
              })
            }
          />
        </label>
        {(
          [
            [
              "rir",
              "Track reps in reserve",
              "Record effort alongside your reps",
            ],
            [
              "autoRest",
              "Automatic rest timer",
              "Starts when you complete a set",
            ],
            ["sound", "Timer sound", "A short chime when rest ends"],
          ] as const
        ).map(([key, title, sub]) => (
          <label className="setting-row" key={key}>
            <span>
              {title}
              <small>{sub}</small>
            </span>
            <input
              className="switch"
              type="checkbox"
              checked={data.settings[key]}
              onChange={(e) => set({ [key]: e.target.checked })}
            />
          </label>
        ))}
        <label className="setting-row">
          <span>Appearance</span>
          <select
            value={data.settings.theme}
            onChange={(e) => set({ theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </section>
      <section className="panel">
        <button className="setting-row full plain" onClick={onTemplates}>
          <span>
            Workout templates<small>Create your own training split</small>
          </span>
          <ChevronRight size={20} />
        </button>
        <h2 className="schedule-title">Weekly schedule</h2>
        {[
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((day, i) => (
          <label className="setting-row" key={day}>
            <span>{day}</span>
            <select
              aria-label={`${day} workout`}
              value={data.schedule.days[i] || ""}
              onChange={(e) =>
                update({
                  ...data,
                  schedule: {
                    days: data.schedule.days.map((d, j) =>
                      j === i ? e.target.value || null : d,
                    ),
                  },
                })
              }
            >
              <option value="">Rest day</option>
              {data.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      <section className="panel">
        <h2>Your data</h2>
        <div className="privacy-note">
          <ShieldCheck size={22} />
          <p>
            Local by design.
            <small>
              Your workouts stay on this device. Export a backup before clearing
              browser data.
            </small>
          </p>
        </div>
        <button
          className="setting-row full plain"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([storage.export(data)], { type: "application/json" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `repup-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast("Data exported");
          }}
        >
          <span className="inline">
            <Download size={18} /> Export backup
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="setting-row full plain"
          onClick={() => file.current?.click()}
        >
          <span className="inline">
            <Upload size={18} /> Import backup
          </span>
          <ChevronRight size={18} />
        </button>
        <input
          hidden
          ref={file}
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (f.size > 10_000_000)
                throw Error("Backup is too large (maximum 10 MB).");
              const parsed = storage.parse(await f.text());
              if (
                confirm(
                  "Replace all current data, including any active workout, with this backup?",
                )
              ) {
                update(parsed);
                toast("Backup imported");
              }
            } catch (err) {
              toast(
                err instanceof Error
                  ? err.message
                  : "Could not import this file",
              );
            }
            e.target.value = "";
          }}
        />
        <button
          className="setting-row full plain danger"
          onClick={() => {
            if (
              confirm(
                "Permanently reset all workouts, templates, and settings? Export a backup first.",
              )
            ) {
              update(seed());
              toast("All data reset");
            }
          }}
        >
          <span className="inline">
            <Trash2 size={18} /> Reset all data
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <p className="footer-note">
        RepUp 1.0 <span>·</span> Made for the work.
      </p>
    </>
  );
}
