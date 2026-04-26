-- Kanban column per story (replaces task-level status when tasks no longer carry workflow).
-- Values must match KanbanWorkflowColumn in lib/projects/kanban-workflow.ts

alter table public.stories
  add column if not exists board_status text not null default 'To Do';

alter table public.stories
  drop constraint if exists stories_board_status_check;

alter table public.stories
  add constraint stories_board_status_check
  check (board_status in ('To Do', 'In Progress', 'Done'));

comment on column public.stories.board_status is 'Kanban column for in-sprint story cards (To Do / In Progress / Done).';
