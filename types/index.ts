export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment?: string;
  imageUrl?: string;
  animationUrl?: string;
  instructions?: string[];
}
export interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  minRir: number;
  maxRir: number;
}
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}
export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rir?: number;
  completed: boolean;
  type: "warmup" | "working";
}
export interface WorkoutExercise extends TemplateExercise {
  name: string;
  sets: WorkoutSet[];
  note: string;
  skipped: boolean;
}
export interface WorkoutSession {
  id: string;
  templateId: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
}
export interface UserSettings {
  unit: "kg" | "lb";
  restSeconds: number;
  increment: number;
  rir: boolean;
  autoRest: boolean;
  sound: boolean;
  theme: "dark" | "light";
  avatarUrl?: string;
  accentColor?: import('@/lib/theme').AccentColor;
}
export interface Schedule {
  days: (string | null)[];
}
export interface AppData {
  version: 1;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  active: WorkoutSession | null;
  settings: UserSettings;
  schedule: Schedule;
}
