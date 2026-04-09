import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";

type RpcPayload = {
  ok?: boolean;
  reason?: string;
  count?: number;
  max?: number;
};

export type InviteeCapacityResult =
  | { allowed: true; inviteeProjectCount: number }
  | {
      allowed: false;
      code:
        | "at_project_limit"
        | "not_project_member"
        | "not_authenticated"
        | "rpc_error"
        | "invalid_response";
      message: string;
      inviteeProjectCount?: number;
    };

/**
 * Server-side cap check (Postgres RPC). Requires migration
 * `check_invitee_project_capacity` — inviter must be a member of the project.
 */
export async function checkInviteeProjectCapacity(
  supabase: SupabaseClient,
  inviteeId: string,
  projectId: string
): Promise<InviteeCapacityResult> {
  const { data, error } = await supabase.rpc("check_invitee_project_capacity", {
    p_invitee_id: inviteeId,
    p_project_id: projectId,
  });

  if (error) {
    return {
      allowed: false,
      code: "rpc_error",
      message:
        error.message?.includes("check_invitee_project_capacity") ||
        error.code === "PGRST202"
          ? "Project capacity check is not available yet. Ask an admin to apply the latest database migration."
          : "Could not verify whether this user can join another project. Try again.",
    };
  }

  const payload = data as RpcPayload | null;
  if (!payload || typeof payload.ok !== "boolean") {
    return {
      allowed: false,
      code: "invalid_response",
      message: "Could not verify whether this user can join another project. Try again.",
    };
  }

  const count =
    typeof payload.count === "number" && Number.isFinite(payload.count)
      ? payload.count
      : 0;
  const max =
    typeof payload.max === "number" && Number.isFinite(payload.max)
      ? payload.max
      : MAX_PROJECTS_ON_WORKSPACE_LIST;

  if (payload.ok) {
    return { allowed: true, inviteeProjectCount: count };
  }

  if (payload.reason === "at_project_limit") {
    return {
      allowed: false,
      code: "at_project_limit",
      message: `This person already has the maximum of ${max} active projects. They need to leave one before they can join another.`,
      inviteeProjectCount: count,
    };
  }

  if (payload.reason === "not_project_member") {
    return {
      allowed: false,
      code: "not_project_member",
      message: "You must be a member of this project to invite others.",
    };
  }

  if (payload.reason === "not_authenticated") {
    return {
      allowed: false,
      code: "not_authenticated",
      message: "You must be signed in to invite members.",
    };
  }

  return {
    allowed: false,
    code: "invalid_response",
    message: "Could not verify whether this user can join another project. Try again.",
  };
}
