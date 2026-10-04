# RepUp original exercise illustrations

The 24 SVG illustrations in `public/exercises/` were authored specifically for RepUp using the original coordinate-based drawing code in `scripts/generate-exercise-art.mjs`.

No third-party exercise photography, illustration, animation, tracing, or commercial fitness-app media was incorporated. These project-original assets have no third-party attribution obligations. They may be used, modified, and distributed with RepUp. They are simplified movement-identification diagrams, with two static poses, not individualized coaching or a substitute for in-person technique instruction.

The generator is the editable source. Run `node scripts/generate-exercise-art.mjs` to reproduce all illustrations. The shared palette, human proportions, equipment strokes, and pose framing are deliberately consistent across all exercises.

Research considered:

- https://github.com/yuhonas/free-exercise-db — repository describes its dataset as public domain / Unlicense; its photographic style did not meet RepUp's consistent illustration direction. No assets or text copied.
- https://github.com/RepDB/exercise-dataset — separately licensed image dataset with attribution and redistribution conditions. No assets or text copied.

Geist Sans is separate third-party font software: Vercel / Basement Studio, official `geist` npm package **1.7.2**, `dist/fonts/geist-sans/Geist-Variable.woff2`. The unmodified local font is loaded with `next/font/local`. Its SIL Open Font License 1.1 is preserved in `Geist-OFL.txt` beside this notice. Source: https://github.com/vercel/geist-font.

## Coverage and identity

All 22 original seed exercises have an illustration. Cable SLDL (`cable-sldl`) and Calf Raise on Leg Press (`calf-raise-on-leg-press`) are added as two distinct exercise variants. Existing Romanian Deadlift and Calf Raise IDs are preserved. No template, schedule, active workout, or completed-session data is changed by the media enrichment. Any Push, Pull, Legs, Upper, or custom template using an existing global exercise ID shares its media and instructions.

No animations are shipped. Optional animation URLs are supported only in the demo view, loaded after pressing Play, and disabled when reduced motion is requested. Default SVGs are small, local, cached independently of the required app shell, and require no external service.
