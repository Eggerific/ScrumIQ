"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import {
  buildStubBacklogDraftFromInput,
  delayGenerationMs,
} from "@/lib/projects/ai-backlog-stub";
import {
  GenerateBacklogClientError,
  postProjectGenerateBacklog,
} from "@/lib/projects/generate-backlog-client";
import {
  readBacklogDraft,
  writeBacklogDraft,
} from "@/lib/projects/backlog-draft-storage";
import {
  readAiBriefEngagement,
  writeAiBriefEngagement,
} from "@/lib/projects/ai-brief-storage";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ArtifactReviewPanel } from "@/components/projects/ai-flow/ArtifactReviewPanel";
import { AiGenerateConfirmModal } from "@/components/projects/ai-flow/AiGenerateConfirmModal";
import { BacklogGenerationLoadingState } from "@/components/projects/ai-flow/BacklogGenerationLoadingState";
import { GreenBeamPanel } from "@/components/projects/ai-flow/GreenBeamPanel";
import { SECONDARY_BTN_CLASS } from "@/components/projects/ai-flow/flow-constants";
import { cn } from "@/lib/utils";
import { useAiConfig } from "@/hooks/use-ai-config";
import {
  clearGenerationPending,
  markGenerationPending,
  readGenerationPending,
} from "@/lib/projects/generation-pending-storage";
import { validateBriefForBacklogGeneration } from "@/lib/projects/project-brief-generation-limits";

type Phase = "form" | "generating" | "artifact-review" | "error";

/** Client fetch timeout — keep in sync with user-facing copy below. */
const CLIENT_GENERATION_TIMEOUT_MS = 125_000;
/** How long we show “refresh may have interrupted” after a pending marker. */
const GENERATION_PENDING_HINT_MS = CLIENT_GENERATION_TIMEOUT_MS + 15_000;

/** Inset fields: neutral border until focused, then green accent (beam). */
const INPUT_CLASS =
  "w-full rounded-lg border-2 border-[var(--app-sidebar-border)] bg-[var(--background)] px-3.5 py-3 text-base leading-relaxed text-[var(--foreground)] placeholder:text-zinc-500 font-sans outline-none transition-[border-color,box-shadow] focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/35";

const FIELD_HELP: Record<keyof ProjectAiBriefInput, string> = {
  title: "Short name for this project or initiative—used to group generated work.",
  vision: "The core problem, opportunity, or outcome you’re pursuing.",
  targetUsers: "Primary personas, teams, or customers who will use what you ship.",
  success90d: "Signals you’ll use within three months to know you’re on track.",
  constraints: "Limits such as budget, timeline, tech stack, compliance, or scope.",
  freeformNotes: "Extra context—dependencies, links, or risks (optional).",
};

const emptyInput: ProjectAiBriefInput = {
  title: "",
  vision: "",
  targetUsers: "",
  success90d: "",
  constraints: "",
  freeformNotes: "",
};

function validateBriefForm(
  v: ProjectAiBriefInput
): Partial<Record<keyof ProjectAiBriefInput, string>> {
  const e: Partial<Record<keyof ProjectAiBriefInput, string>> = {};
  const title = v.title.trim();
  const vision = v.vision.trim();
  if (title.length < 2) e.title = "Title needs at least 2 characters.";
  if (vision.length < 8)
    e.vision = "Vision needs a bit more detail (8+ characters).";
  if (!v.targetUsers.trim()) e.targetUsers = "Describe who this is for.";
  if (!v.success90d.trim()) e.success90d = "Describe what success looks like in 90 days.";
  if (!v.constraints.trim()) e.constraints = "List constraints or write “None” if truly open.";
  return e;
}

function toPayload(v: ProjectAiBriefInput): ProjectAiBriefInput {
  return {
    title: v.title.trim(),
    vision: v.vision.trim(),
    targetUsers: v.targetUsers.trim(),
    success90d: v.success90d.trim(),
    constraints: v.constraints.trim(),
    freeformNotes: v.freeformNotes.trim(),
  };
}

interface ProjectAiFlowViewProps {
  projectId: string;
  projectName: string;
}

export function ProjectAiFlowView({
  projectId,
  projectName,
}: ProjectAiFlowViewProps) {
  const aiConfig = useAiConfig();
  const router = useRouter();
  const { projects, updateProject } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const formTitleId = useId();
  const errSummaryId = useId();

  const [phase, setPhase] = useState<Phase>("form");
  const [input, setInput] = useState<ProjectAiBriefInput>(emptyInput);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProjectAiBriefInput, string>>
  >({});
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  const [draft, setDraft] = useState<AiBacklogDraftPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [briefLimitError, setBriefLimitError] = useState("");
  const [generationInterrupted, setGenerationInterrupted] = useState(false);
  const generationLockRef = useRef(false);

  /**
   * Resume artifact review when a session draft exists (after generate, before Add to backlog).
   * Otherwise reset so the input form is available for a project with no draft.
   */
  useLayoutEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const eng = readAiBriefEngagement(projectId);
      const stored = readBacklogDraft(projectId);
      const pendingSince = readGenerationPending(projectId);
      if (stored && eng !== "complete") {
        setDraft(stored);
        setPhase("artifact-review");
        clearGenerationPending(projectId);
        setGenerationInterrupted(false);
        return;
      }
      setDraft(null);
      setPhase("form");
      if (
        pendingSince !== null &&
        Date.now() - pendingSince < GENERATION_PENDING_HINT_MS &&
        !stored &&
        eng !== "complete"
      ) {
        setGenerationInterrupted(true);
      } else {
        setGenerationInterrupted(false);
        if (
          pendingSince !== null &&
          Date.now() - pendingSince >= GENERATION_PENDING_HINT_MS
        ) {
          clearGenerationPending(projectId);
        }
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [projectId]);

  useEffect(() => {
    if (phase !== "generating") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const runGeneration = useCallback(async () => {
    if (generationLockRef.current) return;
    generationLockRef.current = true;
    const payload = toPayload(input);
    markGenerationPending(projectId);
    setGenerationInterrupted(false);
    setPhase("generating");
    setErrorMessage("");
    if (aiConfig.status !== "ready") {
      generationLockRef.current = false;
      clearGenerationPending(projectId);
      setPhase("error");
      setErrorMessage(
        "AI settings aren’t ready yet. Refresh the page and try again."
      );
      return;
    }
    try {
      if (aiConfig.mode === "live") {
        const d = await postProjectGenerateBacklog(projectId, payload, {
          signal: AbortSignal.timeout(CLIENT_GENERATION_TIMEOUT_MS),
        });
        writeBacklogDraft(projectId, d);
        setDraft(d);
        setPhase("artifact-review");
        return;
      }
      await delayGenerationMs();
      const d = buildStubBacklogDraftFromInput(payload);
      writeBacklogDraft(projectId, d);
      setDraft(d);
      setPhase("artifact-review");
    } catch (e) {
      setPhase("error");
      if (e instanceof GenerateBacklogClientError) {
        setErrorMessage(e.message);
      } else if (
        e instanceof DOMException &&
        e.name === "AbortError"
      ) {
        setErrorMessage(
          "Generation timed out. Try again, or shorten your brief."
        );
      } else {
        setErrorMessage("Couldn’t generate work items. Try again.");
      }
    } finally {
      generationLockRef.current = false;
      clearGenerationPending(projectId);
    }
  }, [input, projectId, aiConfig]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedSubmit(true);
    setBriefLimitError("");
    const errs = validateBriefForm(input);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const lim = validateBriefForBacklogGeneration(toPayload(input));
    if (!lim.ok) {
      setBriefLimitError(lim.error);
      return;
    }
    setGenerateConfirmOpen(true);
  };

  const handleConfirmGenerate = () => {
    setGenerateConfirmOpen(false);
    void runGeneration();
  };

  const handleSkip = () => {
    const stored = readAiBriefEngagement(projectId);
    const eng = project?.aiBriefEngagement;
    const alreadyDone =
      eng === "complete" ||
      eng === "skipped" ||
      stored === "complete" ||
      stored === "skipped";
    if (!alreadyDone) {
      writeAiBriefEngagement(projectId, "dismissed");
      updateProject(projectId, { aiBriefEngagement: "dismissed" });
    }
    router.push(`/projects/${projectId}`);
  };

  const handleConfirmBacklog = useCallback(
    async (finalDraft: AiBacklogDraftPayload) => {
      const res = await fetch(`/api/projects/${projectId}/backlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: finalDraft }),
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        throw new Error("Invalid response from server.");
      }
      if (!res.ok) {
        const msg =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      writeBacklogDraft(projectId, finalDraft);
      writeAiBriefEngagement(projectId, "complete");
      updateProject(projectId, { aiBriefEngagement: "complete" });
      router.push(`/projects/${projectId}/backlog`);
    },
    [projectId, router, updateProject]
  );

  const showFieldError = (key: keyof ProjectAiBriefInput): string | undefined =>
    touchedSubmit ? fieldErrors[key] : undefined;

  const storedEngagement =
    typeof window !== "undefined" ? readAiBriefEngagement(projectId) : null;
  const effectiveEngagement = project?.aiBriefEngagement ?? storedEngagement;
  const showOnboardingSkip =
    phase === "form" &&
    effectiveEngagement !== "complete" &&
    effectiveEngagement !== "skipped";

  return (
    <PageShell
      title="AI Generation"
      subtitle={
        <>
          {projectName} — Share goals, audience, and constraints, then generate
          a draft backlog.{" "}
          <span className="font-medium text-[var(--app-accent)]">
            Review and refine it here before adding it to your project.
          </span>
        </>
      }
    >
      <AiGenerateConfirmModal
        open={generateConfirmOpen}
        onCancel={() => setGenerateConfirmOpen(false)}
        onConfirm={handleConfirmGenerate}
      />
      {aiConfig.status === "ready" && aiConfig.mode === "mock" ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-base text-amber-100/95"
        >
          <span className="font-medium text-amber-200">Mock AI</span>
          {" — "}
          No model credits used. Server mode comes from{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            SCRUMIQ_AI_MODE
          </code>{" "}
          in{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            .env.local
          </code>
          .
        </div>
      ) : null}
      {aiConfig.status === "ready" && aiConfig.mode === "live" ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-base text-sky-100/95"
        >
          <span className="font-medium text-sky-200">Live AI</span>
          {" — "}
          Backlog is generated on the server. Without{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            ANTHROPIC_API_KEY
          </code>{" "}
          you still get a deterministic preview (
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            artifactSource: live
          </code>
          ). Add a key in{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            .env.local
          </code>{" "}
          for real Claude output (defaults to{" "}
          <span className="font-medium text-sky-100">Haiku</span>
          {" "}
          and a capped response size to limit spend—override via{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            ANTHROPIC_MODEL
          </code>{" "}
          in the README). Use{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm text-zinc-200">
            SCRUMIQ_AI_MODE=mock
          </code>{" "}
          to skip network and use the client stub instead.
        </div>
      ) : null}
      {aiConfig.status === "error" ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-100"
        >
          {aiConfig.error} Refresh the page.
        </div>
      ) : null}
      {phase === "form" && generationInterrupted ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-base text-amber-100/95"
        >
          <p className="font-medium text-amber-200">Generation may have been interrupted</p>
          <p className="mt-2 text-amber-100/90">
            If you refreshed or closed the tab while ScrumIQ was still working, the
            browser may not have received the draft. Run{" "}
            <span className="font-medium">Generate</span> again. If the server already
            finished, you may get a fresh draft—review it before adding to the backlog.
          </p>
          <button
            type="button"
            className="mt-3 text-base font-medium text-amber-200 underline-offset-2 hover:underline"
            onClick={() => {
              clearGenerationPending(projectId);
              setGenerationInterrupted(false);
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-base text-zinc-300 transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Project home
        </Link>
        {showOnboardingSkip ? (
          <button
            type="button"
            onClick={handleSkip}
            className="text-base text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Skip for now
          </button>
        ) : null}
      </div>

      {phase === "form" ? (
        <form
          onSubmit={handleSubmitForm}
          className="mx-auto max-w-3xl space-y-8"
          noValidate
          aria-labelledby={formTitleId}
        >
          <p id={formTitleId} className="sr-only">
            AI Generation — project context
          </p>
          <div
            id={errSummaryId}
            role="alert"
            aria-live="polite"
            className={cn(
              "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-100",
              touchedSubmit && Object.keys(fieldErrors).length > 0
                ? "block"
                : "hidden"
            )}
          >
            <p className="font-medium">Fix the highlighted fields to continue.</p>
            <ul className="mt-2 list-inside list-disc text-red-200/90">
              {Object.entries(fieldErrors).map(([k, msg]) =>
                msg ? <li key={k}>{msg}</li> : null
              )}
            </ul>
          </div>

          {briefLimitError ? (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-100"
            >
              {briefLimitError}
            </div>
          ) : null}

          <GreenBeamPanel>
            <div className="space-y-7">
              <Field
                label="Title"
                tooltip={FIELD_HELP.title}
                required
                value={input.title}
                onChange={(v) => setInput((s) => ({ ...s, title: v }))}
                error={showFieldError("title")}
              />
              <FieldTextarea
                label="Vision / problem"
                tooltip={FIELD_HELP.vision}
                required
                rows={5}
                value={input.vision}
                onChange={(v) => setInput((s) => ({ ...s, vision: v }))}
                error={showFieldError("vision")}
              />
              <FieldTextarea
                label="Target users"
                tooltip={FIELD_HELP.targetUsers}
                required
                rows={4}
                value={input.targetUsers}
                onChange={(v) => setInput((s) => ({ ...s, targetUsers: v }))}
                error={showFieldError("targetUsers")}
              />
              <FieldTextarea
                label="90-day success"
                tooltip={FIELD_HELP.success90d}
                required
                rows={4}
                value={input.success90d}
                onChange={(v) => setInput((s) => ({ ...s, success90d: v }))}
                error={showFieldError("success90d")}
              />
              <FieldTextarea
                label="Constraints"
                tooltip={FIELD_HELP.constraints}
                required
                rows={4}
                value={input.constraints}
                onChange={(v) => setInput((s) => ({ ...s, constraints: v }))}
                error={showFieldError("constraints")}
              />
              <FieldTextarea
                label="Free-form notes (optional)"
                tooltip={FIELD_HELP.freeformNotes}
                required={false}
                rows={4}
                value={input.freeformNotes}
                onChange={(v) => setInput((s) => ({ ...s, freeformNotes: v }))}
                error={showFieldError("freeformNotes")}
              />
            </div>
          </GreenBeamPanel>

          <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}`)}
              className={SECONDARY_BTN_CLASS}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                aiConfig.status === "loading" || aiConfig.status === "error"
              }
              title={
                aiConfig.status === "loading"
                  ? "Loading AI settings…"
                  : aiConfig.status === "error"
                    ? "Fix AI config loading error first"
                    : undefined
              }
              className="rounded-xl px-10 py-3.5 text-base font-semibold text-[var(--background)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/50 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--app-accent)" }}
            >
              {aiConfig.status === "loading" ? "Loading…" : "Generate"}
            </button>
          </div>
        </form>
      ) : null}

      {phase === "generating" ? (
        <GreenBeamPanel className="mx-auto max-w-2xl">
          <BacklogGenerationLoadingState projectName={projectName} />
        </GreenBeamPanel>
      ) : null}

      {phase === "artifact-review" && draft ? (
        <ArtifactReviewPanel
          initialDraft={draft}
          projectId={projectId}
          projectName={projectName}
          onConfirm={handleConfirmBacklog}
        />
      ) : null}

      {phase === "error" ? (
        <GreenBeamPanel className="mx-auto max-w-lg">
          <div role="alert" aria-live="assertive">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 shrink-0 text-amber-400" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Couldn&apos;t complete AI Generation
                </h2>
                <p className="mt-2 text-base leading-relaxed text-zinc-300">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPhase("form")}
                className={SECONDARY_BTN_CLASS}
              >
                Edit inputs
              </button>
              <button
                type="button"
                onClick={() => void runGeneration()}
                className="rounded-xl px-10 py-3.5 text-base font-semibold text-[var(--background)]"
                style={{ background: "var(--app-accent)" }}
              >
                Retry
              </button>
            </div>
          </div>
        </GreenBeamPanel>
      ) : null}
    </PageShell>
  );
}

function Field({
  label,
  tooltip,
  required,
  value,
  onChange,
  error,
}: {
  label: string;
  tooltip: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <label
          htmlFor={id}
          className="text-base font-medium text-zinc-200"
        >
          {label}
          {required ? <span className="text-red-400/90"> *</span> : null}
        </label>
        <InfoTooltip text={tooltip} />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          INPUT_CLASS,
          error ? "border-red-500 focus:ring-red-500/25" : ""
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FieldTextarea({
  label,
  tooltip,
  required,
  rows,
  value,
  onChange,
  error,
}: {
  label: string;
  tooltip: string;
  required?: boolean;
  rows: number;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <label
          htmlFor={id}
          className="text-base font-medium text-zinc-200"
        >
          {label}
          {required ? <span className="text-red-400/90"> *</span> : null}
        </label>
        <InfoTooltip text={tooltip} />
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          INPUT_CLASS,
          "min-h-[120px] resize-y",
          error ? "border-red-500 focus:ring-red-500/25" : ""
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
