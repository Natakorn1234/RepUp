import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Copy, Share2, X } from "lucide-react";
import { Exercise, WorkoutTemplate } from "@/types";
import {
  createSharePayload,
  decodeShareCode,
  encodeShareCode,
  missingExerciseIds,
  sameSharedWorkout,
  ShareCodeError,
  WorkoutSharePayload,
} from "@/lib/workout-share";

const copyText = async (text: string) => {
  if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
  await navigator.clipboard.writeText(text);
};

export function ExportWorkoutCode({
  template,
  onClose,
  toast,
}: {
  template: WorkoutTemplate;
  onClose: () => void;
  toast: (message: string) => void;
}) {
  const [code, setCode] = useState("");
  const [shareId, setShareId] = useState("");
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    void (async () => {
      try {
        const payload = createSharePayload(template);
        setShareId(payload.shareId);
        setCode(await encodeShareCode(payload));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not create a sharing code.");
      }
    })();
  }, [template]);
  const copy = async () => {
    try {
      await copyText(code);
      toast("Sharing code copied");
    } catch {
      codeRef.current?.focus();
      codeRef.current?.select();
      toast("Select and copy the code manually");
    }
  };
  const share = async () => {
    try {
      if (!navigator.share) return void copy();
      await navigator.share({
        title: `${template.name} · RepUp workout`,
        text: `Import this RepUp workout code:\n${code}`,
      });
    } catch (reason) {
      if ((reason as DOMException)?.name !== "AbortError") toast("Could not open sharing.");
    }
  };
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal share-modal" role="dialog" aria-modal="true" aria-labelledby="export-code-title">
        <div className="section-heading">
          <div><p className="eyebrow">SEND TO ANOTHER REPUP USER</p><h2 id="export-code-title">{template.name}</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close export"><X /></button>
        </div>
        <p className="muted">This code contains the workout setup, so it works without an account or connection.</p>
        {error ? <p className="share-error">{error}</p> : !code ? <p className="fine">Creating secure check…</p> : <>
          <textarea ref={codeRef} className="share-code" aria-label="Workout sharing code" readOnly value={code} onFocus={(event) => event.currentTarget.select()} />
          <p className="fine">Share ID {shareId} · {code.length.toLocaleString()} characters · Includes an integrity check · Not encrypted</p>
          <div className="share-actions">
            <button className="primary" onClick={() => void copy()}><Copy size={17} /> Copy code</button>
            <button className="secondary" onClick={() => void share()}><Share2 size={17} /> Share</button>
          </div>
        </>}
        <button className="text-btn muted" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}

export function ImportWorkoutCode({
  exercises,
  templates,
  importedShares,
  onImport,
  onClose,
  toast,
}: {
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  importedShares?: string[];
  onImport: (payload: WorkoutSharePayload) => void;
  onClose: () => void;
  toast: (message: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<WorkoutSharePayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const paste = async () => {
    try {
      setRaw(await navigator.clipboard.readText());
      setError("");
      toast("Code pasted");
    } catch { setError("Paste the sharing code into the box above."); }
  };
  const inspect = async () => {
    setBusy(true); setError("");
    try {
      const payload = await decodeShareCode(raw);
      const unknown = missingExerciseIds(payload.workout, exercises);
      if (unknown.length) throw new ShareCodeError(`This device is missing: ${unknown.join(", ")}. Import was not changed.`);
      setPreview(payload);
    } catch (reason) {
      setPreview(null);
      setError(reason instanceof Error ? reason.message : "Could not read this sharing code.");
    } finally { setBusy(false); }
  };
  const duplicate = !!preview && (
    importedShares?.includes(preview.shareId) ||
    templates.some((template) => sameSharedWorkout(template, preview.workout))
  );
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal share-modal" role="dialog" aria-modal="true" aria-labelledby="import-code-title">
        <div className="section-heading">
          <div><p className="eyebrow">ADD A SHARED WORKOUT</p><h2 id="import-code-title">Import code</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close import"><X /></button>
        </div>
        {!preview ? <>
          <p className="muted">Paste a RepUp workout code to preview it before it is added to your templates.</p>
          <textarea className="share-code import-code" aria-label="Workout sharing code" placeholder="RPU1.…" value={raw} onChange={(event) => setRaw(event.target.value)} />
          {error && <p className="share-error">{error}</p>}
          <div className="share-actions">
            <button className="secondary" onClick={() => void paste()}><Clipboard size={17} /> Paste</button>
            <button className="primary" disabled={busy || !raw.trim()} onClick={() => void inspect()}>{busy ? "Checking…" : "Preview workout"}</button>
          </div>
        </> : <>
          <p className="eyebrow">READY TO IMPORT</p>
          <h3>{preview.workout.name}</h3>
          <p className="fine">{preview.workout.exercises.length} exercises · {preview.workout.exercises.reduce((total, item) => total + item.targetSets, 0)} working sets</p>
          <div className="share-preview">
            {preview.workout.exercises.map((item) => {
              const exercise = exercises.find((entry) => entry.id === item.exerciseId)!;
              return <div key={item.exerciseId}><strong>{exercise.name}</strong><span>{item.targetSets} × {item.minReps}{item.maxReps >= 999 ? "+" : `–${item.maxReps}`} · RIR {item.minRir}–{item.maxRir}</span></div>;
            })}
          </div>
          {duplicate && <p className="share-warning">You already imported this workout or have an equivalent template. You can cancel or import another copy.</p>}
          <div className="share-actions">
            <button className="secondary" onClick={() => setPreview(null)}>Back</button>
            <button className="primary" onClick={() => onImport(preview)}><Check size={17} /> {duplicate ? "Import copy" : "Import workout"}</button>
          </div>
        </>}
        <button className="text-btn muted" onClick={onClose}>Cancel</button>
      </section>
    </div>
  );
}
