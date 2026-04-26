-- Freeform notes / long description on stories (Kanban story panel), separate from `description` (tasks body).

alter table public.stories
  add column if not exists notes text not null default '';

comment on column public.stories.notes is 'Optional multi-line notes; tasks stay in `description`, AC in `acceptance_criteria`.';
