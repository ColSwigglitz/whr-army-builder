-- WHR Army Builder development: inactive account retention lifecycle.
-- Run after 002_profiles_privacy.sql.
-- Policy: warn after 18 months without a visit/login, then schedule deletion 30 days later.

alter table public.profiles
  add column if not exists last_active_at timestamptz not null default now(),
  add column if not exists deletion_warning_sent_at timestamptz,
  add column if not exists scheduled_deletion_at timestamptz;

create index if not exists profiles_last_active_at_idx
  on public.profiles(last_active_at);

create index if not exists profiles_scheduled_deletion_at_idx
  on public.profiles(scheduled_deletion_at)
  where scheduled_deletion_at is not null;

-- Authenticated users call this whenever they actively use the site. It records
-- genuine account activity and cancels any pending inactivity deletion.
create or replace function public.mark_current_user_active()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.profiles
  set last_active_at = now(),
      deletion_warning_sent_at = null,
      scheduled_deletion_at = null,
      updated_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.mark_current_user_active() to authenticated;

-- These helper views deliberately expose no email address. A trusted server-side
-- retention worker uses the UUID to obtain the user's Auth email with the service
-- role only when it needs to send an inactivity warning.
create or replace view public.inactive_accounts_due_warning
with (security_invoker = true)
as
select id, display_name, last_active_at
from public.profiles
where last_active_at <= now() - interval '18 months'
  and deletion_warning_sent_at is null
  and scheduled_deletion_at is null;

create or replace view public.inactive_accounts_due_deletion
with (security_invoker = true)
as
select id, display_name, last_active_at, deletion_warning_sent_at, scheduled_deletion_at
from public.profiles
where scheduled_deletion_at is not null
  and scheduled_deletion_at <= now();

-- Do not grant these retention views to authenticated/anon users. They are for
-- the service-role retention worker only.
revoke all on public.inactive_accounts_due_warning from anon, authenticated;
revoke all on public.inactive_accounts_due_deletion from anon, authenticated;
