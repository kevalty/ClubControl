-- Create the notifications table (was in the schema design but never migrated).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_org_id_idx  on notifications(organization_id);

-- RLS
alter table notifications enable row level security;

create policy "notifications_select_own"
on notifications for select
using (user_id = auth.uid());

create policy "notifications_update_own"
on notifications for update
using (user_id = auth.uid());

-- Service role (used by inscription public form) can insert notifications
grant select, insert, update on notifications to service_role;
grant select, insert, update on notifications to authenticated;
