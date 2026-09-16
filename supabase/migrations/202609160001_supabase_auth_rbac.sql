create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'sales' check (role in ('admin', 'sales')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id text primary key,
  source text not null check (source in ('cyf', 'offline')),
  cyf_lead_id bigint,
  cyf_driver_id bigint,
  city text not null default '',
  company text not null default '',
  name text not null default '',
  phone_masked text not null default '',
  phone_full text,
  age integer check (age is null or age >= 0),
  driving_years integer check (driving_years is null or driving_years >= 0),
  flow_state text not null default '',
  lead_stage text not null default '',
  channel_type text not null default '',
  intention_area text not null default '',
  driver_type text,
  in_company_time timestamptz not null,
  fall_public_days integer not null default 0 check (fall_public_days >= 0),
  possible_join smallint check (possible_join between -1 and 2),
  latest_link_status smallint not null default 4
    check (latest_link_status between 0 and 4),
  latest_follow_at timestamptz,
  latest_follow_user text,
  follow_count integer not null default 0 check (follow_count >= 0),
  sync_state text not null default 'synced'
    check (sync_state in ('synced', 'pending', 'conflict', 'failed', 'local_only')),
  local_status text
    check (
      local_status is null
      or local_status in ('待跟进', '跟进中', '已跟进', '无效', '成交')
    ),
  owner_id uuid references public.profiles (id) on delete set null,
  claimed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leads_cyf_lead_id_unique
  on public.leads (cyf_lead_id)
  where cyf_lead_id is not null;

create index leads_owner_id_idx on public.leads (owner_id);
create index leads_in_company_time_idx on public.leads (in_company_time desc);
create index leads_sync_state_idx on public.leads (sync_state);

create table public.follow_ups (
  id text primary key,
  lead_id text not null references public.leads (id) on delete cascade,
  called_at timestamptz not null,
  link_status smallint not null check (link_status between 0 and 3),
  possible_join smallint not null check (possible_join between -1 and 2),
  remark_type text,
  remark text not null default '',
  operator_name text not null default '',
  operator_id uuid references public.profiles (id) on delete set null,
  sync_state text not null default 'pending'
    check (sync_state in ('synced', 'pending', 'conflict', 'failed', 'local_only')),
  origin text not null default 'local' check (origin in ('local', 'cyf')),
  created_at timestamptz not null default now()
);

create index follow_ups_lead_id_called_at_idx
  on public.follow_ups (lead_id, called_at desc);
create index follow_ups_operator_id_idx on public.follow_ups (operator_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  lead_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_lead_id_created_at_idx
  on public.audit_logs (lead_id, created_at desc);
create index audit_logs_actor_id_created_at_idx
  on public.audit_logs (actor_id, created_at desc);

create table public.sync_runs (
  id bigint generated always as identity primary key,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed integer not null default 0 check (processed >= 0),
  failed integer not null default 0 check (failed >= 0),
  details jsonb not null default '{}'::jsonb,
  started_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sync_runs_started_at_idx on public.sync_runs (started_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'display_name', email, '')
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active
  );
$$;

create or replace function public.audit_lead_owner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    insert into public.audit_logs (actor_id, action, lead_id, details)
    values (
      auth.uid(),
      case when new.owner_id is null then 'lead_released' else 'lead_assigned' end,
      new.id,
      jsonb_build_object(
        'previous_owner_id', old.owner_id,
        'owner_id', new.owner_id
      )
    );
  end if;
  return new;
end;
$$;

create trigger leads_audit_owner_change
after update of owner_id on public.leads
for each row execute function public.audit_lead_owner_change();

create or replace function public.claim_lead(p_lead_id text)
returns public.leads
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
  ) then
    raise exception using
      errcode = '42501',
      message = 'PROFILE_INACTIVE';
  end if;

  select *
  into v_lead
  from public.leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'LEAD_NOT_FOUND';
  end if;

  if v_lead.owner_id is not null then
    raise exception using
      errcode = 'P0001',
      message = 'LEAD_ALREADY_CLAIMED';
  end if;

  update public.leads
  set
    owner_id = auth.uid(),
    claimed_at = now()
  where id = p_lead_id
  returning * into v_lead;

  return v_lead;
end;
$$;

create or replace function public.assign_lead(
  p_lead_id text,
  p_owner_id uuid
)
returns public.leads
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads;
begin
  if not public.is_admin() then
    raise exception using
      errcode = '42501',
      message = 'ADMIN_REQUIRED';
  end if;

  if p_owner_id is not null and not exists (
    select 1
    from public.profiles
    where id = p_owner_id
      and active
  ) then
    raise exception using
      errcode = 'P0002',
      message = 'OWNER_NOT_FOUND';
  end if;

  select *
  into v_lead
  from public.leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'LEAD_NOT_FOUND';
  end if;

  if p_owner_id is not distinct from v_lead.owner_id then
    return v_lead;
  end if;

  update public.leads
  set
    owner_id = p_owner_id,
    claimed_at = case when p_owner_id is null then null else now() end
  where id = p_lead_id
  returning * into v_lead;

  return v_lead;
end;
$$;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.follow_ups enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sync_runs enable row level security;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy leads_admin_all
on public.leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy leads_sales_select_owned_or_unassigned
on public.leads
for select
to authenticated
using (owner_id = (select auth.uid()) or owner_id is null);

create policy leads_sales_update_owned
on public.leads
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy leads_sales_insert_offline
on public.leads
for insert
to authenticated
with check (
  source = 'offline'
  and owner_id = (select auth.uid())
  and created_by = (select auth.uid())
);

create policy follow_ups_admin_all
on public.follow_ups
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy follow_ups_sales_select_owned
on public.follow_ups
for select
to authenticated
using (
  exists (
    select 1
    from public.leads
    where leads.id = follow_ups.lead_id
      and leads.owner_id = (select auth.uid())
  )
);

create policy follow_ups_sales_insert_owned
on public.follow_ups
for insert
to authenticated
with check (
  operator_id = (select auth.uid())
  and origin = 'local'
  and exists (
    select 1
    from public.leads
    where leads.id = follow_ups.lead_id
      and leads.owner_id = (select auth.uid())
  )
);

create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (public.is_admin());

create policy sync_runs_admin_all
on public.sync_runs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on table public.profiles from anon;
revoke all on table public.leads from anon;
revoke all on table public.follow_ups from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.sync_runs from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.follow_ups to authenticated;
grant select on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.sync_runs to authenticated;

grant usage, select on sequence public.audit_logs_id_seq to authenticated;
grant usage, select on sequence public.sync_runs_id_seq to authenticated;

revoke all on function public.is_admin() from public;
revoke all on function public.claim_lead(text) from public;
revoke all on function public.assign_lead(text, uuid) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_lead(text) to authenticated;
grant execute on function public.assign_lead(text, uuid) to authenticated;

comment on table public.profiles is
  'Workbench roles and active state linked to Supabase Auth users.';
comment on table public.leads is
  'CYF and offline leads visible through role-based RLS.';
comment on table public.follow_ups is
  'Lead call history from CYF synchronization and local follow-ups.';
comment on table public.audit_logs is
  'Immutable audit trail written by trusted database functions.';
comment on table public.sync_runs is
  'CYF synchronization run results written by the local connector.';
