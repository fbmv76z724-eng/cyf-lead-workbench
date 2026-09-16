alter table public.profiles
  add column email text not null default '';

update public.profiles as profile
set email = coalesce(auth_user.email, '')
from auth.users as auth_user
where auth_user.id = profile.id;

create unique index profiles_email_unique
  on public.profiles (lower(email))
  where email <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email;
  return new;
end;
$$;

comment on column public.profiles.email is
  'Login email, synchronized with Supabase Auth by the admin-users function.';
