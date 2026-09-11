-- ===== fee_types =====
alter table fee_types enable row level security;

create policy "fee_types_select_org"
on fee_types for select
using (organization_id in (select private.user_org_ids()));

create policy "fee_types_write_admin"
on fee_types for all
using (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
));

-- ===== locations =====
alter table locations enable row level security;

create policy "locations_select_org"
on locations for select
using (organization_id in (select private.user_org_ids()));

create policy "locations_write_admin"
on locations for all
using (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
));

-- ===== member_medical_info =====
alter table member_medical_info enable row level security;

create policy "member_medical_info_select_staff"
on member_medical_info for select
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_medical_info.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "member_medical_info_write_admin"
on member_medical_info for all
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_medical_info.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner','admin','staff')
  )
);

-- portal member can read their own
create policy "member_medical_info_select_self"
on member_medical_info for select
using (
  exists (select 1 from members m where m.id = member_medical_info.member_id and m.user_id = auth.uid())
);

-- ===== member_representatives =====
alter table member_representatives enable row level security;

create policy "member_representatives_select_staff"
on member_representatives for select
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_representatives.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "member_representatives_write_admin"
on member_representatives for all
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_representatives.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner','admin','staff')
  )
);

create policy "member_representatives_select_self"
on member_representatives for select
using (
  exists (select 1 from members m where m.id = member_representatives.member_id and m.user_id = auth.uid())
);

-- ===== sim_invoices =====
alter table sim_invoices enable row level security;

create policy "sim_invoices_select_org"
on sim_invoices for select
using (organization_id in (select private.user_org_ids()));

create policy "sim_invoices_insert_admin"
on sim_invoices for insert
with check (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff')
));

-- ===== Allow pending inscripcion insert (unauthenticated) via service role only =====
-- The public inscripcion form calls a server action that uses the SERVICE ROLE client,
-- so no anon insert policy is needed on members. The server action does the insert.
