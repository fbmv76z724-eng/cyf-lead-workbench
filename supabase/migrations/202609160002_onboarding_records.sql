create table public.onboarding_records (
  id text primary key,
  driver_id bigint,
  onboarded_at timestamptz not null,
  identity text not null default 'unknown'
    check (identity in ('didi', 'xinju', 'unknown')),
  driver_type text not null default '',
  created_at timestamptz not null default now()
);

create index onboarding_records_onboarded_at_idx
  on public.onboarding_records (onboarded_at desc);
create index onboarding_records_driver_id_idx
  on public.onboarding_records (driver_id);

alter table public.onboarding_records enable row level security;

create policy onboarding_records_admin_all
on public.onboarding_records
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy onboarding_records_sales_select_owned
on public.onboarding_records
for select
to authenticated
using (
  exists (
    select 1
    from public.leads
    where leads.cyf_driver_id = onboarding_records.driver_id
      and leads.owner_id = (select auth.uid())
  )
);

revoke all on table public.onboarding_records from anon;
grant select, insert, update, delete on table public.onboarding_records
  to authenticated;

comment on table public.onboarding_records is
  'Driver onboarding events used for dashboard conversion metrics.';
