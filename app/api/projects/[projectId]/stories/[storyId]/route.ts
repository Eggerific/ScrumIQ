import { type NextRequest, NextResponse } from "next/server";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PatchBody = {
  in_sprint?: boolean;
  story_points?: number | null;
};

function parsePatchBody(json: unknown): PatchBody | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const patch: PatchBody = {};
  if ("in_sprint" in o) {
    if (typeof o.in_sprint !== "boolean") return null;
    patch.in_sprint = o.in_sprint;
  }
  if ("story_points" in o) {
    const sp = o.story_points;
    if (sp === null) {
      patch.story_points = null;
    } else if (typeof sp === "number" && Number.isInteger(sp) && sp >= 1 && sp <= 99) {
      patch.story_points = sp;
    } else {
      return null;
    }
  }
  if (Object.keys(patch).length === 0) return null;
  return patch;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; storyId: string }> }
) {
  const { projectId, storyId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId) || !storyId || !UUID_RE.test(storyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = parsePatchBody(json);
  if (!patch) {
    return NextResponse.json(
      {
        error:
          "Body must include in_sprint (boolean) and/or story_points (1–99 or null)",
      },
      { status: 400 }
    );
  }

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

    const { data: storyRow, error: storyErr } = await supabase
      .from("stories")
      .select("id, project_id")
      .eq("id", storyId)
      .maybeSingle();

    if (storyErr) {
      return NextResponse.json({ error: storyErr.message }, { status: 500 });
    }
    if (!storyRow || storyRow.project_id !== projectId) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from("stories")
      .update(patch)
      .eq("id", storyId)
      .eq("project_id", projectId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return new NextResponse(JSON.stringify({ ok: true }), {
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
