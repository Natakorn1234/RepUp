import { AppData, Exercise } from "@/types";

// Original RepUp illustrations and cues. IDs, not display names, link every usage.
const descriptions: Record<string, [string[], string[]]> = {
  "incline-press": [
    ["Front delts", "Triceps"],
    [
      "Set an incline bench around 30–45° and plant your feet.",
      "Keep your upper back against the pad and wrists over elbows.",
      "Lower the weights toward your upper chest with control.",
      "Press upward through a comfortable range without bouncing.",
    ],
  ],
  "pec-deck": [
    ["Front delts"],
    [
      "Adjust the seat so the handles are near chest height.",
      "Sit tall with your back supported and elbows softly bent.",
      "Bring the handles together in front of your chest.",
      "Open slowly to a comfortable stretch without forcing your shoulders back.",
    ],
  ],
  "flat-bench-press": [
    ["Triceps", "Front delts"],
    [
      "Lie on a flat bench with feet planted and upper back stable.",
      "Hold the bar with wrists stacked over your forearms.",
      "Lower toward your chest under control.",
      "Press up evenly, keeping your shoulders supported.",
    ],
  ],
  "shoulder-press": [
    ["Triceps", "Upper chest"],
    [
      "Sit with your back supported and feet planted.",
      "Start with the weights near shoulder height, forearms upright.",
      "Press overhead without arching your lower back.",
      "Lower slowly to a comfortable shoulder position.",
    ],
  ],
  "lateral-raise": [
    ["Upper traps"],
    [
      "Stand tall with light dumbbells by your sides.",
      "Keep a soft bend in your elbows and your ribs stacked over your hips.",
      "Raise your arms out slightly forward of your sides to around shoulder height.",
      "Lower slowly without swinging your torso.",
    ],
  ],
  "triceps-pushdown": [
    [],
    [
      "Attach a bar or rope to a high cable pulley.",
      "Keep your upper arms close to your sides and your elbows bent.",
      "Extend your elbows, bringing the attachment toward your thighs.",
      "Return slowly while keeping your upper arms still.",
    ],
  ],
  "overhead-triceps-extension": [
    [],
    [
      "Hold a dumbbell overhead with both hands and a stable stance.",
      "Keep your ribs down and upper arms near your head.",
      "Bend your elbows to lower the weight behind your head.",
      "Extend your elbows through a comfortable range.",
    ],
  ],
  "wide-grip-lat-pulldown": [
    ["Biceps", "Rear delts"],
    [
      "Set the thigh pad snugly and grip the bar wider than shoulder width.",
      "Sit tall with a small backward lean.",
      "Pull the bar toward your upper chest, driving elbows down.",
      "Return overhead slowly without pulling behind your neck.",
    ],
  ],
  "neutral-grip-pulldown": [
    ["Biceps", "Rear delts"],
    [
      "Attach parallel handles and secure your thighs under the pad.",
      "Hold with palms facing each other and chest lifted.",
      "Pull the handles toward your upper chest.",
      "Let your arms extend overhead with control.",
    ],
  ],
  "seated-row": [
    ["Biceps", "Rear delts"],
    [
      "Sit at a low cable with feet braced and knees slightly bent.",
      "Keep your torso tall and reach forward without rounding your back.",
      "Pull the handle toward your lower ribs.",
      "Return slowly without rocking your body.",
    ],
  ],
  "reverse-pec-deck": [
    ["Upper back"],
    [
      "Face the machine pad and set handles near shoulder height.",
      "Keep your chest supported and a slight bend in your elbows.",
      "Open your arms out to the sides without shrugging.",
      "Return the handles forward slowly.",
    ],
  ],
  "biceps-curl": [
    ["Forearms"],
    [
      "Stand tall with dumbbells by your sides, palms facing forward.",
      "Keep elbows near your torso and shoulders still.",
      "Curl the weights toward your shoulders without swinging.",
      "Lower slowly until your arms are comfortably extended.",
    ],
  ],
  "hammer-curl": [
    ["Forearms", "Brachialis"],
    [
      "Hold dumbbells by your sides with palms facing inward.",
      "Keep your upper arms still and wrists neutral.",
      "Curl toward your shoulders while maintaining the neutral grip.",
      "Lower slowly without leaning backward.",
    ],
  ],
  "leg-press": [
    ["Glutes"],
    [
      "Adjust the seat and place feet around shoulder width on the platform.",
      "Keep your back and hips against the pad.",
      "Bend your knees to a comfortable depth without your hips lifting.",
      "Press the platform away without forcefully locking your knees.",
    ],
  ],
  "lying-leg-curl": [
    ["Calves"],
    [
      "Lie face down with the roller above your heels.",
      "Align your knees with the machine pivot and hold the handles.",
      "Curl your heels toward your glutes while keeping hips against the pad.",
      "Lower slowly without letting the stack slam.",
    ],
  ],
  "romanian-deadlift": [
    ["Glutes", "Back"],
    [
      "Stand with the bar near your thighs and knees softly bent.",
      "Push your hips backward, keeping the bar close to your legs.",
      "Lower until you feel a hamstring stretch while keeping your back stable.",
      "Drive your hips forward to stand tall without leaning back.",
    ],
  ],
  "cable-sldl": [
    ["Glutes", "Back"],
    [
      "Face a low pulley and hold a straight-bar attachment.",
      "Keep a soft, nearly fixed knee bend and brace your torso.",
      "Hinge at your hips, moving them backward as the handle lowers.",
      "Stand by driving your hips forward, keeping the cable under control.",
    ],
  ],
  "leg-extension": [
    [],
    [
      "Adjust the seat so your knees line up with the machine pivot.",
      "Place the roller across the front of your lower shins.",
      "Straighten your knees smoothly without kicking.",
      "Lower with control while keeping your hips on the seat.",
    ],
  ],
  "calf-raise": [
    [],
    [
      "Stand with the balls of your feet on a stable raised surface.",
      "Use a support for balance and keep your knees softly extended.",
      "Raise your heels as high as comfortable without rolling your ankles.",
      "Lower your heels slowly through a comfortable range.",
    ],
  ],
  "calf-raise-on-leg-press": [
    [],
    [
      "Set up on a leg press with your back and hips supported.",
      "Place the balls of your feet on the lower platform edge with secure contact.",
      "Keep knees softly extended and press through the balls of your feet.",
      "Lower your heels slowly without letting your feet slip.",
    ],
  ],
  "cable-crunch": [
    [],
    [
      "Kneel beneath a high pulley with the rope beside your head.",
      "Keep your hips steady and the rope close to your temples.",
      "Curl your ribs toward your pelvis rather than pulling with your arms.",
      "Return slowly without letting the cable pull you into a large back arch.",
    ],
  ],
  plank: [
    ["Glutes", "Shoulders"],
    [
      "Place your elbows under your shoulders and extend your legs.",
      "Brace your abdomen and gently squeeze your glutes.",
      "Keep your head, torso, and hips in a steady line.",
      "Breathe steadily and stop the hold when you cannot maintain position.",
    ],
  ],
  "hip-thrust": [
    ["Hamstrings"],
    [
      "Support your upper back on a stable bench and place feet flat.",
      "Position the padded bar across your hips and keep your chin gently tucked.",
      "Drive through your feet to lift your hips until your torso is roughly level.",
      "Lower under control without overextending your lower back.",
    ],
  ],
  "glute-bridge": [
    ["Hamstrings"],
    [
      "Lie on your back with knees bent and feet flat.",
      "Brace your abdomen and keep your ribs down.",
      "Press through your feet to lift your hips.",
      "Lower slowly without pushing into a large lower-back arch.",
    ],
  ],
};

export const additionalExercises: Exercise[] = [
  {
    id: "cable-sldl",
    name: "Cable SLDL",
    primaryMuscle: "Hamstrings",
    equipment: "Cable",
  },
  {
    id: "calf-raise-on-leg-press",
    name: "Calf Raise on Leg Press",
    primaryMuscle: "Calves",
    equipment: "Leg press machine",
  },
];
export function withExerciseDefaults(exercise: Exercise): Exercise {
  const defaults = descriptions[exercise.id];
  if (!defaults) return exercise;
  return {
    imageUrl: `/exercises/${exercise.id}.svg`,
    secondaryMuscles: defaults[0],
    instructions: defaults[1],
    ...exercise,
  };
}
// Additive v1 migration: session snapshots, templates, schedules, and custom fields
// remain untouched. Missing optional presentation fields are resolved by global ID.
export function withMediaDefaults(data: AppData): AppData {
  return {
    ...data,
    exercises: [
      ...data.exercises,
      ...additionalExercises.filter(
        (e) => !data.exercises.some((x) => x.id === e.id),
      ),
    ].map(withExerciseDefaults),
  };
}
export function safeMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^\/(?!\/)[^\\\s]*$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}
