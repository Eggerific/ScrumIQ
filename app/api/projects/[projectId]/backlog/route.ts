import { type NextRequest, NextResponse } from "next/server";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { persistProjectBacklog } from "@/lib/projects/persist-project-backlog";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAiBacklogDraftPayload(v: unknown): v is AiBacklogDraftPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.generatedAt !== "string") return false;
  if (o.artifactSource !== "stub" && o.artifactSource !== "live") return false;
  if (!Array.isArray(o.epics)) return false;
  for (const e of o.epics) {
    if (!e || typeof e !== "object") return false;
    const epic = e as Record<string, unknown>;
    if (typeof epic.id !== "string" || typeof epic.title !== "string") return false;
    if (typeof epic.description !== "string") return false;
    if (!Array.isArray(epic.stories)) return false;
    for (const s of epic.stories) {
      if (!s || typeof s !== "object") return false;
      const story = s as Record<string, unknown>;
      if (typeof story.id !== "string" || typeof story.title !== "string")
        return false;
      if (!Array.isArray(story.acceptanceCriteria)) return false;
      for (const line of story.acceptanceCriteria) {
        if (typeof line !== "string") return false;
      }
      if (!Array.isArray(story.tasks)) return false;
      for (const t of story.tasks) {
        if (!t || typeof t !== "object") return false;
        const task = t as Record<string, unknown>;
        if (typeof task.id !== "string" || typeof task.title !== "string")
          return false;
      }
    }
  }
  return true;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !json ||
    typeof json !== "object" ||
    !("draft" in json) ||
    !isAiBacklogDraftPayload((json as { draft: unknown }).draft)
  ) {
    return NextResponse.json(
      { error: "Body must include a valid backlog draft" },
      { status: 400 }
    );
  }

  const draft = (json as { draft: AiBacklogDraftPayload }).draft;

  try {
    const response = NextResponse.json({ ok: true });
    const supabase = createRouteHandlerClient(request, response);

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

    const result = await persistProjectBacklog(supabase, projectId, draft);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    const body = {
      ok: true,
      epicCount: result.epicCount,
      storyCount: result.storyCount,
      taskCount: result.taskCount,
    };
    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: response.headers,
    });
  } catch (err) {
    if (err instanceof Error && err.message === SUPABASE_CONFIG_ERROR_MESSAGE) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
