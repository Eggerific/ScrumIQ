import { type NextRequest, NextResponse } from "next/server";
import { deleteProjectWithArtifacts } from "@/lib/projects/delete-project-with-artifacts";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
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
        { error: "Only the project owner can delete this project" },
        { status: 403 }
      );
    }

    const result = await deleteProjectWithArtifacts(supabase, projectId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status ?? 500 }
      );
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
