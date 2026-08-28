-- ALDECKOT | Nível de prioridade da Agenda
-- Execute este arquivo no SQL Editor do Supabase para projetos que já usaram 001_aldeckot_schema.sql.

alter table public.agenda_entries
  add column if not exists priority text;

update public.agenda_entries
set priority = 'normal'
where priority is null;

-- Converte a compatibilidade usada por versões anteriores da interface.
update public.agenda_entries
set priority = substring(notes from E'^\\[\\[aldeckot:priority:(urgent|periodic|normal)\\]\\]'),
    notes = regexp_replace(notes, E'^\\[\\[aldeckot:priority:(urgent|periodic|normal)\\]\\]\\n?', '')
where notes ~ E'^\\[\\[aldeckot:priority:(urgent|periodic|normal)\\]\\]';

alter table public.agenda_entries
  alter column priority set default 'normal',
  alter column priority set not null;

alter table public.agenda_entries
  drop constraint if exists agenda_entries_priority_check;

alter table public.agenda_entries
  add constraint agenda_entries_priority_check
  check (priority in ('urgent', 'periodic', 'normal'));

create index if not exists agenda_entries_owner_priority_due_idx
  on public.agenda_entries (owner_id, priority, due_date, due_time);
