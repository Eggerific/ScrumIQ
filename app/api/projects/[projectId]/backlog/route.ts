import { type NextRequest, NextResponse } from "next/server";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { isAiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-guards";
import { persistProjectBacklog } from "@/lib/projects/persist-project-backlog";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

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

    const { data: projectRow, error: projectErr } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectErr) {
      return NextResponse.json({ error: projectErr.message }, { status: 500 });
    }
    if (!projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (projectRow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the project creator can save backlog items from AI Generation" },
        { status: 403 }
      );
    }

    const result = await persistProjectBacklog(supabase, projectId, draft);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    const { error: engagementErr } = await supabase
      .from("projects")
      .update({ ai_brief_engagement: "complete" })
      .eq("id", projectId)
      .eq("owner_id", user.id);

    if (engagementErr) {
      return NextResponse.json(
        {
          error: `Backlog saved but could not finalize AI Generation state: ${engagementErr.message}. Add column ai_brief_engagement on projects (see supabase/migrations) or retry.`,
        },
        { status: 500 }
      );
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
