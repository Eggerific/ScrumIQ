import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

const BOARD_STATUSES = ["To Do", "In Progress", "Done"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_STORY_DESCRIPTION = 32000;
const MAX_STORY_ACCEPTANCE_CRITERIA = 32000;
const MAX_STORY_NOTES = 32000;
const MAX_TASK_TITLE = 2000;
const MAX_TASK_LINES = 120;

function clipMultiline(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

type PatchBody = {
  in_sprint?: boolean;
  story_points?: number | null;
  description?: string;
  acceptance_criteria?: string;
  notes?: string;
  /** Replaces all tasks for the story; clears `description` (tasks live in rows only). */
  task_titles?: string[];
  /** Project member / user id assigned to the whole story. */
  assigned_to?: string | null;
  /** Kanban column (stored on `stories.board_status`). */
  board_status?: (typeof BOARD_STATUSES)[number];
  /** Kanban severity 0 = Low … 3 = Critical (`stories.priority_level`). */
  priority_level?: number;
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
  if ("description" in o) {
    if (typeof o.description !== "string") return null;
    patch.description = clipMultiline(o.description, MAX_STORY_DESCRIPTION);
  }
  if ("acceptance_criteria" in o) {
    if (typeof o.acceptance_criteria !== "string") return null;
    patch.acceptance_criteria = clipMultiline(
      o.acceptance_criteria,
      MAX_STORY_ACCEPTANCE_CRITERIA
    );
  }
  if ("notes" in o) {
    if (typeof o.notes !== "string") return null;
    patch.notes = clipMultiline(o.notes, MAX_STORY_NOTES);
  }
  if ("assigned_to" in o) {
    const at = o.assigned_to;
    if (at === null) {
      patch.assigned_to = null;
    } else if (typeof at === "string" && UUID_RE.test(at)) {
      patch.assigned_to = at;
    } else {
      return null;
    }
  }
  if ("board_status" in o) {
    const bs = o.board_status;
    if (typeof bs !== "string" || !BOARD_STATUSES.includes(bs as (typeof BOARD_STATUSES)[number])) {
      return null;
    }
    patch.board_status = bs as (typeof BOARD_STATUSES)[number];
  }
  if ("priority_level" in o) {
    const pl = o.priority_level;
    if (typeof pl !== "number" || !Number.isInteger(pl) || pl < 0 || pl > 3) {
      return null;
    }
    patch.priority_level = pl;
  }
  if ("task_titles" in o) {
    const tt = o.task_titles;
    if (!Array.isArray(tt)) return null;
    if (tt.length > MAX_TASK_LINES) return null;
    const titles: string[] = [];
    for (const item of tt) {
      if (typeof item !== "string") return null;
      titles.push(clipMultiline(item, MAX_TASK_TITLE));
    }
    patch.task_titles = titles;
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
          "Body must include at least one of: in_sprint (boolean), story_points (1–99 or null), description (string), acceptance_criteria (string), notes (string), task_titles (string[]), assigned_to (uuid or null), board_status (To Do | In Progress | Done), priority_level (0–3)",
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

    const { task_titles, ...storyFields } = patch;
    const storyUpdate: Record<string, unknown> = { ...storyFields };
    if (task_titles !== undefined) {
      storyUpdate.description = "";
    }

    const { error: updateErr } = await supabase
      .from("stories")
      .update(storyUpdate)
      .eq("id", storyId)
      .eq("project_id", projectId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (task_titles !== undefined) {
      const { error: delErr } = await supabase
        .from("tasks")
        .delete()
        .eq("story_id", storyId);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      let priority = 0;
      const rows: {
        id: string;
        story_id: string;
        project_id: string;
        title: string;
        description: null;
        priority: number;
      }[] = [];
      for (const rawTitle of task_titles) {
        const t = rawTitle.trim();
        if (!t) continue;
        rows.push({
          id: randomUUID(),
          story_id: storyId,
          project_id: projectId,
          title: clipMultiline(t, MAX_TASK_TITLE),
          description: null,
          priority: priority++,
        });
      }
      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("tasks").insert(rows);
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
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
