import Anthropic from "@anthropic-ai/sdk";
import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { buildStubBacklogDraftFromInput } from "@/lib/projects/ai-backlog-stub";
import {
  coerceToAiBacklogDraftPayload,
  parseBacklogDraftJsonFromModelText,
} from "@/lib/projects/ai-backlog-draft-guards";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 90_000;

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

const JSON_INSTRUCTION = `You are a senior product manager. Given the project brief, produce a backlog draft as a single JSON object only (no markdown outside the JSON).

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

Rules:
- Emit 4–8 epics with 1–4 stories each; each story has at least 2 acceptance criteria and 2–6 tasks with concrete titles.
- IDs must be unique across the whole document.
- Text must be specific to the brief (no lorem ipsum).
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
    return { ok: true, draft: buildLiveFallbackDraftFromInput(input) };
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
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
          max_tokens: 16_384,
          temperature: 0.3,
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

      return { ok: true, draft };
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
