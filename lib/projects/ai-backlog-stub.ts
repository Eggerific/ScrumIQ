import type { ProjectAiBriefInput } from "./ai-brief-types";
import type {
  AiBacklogDraftPayload,
  AiGeneratedEpic,
  AiGeneratedStory,
} from "./ai-backlog-draft-types";

function id(prefix: string, i: number, j?: number, k?: number): string {
  return [prefix, i, j, k].filter((x) => x !== undefined).join("-");
}

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function story(
  ei: number,
  si: number,
  title: string,
  ac: string[],
  taskTitles: string[]
): AiGeneratedStory {
  return {
    id: id("story", ei, si),
    title,
    acceptanceCriteria: ac,
    tasks: taskTitles.map((t, ti) => ({
      id: id("task", ei, si, ti),
      title: t,
    })),
  };
}

/**
 * Produces **6 epics** (3×2 grid in UI) for review. Replace with API output later.
 */
export function buildStubBacklogDraftFromInput(
  input: ProjectAiBriefInput
): AiBacklogDraftPayload {
  const title = input.title.trim();
  const vision = input.vision.trim();
  const users = input.targetUsers.trim();
  const success = input.success90d.trim();
  const constraints = input.constraints.trim();
  const notes = input.freeformNotes.trim();

  const acCtx = [
    `Serves ${clip(users, 100)} and supports: ${clip(success, 120)}`,
    `Honors constraints: ${clip(constraints, 140)}`,
  ];
  if (notes) acCtx.push(`Notes: ${clip(notes, 100)}`);

  const epics: AiGeneratedEpic[] = [
    {
      id: id("epic", 0),
      title: `Foundation — ${clip(title, 56)}`,
      description: clip(vision, 240),
      stories: [
        story(0, 0, `Core scope for ${clip(title, 40)}`, [
          `Delivered behavior reflects: ${clip(vision, 90)}`,
          acCtx[0]!,
        ], [
          "Align backlog to vision",
          "First vertical slice",
          "Validate success signals",
        ]),
        story(0, 1, "Learning loops and instrumentation", [
          "Stakeholders can see progress toward 90-day goals.",
          "Risks and constraints are visible in tracking.",
        ], ["Define signals", "Wire analytics or check-ins"]),
      ],
    },
    {
      id: id("epic", 1),
      title: `User value — ${clip(users, 36)}`,
      description: `Adoption and workflows for ${clip(users, 180)}.`,
      stories: [
        story(1, 0, `Primary journeys for ${clip(users, 48)}`, [
          "Critical paths complete without blockers.",
          acCtx[1]!,
        ], ["Journey map", "Build UX", "Test with users"]),
        story(1, 1, "Rollout readiness", [
          "Success metrics are trackable.",
          "Constraint tradeoffs documented.",
        ], ["Polish", "Release checklist"]),
      ],
    },
    {
      id: id("epic", 2),
      title: "Delivery & risk",
      description: clip(constraints, 220),
      stories: [
        story(2, 0, "Mitigate product and delivery risks", [
          `Plan aligns with: ${clip(constraints, 120)}`,
          notes ? clip(notes, 100) : "Risks logged with owners.",
        ], ["Risk log", "Dependency review"]),
        story(2, 1, "Execution readiness", [
          `Work traces to: ${clip(success, 100)}`,
          "Definition of ready agreed for top items.",
        ], ["Refinement", "Stakeholder sign-off"]),
      ],
    },
    {
      id: id("epic", 3),
      title: `Outcomes — ${clip(success, 48)}`,
      description: `Ninety-day focus: ${clip(success, 200)}`,
      stories: [
        story(3, 0, "Measure outcomes, not just output", [
          "Leading indicators visible within the sprint cadence.",
          "Teams can explain how work ties to success.",
        ], ["Define metrics", "Dashboard or review ritual"]),
      ],
    },
    {
      id: id("epic", 4),
      title: "Integration & platform",
      description: `Connect ${clip(title, 40)} with adjacent systems and data.`,
      stories: [
        story(4, 0, "Stable integrations", [
          "Contracts and error handling documented.",
          "Rollback path exists for risky changes.",
        ], ["API contracts", "Integration tests"]),
        story(4, 1, "Observability", [
          "Logs/metrics sufficient to debug production issues.",
        ], ["Tracing", "Alerts"]),
      ],
    },
    {
      id: id("epic", 5),
      title: "Quality & launch",
      description: "Hardening, accessibility, and go-live confidence.",
      stories: [
        story(5, 0, "Quality bar before launch", [
          "Critical defects addressed; known gaps documented.",
          "Accessibility baseline met for primary flows.",
        ], ["QA pass", "Bug burn-down"]),
        story(5, 1, "Launch playbook", [
          "Support and rollback steps rehearsed.",
        ], ["Runbook", "Comms checklist"]),
      ],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    artifactSource: "stub",
    epics,
  };
}

export function delayGenerationMs(): Promise<void> {
  const ms = 900 + Math.floor(Math.random() * 600);
  return new Promise((r) => setTimeout(r, ms));
}
