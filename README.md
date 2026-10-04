# RepUp

A mobile-first, local-only progressive overload workout tracker built with Next.js App Router, TypeScript, Tailwind CSS, Lucide, and Recharts.

## Run

```sh
npm install
npm run dev
```

Visit http://localhost:3000. For installability and offline testing:

```sh
npm run build
npm start
```

Service worker registration is enabled in production only. Open the app online once to cache its shell, then install it using your browser's install/Add to Home Screen action. Deployment requires HTTPS (localhost is also supported). No server APIs, accounts, or database are used.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

## Data and behavior

- `types/`: templates, independent session snapshots, sets, settings, schedule, and versioned backup models.
- `lib/storage/`: the localStorage adapter and backup validation; replace this boundary to introduce another storage provider.
- `lib/progression/`: pure, conservative progression and PR functions.
- `lib/calculations/`: previous performance, Epley, canonical kg conversion, volume, and duration.
- `components/workout/`: set logging, templates, exercise picker, and session review.
- `components/progress/`: charts, consistency, records, and exercise history.

Seed data contains editable Push/Pull/Legs templates and common exercises, with no fabricated workout history. The weekly schedule supports rest days. Every workout edit is saved immediately. History is a snapshot, so editing a template does not change prior sessions.

Progress compares completed working sets of equal count. More reps must not reduce any matching set's reps; increased load must stay in the configured range; available RIR must not show increased effort. Extra volume alone is not progression. Unmatched sets or effort are contextualized as maintained. Epley estimates apply to 1–12 reps. PRs include maximum weight, estimated 1RM, and reps at a previously logged weight; the first session establishes a baseline.

Weights are stored in kg and converted for display. A load increase is always a suggestion. Browser audio is initialized during a user interaction and vibration is used where supported. Timer alerts are best-effort while the app is running; browsers may suspend background apps.

Backups include all data and schema version 1. Imports validate before asking permission to replace data. Local data is device/browser-specific; export regularly, especially before clearing site data.

## Exercise visuals and typography

Geist Sans is bundled locally through `next/font/local`; builds and runtime do not contact a font CDN. Weight, reps, RIR, durations, timers, and statistics use tabular figures.

The shared exercise library includes 24 original, local SVG illustrations (about 114 KB combined) plus short original movement cues. Each image shows two static positions in a consistent visual style. See [asset provenance and permissions](public/licenses/EXERCISE-ART.md) and the [Geist SIL Open Font License](public/licenses/Geist-OFL.txt). Regenerate the editable vector assets with `node scripts/generate-exercise-art.mjs`.

`ExerciseMedia` supports thumbnail, card, and demo sizes. Missing images show a stable icon placeholder. Optional animations load only after a tap in the demo sheet; reduced-motion users receive the static image. No animations or third-party exercise media are bundled.

Media enrichment remains schema v1: optional exercise fields are populated by global exercise ID when loading/importing. It is idempotent, preserves custom metadata, and leaves all workout snapshots, templates, schedules, settings, and progression calculations untouched. Cable SLDL and Calf Raise on Leg Press are additional global variants; existing Romanian Deadlift and Calf Raise history retains its original identity.

Production builds precache the font and all default illustrations. Media caching uses separate best-effort requests, so a missing illustration cannot prevent installation of the required offline app shell.
