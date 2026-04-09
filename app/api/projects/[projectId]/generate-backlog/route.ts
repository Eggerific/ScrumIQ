import { type NextRequest, NextResponse } from "next/server";
import { isMockAiMode } from "@/lib/projects/ai-mode";
import { parseProjectAiBriefBody } from "@/lib/projects/project-ai-brief-body";
import { generateLiveBacklogDraftFromBrief } from "@/lib/projects/live-backlog-from-brief";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

export const maxDuration = 120;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  if (isMockAiMode(process.env.SCRUMIQ_AI_MODE)) {
    return NextResponse.json(
      {
        error:
          "Live backlog generation is disabled. Set SCRUMIQ_AI_MODE=live in .env.local to use this endpoint.",
      },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseProjectAiBriefBody(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  try {
    const baseResponse = NextResponse.json({ ok: true });
    const supabase = createRouteHandlerClient(request, baseResponse);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: memError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    const { data: projectRow, error: projectErr } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectErr) {
      return NextResponse.json({ error: projectErr.message }, { status: 500 });
    }
    if (!projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const gen = await generateLiveBacklogDraftFromBrief(parsed.input);
    if (!gen.ok) {
      return NextResponse.json(
        { error: gen.message },
        { status: 502 }
      );
    }

    return new NextResponse(JSON.stringify({ draft: gen.draft }), {
      status: 200,
      headers: baseResponse.headers,
    });
  } catch (err) {
    if (err instanceof Error && err.message === SUPABASE_CONFIG_ERROR_MESSAGE) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
