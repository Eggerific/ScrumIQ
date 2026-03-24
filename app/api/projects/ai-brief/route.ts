import { NextResponse } from "next/server";
import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import { buildMockAiBrief } from "@/lib/projects/ai-brief-mock";

function isMockMode(): boolean {
  const m = process.env.SCRUMIQ_AI_MODE?.toLowerCase().trim();
  if (m === "live") return false;
  if (m === "mock") return true;
  return true;
}

function validateBody(body: unknown): body is ProjectAiBriefInput {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const str = (k: string) => typeof o[k] === "string";
  return (
    str("title") &&
    str("vision") &&
    str("targetUsers") &&
    str("success90d") &&
    str("constraints") &&
    str("freeformNotes")
  );
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!validateBody(json)) {
    return NextResponse.json(
      { error: "Missing or invalid brief fields" },
      { status: 400 }
    );
  }

  const input: ProjectAiBriefInput = {
    title: json.title.trim(),
    vision: json.vision.trim(),
    targetUsers: json.targetUsers.trim(),
    success90d: json.success90d.trim(),
    constraints: json.constraints.trim(),
    freeformNotes: json.freeformNotes.trim(),
  };

  if (input.title.length < 2) {
    return NextResponse.json(
      { error: "Title should be at least 2 characters" },
      { status: 400 }
    );
  }
  if (input.vision.length < 8) {
    return NextResponse.json(
      { error: "Vision / problem needs a bit more detail (8+ characters)" },
      { status: 400 }
    );
  }

  if (isMockMode()) {
    await new Promise((r) =>
      setTimeout(r, 650 + Math.floor(Math.random() * 500))
    );
    const brief = buildMockAiBrief(input);
    return NextResponse.json({ mode: "mock" as const, ...brief });
  }

  return NextResponse.json(
    {
      error:
        "Live AI is not implemented yet. Use SCRUMIQ_AI_MODE=mock (default) or implement the provider.",
    },
    { status: 501 }
  );
}
