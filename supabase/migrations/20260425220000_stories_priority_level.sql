-- Story severity for Kanban (Low / Medium / High / Critical). Distinct from backlog sort `priority`.

alter table public.stories
  add column if not exists priority_level integer not null default 0;

alter table public.stories
  drop constraint if exists stories_priority_level_check;

alter table public.stories
  add constraint stories_priority_level_check
  check (priority_level >= 0 and priority_level <= 3);

comment on column public.stories.priority_level is 'Kanban severity: 0 Low, 1 Medium, 2 High, 3 Critical. Separate from list order `priority`.';
