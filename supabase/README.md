# Supabase Setup

The browser uses Supabase Auth and PostgreSQL with Row Level Security (RLS).
The local CYF connector may use the service role key, but that key must never be
in the web bundle, GitHub variables, or browser environment.

Current production project:

- Name: `cyf-lead-workbench`
- Ref: `walnfavnwezpdacfxhkd`
- URL: `https://walnfavnwezpdacfxhkd.supabase.co`
- Region: `ap-northeast-2`

## 1. Create and link the project

Create a Supabase project, then link this repository:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 2. Configure the web build

Set these GitHub repository variables for the Pages workflow:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not configure `SUPABASE_SERVICE_ROLE_KEY` as a browser or GitHub Pages
variable.

## 3. Disable public sign-up

In Supabase Dashboard, open Authentication > Providers > Email and disable
public sign-up. Create user accounts from Authentication > Users.

The migration creates a `profiles` row for each Auth user. New profiles default
to `sales` and active.

Administrators can create additional accounts from the workbench Account
Management page. The `admin-users` Edge Function performs that operation after
verifying the caller is an active administrator.

## 4. Promote the first administrator

Run this SQL once in the Supabase SQL editor, replacing the email:

```sql
update public.profiles
set role = 'admin', active = true
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

Confirm exactly one row was updated before continuing.

## 5. Verify access rules

Use two test accounts:

1. A `sales` user can read owned and unassigned leads.
2. A `sales` user can claim an unassigned lead only once.
3. A `sales` user cannot read another sales user's owned lead.
4. An `admin` user can read all leads and assign or release them.
5. `audit_logs` records claim, assignment, and release actions.

The claim and assignment operations run through the `claim_lead` and
`assign_lead` database functions. RLS remains the final authorization boundary.

## Deploying functions

```bash
supabase functions deploy admin-users --project-ref walnfavnwezpdacfxhkd
```

## Data migration warning

The repository currently contains snapshot modules with real lead and phone
data under `src/data`. Import that data into Supabase, then remove the snapshot
modules from the deployed web bundle. Because the repository has been public,
removing the files does not erase data already present in Git history.
