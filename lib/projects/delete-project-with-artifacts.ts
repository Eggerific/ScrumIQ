import type { SupabaseClient } from "@supabase/supabase-js";

const RPC_HINT =
  "Run supabase/migrations/20260409140000_rpc_delete_project_for_owner.sql in the Supabase SQL Editor (see README).";

/**
 * Deletes a project and related rows in one transaction via a SECURITY DEFINER RPC.
 * Table-by-table deletes from the client are unreliable under RLS: DELETE can affect 0 rows
 * while post-delete SELECT counts also return 0 if SELECT policies hide rows — then deleting
 * `projects` hits epics_project_id_fkey. The RPC runs deletes as the function owner and only
 * checks auth.uid() against projects.owner_id.
 */
export async function deleteProjectWithArtifacts(
  supabase: SupabaseClient,
  projectId: string
): Promise<
  { ok: true } | { ok: false; message: string; status?: number }
> {
  const { error } = await supabase.rpc("delete_project_for_owner", {
    p_project_id: projectId,
  });

  if (error) {
    const msg = error.message ?? String(error);
    if (
      /function .* does not exist|Could not find the function/i.test(msg) ||
      msg.includes("PGRST202")
    ) {
      return {
        ok: false,
        message: `delete_project_for_owner RPC is missing. ${RPC_HINT}`,
        status: 500,
      };
    }
    const forbidden =
      error.code === "42501" || /^forbidden$/i.test(msg.trim());
    const status = forbidden ? 403 : 500;
    return { ok: false, message: msg, status };
  }

  return { ok: true };
}
