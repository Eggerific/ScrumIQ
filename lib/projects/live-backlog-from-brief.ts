import Anthropic from "@anthropic-ai/sdk";
import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { buildStubBacklogDraftFromInput } from "@/lib/projects/ai-backlog-stub";
import {
  coerceToAiBacklogDraftPayload,
  parseBacklogDraftJsonFromModelText,
} from "@/lib/projects/ai-backlog-draft-guards";
import { enforceLiveBacklogDraftSafeguards } from "@/lib/projects/ai-backlog-draft-safeguards";
import {
  BUDGET_DEFAULT_ANTHROPIC_MODEL,
  resolveAnthropicMaxOutputTokens,
} from "@/lib/projects/ai-generation-cost-defaults";

const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 90_000;

const SYSTEM_GUARDRAILS = `You generate structured Scrum backlog JSON for the product brief provided by the user.

Hard rules:
- Stay strictly grounded in the user’s brief. Do not invent unrelated products, companies, or features.
- Do not output marketing slogans without concrete backlog meaning.
- Do not include URLs, email addresses, or phone numbers unless they appear verbatim in the brief.
- Do not refuse the task; if the brief is vague, make reasonable assumptions and state them briefly inside descriptions (still valid JSON strings only).
- Output a single JSON object only—no commentary before or after, no markdown fences.
- Every epic, story, task, and acceptance line must be specific to this initiative (no lorem ipsum, no "asdf", no TODO placeholders).
- Keep IDs alphanumeric plus hyphen/underscore; keep them unique across the document.
- Write tightly: short epic descriptions, concise acceptance lines, task titles under ~12 words unless the brief demands detail.

Structure & alignment:
- Epics must be **orthogonal themes** (e.g. foundation, core user value, constraints/risk, outcomes/metrics, quality/launch)—not the same story repeated under different names.
- Each epic description must say **why this theme matters for this brief** in one or two sentences.
- Every story must **clearly belong** to its parent epic; stories should not fit better under a sibling epic.
- Acceptance criteria must be **testable** (observable behavior or outcome), not vague platitudes.
- Use distinctive words from the **project title, vision, target users, 90-day success, and constraints** in epic/story text so the backlog visibly traces to the brief.`;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableAnthropicError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { status?: number; error?: { type?: string } };
  if (o.status === 429) return true;
  if (o.status === 529) return true;
  if (o.status !== undefined && o.status >= 500) return true;
  if (o.error?.type === "overloaded_error") return true;
  return false;
}

function buildLiveFallbackDraftFromInput(
  input: ProjectAiBriefInput
): AiBacklogDraftPayload {
  const stub = buildStubBacklogDraftFromInput(input);
  return {
    ...stub,
    generatedAt: new Date().toISOString(),
    artifactSource: "live",
  };
}

function briefPromptBlock(input: ProjectAiBriefInput): string {
  return [
    `Title: ${input.title}`,
    `Vision / problem: ${input.vision}`,
    `Target users: ${input.targetUsers}`,
    `90-day success: ${input.success90d}`,
    `Constraints: ${input.constraints}`,
    input.freeformNotes.trim()
      ? `Notes: ${input.freeformNotes}`
      : "Notes: (none)",
  ].join("\n");
}

const JSON_INSTRUCTION = `You are a senior product manager. Given the project brief, produce ONE backlog draft as compact JSON only (no markdown, no prose outside the object).

Required JSON shape:
{
  "generatedAt": "<ISO-8601 timestamp string, use current time>",
  "artifactSource": "live",
  "epics": [
    {
      "id": "unique string id per epic",
      "title": "string",
      "description": "string",
      "stories": [
        {
          "id": "unique string id per story",
          "title": "string",
          "acceptanceCriteria": ["string", "..."],
          "tasks": [{ "id": "unique string", "title": "string" }]
        }
      ]
    }
  ]
}

Rules (cost-aware — stay within this footprint):
- Emit **4–6 epics** (not more). Each epic: **1–3 stories**. Each story: **2–4 short acceptance criteria** and **2–4 tasks** with concrete verb-led titles (e.g. “Define…”, “Implement…”, “Validate…”).
- Epic descriptions: ~1–2 sentences tying the epic to **vision, users, 90-day success, or constraints** from the brief.
- Story titles name **user-visible or delivery outcomes**, not vague labels like “Phase 2” unless the brief uses that language.
- Acceptance criteria: one sentence each, **specific enough that QA could verify** them.
- Do **not** reuse the same story title in multiple epics; vary scope if ideas are related.
- IDs must be unique across the whole document.
- Prefer traceability to the brief over generic agile filler.
- Output only the JSON object, nothing else.`;

/**
 * Live path: calls Anthropic when `ANTHROPIC_API_KEY` is set; otherwise returns
 * the same deterministic structure as the client stub with `artifactSource: "live"`.
 */
export async function generateLiveBacklogDraftFromBrief(
  input: ProjectAiBriefInput
): Promise<
  | { ok: true; draft: AiBacklogDraftPayload }
  | { ok: false; message: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    const fallback = buildLiveFallbackDraftFromInput(input);
    const safe = enforceLiveBacklogDraftSafeguards(fallback, { brief: input });
    if (!safe.ok) {
      return { ok: false, message: safe.message };
    }
    return { ok: true, draft: safe.draft };
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || BUDGET_DEFAULT_ANTHROPIC_MODEL;
  const maxOutputTokens = resolveAnthropicMaxOutputTokens();
  const client = new Anthropic({ apiKey });

  const userContent = `${JSON_INSTRUCTION}\n\n---\nBrief:\n${briefPromptBlock(input)}`;

  let lastErr = "Model request failed.";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await client.messages.create(
        {
          model,
          max_tokens: maxOutputTokens,
          temperature: 0.2,
          system: SYSTEM_GUARDRAILS,
          messages: [{ role: "user", content: userContent }],
        },
        { signal: controller.signal }
      );
      clearTimeout(timer);

      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("")
        .trim();

      if (!text) {
        lastErr = "The model returned an empty response.";
        continue;
      }

      const parsed = parseBacklogDraftJsonFromModelText(text);
      if (!parsed) {
        lastErr = "Couldn’t parse backlog JSON from the model response.";
        continue;
      }

      const draft = coerceToAiBacklogDraftPayload(parsed);
      if (!draft) {
        lastErr = "Model JSON didn’t match the backlog shape.";
        continue;
      }

      const safe = enforceLiveBacklogDraftSafeguards(draft, { brief: input });
      if (!safe.ok) {
        lastErr = safe.message;
        continue;
      }

      return { ok: true, draft: safe.draft };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        lastErr = "The model request timed out. Try again with a shorter brief.";
      } else if (isRetryableAnthropicError(err) && attempt < MAX_ATTEMPTS) {
        lastErr = "The model is busy. Retrying…";
        await sleep(800 * attempt);
        continue;
      } else if (err instanceof Error) {
        lastErr = err.message || lastErr;
      }
    }
  }

  return { ok: false, message: lastErr };
}
