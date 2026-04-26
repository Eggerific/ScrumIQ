-- Story-level assignee for Kanban / sprint cards (one person per story).
-- Apply in Supabase SQL editor or via CLI if you use migrations.

alter table public.stories
  add column if not exists assigned_to uuid references public.users (id) on delete set null;

comment on column public.stories.assigned_to is 'Optional project member assigned to the whole story (Kanban / planning).';
