/** Story row joined with epic title for sprint / backlog planning UI. */
export type SprintStoryRow = {
  id: string;
  epic_id: string;
  epic_title: string;
  title: string;
  story_points: number | null;
  in_sprint: boolean;
  priority: number;
};
