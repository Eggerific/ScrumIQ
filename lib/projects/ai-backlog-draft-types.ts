/**
 * UI-side draft of AI-generated backlog items (epics → stories → AC → tasks).
 * Backend persistence and a real generation API will replace session storage later.
 */
export interface AiGeneratedTask {
  id: string;
  title: string;
}

export interface AiGeneratedStory {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  tasks: AiGeneratedTask[];
}

export interface AiGeneratedEpic {
  id: string;
  title: string;
  description: string;
  stories: AiGeneratedStory[];
}

export interface AiBacklogDraftPayload {
  generatedAt: string;
  /** `stub` = client mock; `live` = returned from a future model API */
  artifactSource: "stub" | "live";
  epics: AiGeneratedEpic[];
}
