import { NextResponse } from "next/server";
import { buildMockAiBrief } from "@/lib/projects/ai-brief-mock";
import { isMockAiMode } from "@/lib/projects/ai-mode";
import { parseProjectAiBriefBody } from "@/lib/projects/project-ai-brief-body";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseProjectAiBriefBody(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const input = parsed.input;

  if (isMockAiMode(process.env.SCRUMIQ_AI_MODE)) {
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
