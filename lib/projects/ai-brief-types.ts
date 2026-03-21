/** PM-provided context before AI (or mock) expands it. */
export interface ProjectAiBriefInput {
  title: string;
  vision: string;
  targetUsers: string;
  success90d: string;
  constraints: string;
  freeformNotes: string;
}

/** Shape we’ll align real model JSON output to later. */
export interface ProjectStructuredBrief {
  elevatorPitch: string;
  goals: string[];
  nonGoals: string[];
  risks: string[];
  suggestedThemes: { title: string; description: string }[];
  acceptanceHints: string[];
  freeformSummary?: string;
}

export interface ProjectAiBriefResponse {
  mode: "mock" | "live";
  narrative: string;
  structured: ProjectStructuredBrief;
}
