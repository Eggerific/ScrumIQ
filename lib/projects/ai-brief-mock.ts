import type {
  ProjectAiBriefInput,
  ProjectAiBriefResponse,
  ProjectStructuredBrief,
} from "./ai-brief-types";

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildStructured(input: ProjectAiBriefInput): ProjectStructuredBrief {
  const title = input.title.trim() || "this initiative";
  const vision = input.vision.trim() || "the outcomes you described";
  const users = input.targetUsers.trim() || "primary stakeholders";
  const win = input.success90d.trim() || "measurable traction within 90 days";
  const guard = input.constraints.trim() || "standard delivery constraints";
  const free = input.freeformNotes.trim();

  const goals: string[] = [
    `Ship an MVP that validates ${clip(vision, 80)}`,
    `Establish a clear backlog slice that supports ${clip(win, 72)}`,
    `Keep delivery aligned with: ${clip(guard, 88)}`,
  ];
  if (free) {
    goals.push(`Honor additional PM context: ${clip(free, 96)}`);
  }

  const risks: string[] = [
    `Scope creep if "${clip(vision, 48)}" is interpreted too broadly`,
    "Under-defined success metrics for the 90-day window",
    guard.length > 12
      ? `Constraint pressure: ${clip(guard, 64)}`
      : "Unknown dependencies not yet listed",
  ];
  if (free) {
    risks.push(
      `Ambiguity or hidden assumptions in free-form notes: ${clip(free, 72)}`
    );
  }

  const base: ProjectStructuredBrief = {
    elevatorPitch: `${title}: ${clip(vision, 160)} Focused on ${users}; aiming for ${clip(win, 100)}.`,
    goals,
    nonGoals: [
      "Full platform parity before learning from the first release",
      "Optimizing for edge cases before core workflows feel great",
    ],
    risks,
    suggestedThemes: [
      {
        title: "Discovery & alignment",
        description:
          "Confirm problem, users, and success signals with stakeholders.",
      },
      {
        title: "MVP delivery",
        description: `Narrow scope to prove value around: ${clip(vision, 72)}`,
      },
      {
        title: "Measure & iterate",
        description: `Instrument feedback loops tied to: ${clip(win, 72)}`,
      },
    ],
    acceptanceHints: [
      "Each theme maps to at least one testable user outcome",
      "Sprint goals reference the 90-day success statement",
      "Non-goals are visible on the board to deflect mid-sprint additions",
    ],
  };

  if (free) {
    base.freeformSummary =
      free.length <= 320 ? free : `${free.slice(0, 319)}…`;
  }

  return base;
}

/** Deterministic mock — safe for UI testing, no external calls. */
export function buildMockAiBrief(
  input: ProjectAiBriefInput
): Omit<ProjectAiBriefResponse, "mode"> {
  const title = input.title.trim() || "Your project";
  const structured = buildStructured(input);

  const ff = input.freeformNotes.trim();
  const narrative = [
    `I've drafted a working brief for "${title}" based on your PM context.`,
    "",
    structured.elevatorPitch,
    "",
    ...(ff
      ? [
          "Additional context (free-form):",
          ff.length <= 400 ? ff : `${ff.slice(0, 399)}…`,
          "",
        ]
      : []),
    `For the next step, I'd prioritize: ${structured.suggestedThemes[0]?.title ?? "Discovery"} — then line up backlog items under the themes below.`,
    "",
    "Mock mode — no credits. Set SCRUMIQ_AI_MODE=live when a real provider is wired.",
  ].join("\n");

  return { narrative, structured };
}
