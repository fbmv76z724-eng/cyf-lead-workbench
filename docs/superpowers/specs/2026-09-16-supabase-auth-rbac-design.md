# Supabase Auth and RBAC Design

- Date: 2026-09-16
- Status: Approved for implementation
- Target: CYF lead workbench

## Goal

Replace the in-memory prototype repository with a Supabase-backed account and data layer while preserving the existing React workbench.

## Roles

### Admin

- View and modify every lead.
- Assign or reassign lead owners.
- Export data.
- Trigger synchronization.
- Create, invite, disable, and re-enable users.
- View audit and synchronization records.

### Sales

- View owned leads and the unassigned lead pool.
- Claim one unassigned lead atomically.
- Add follow-ups only to owned leads.
- Create offline leads, automatically owned by the creator.
- Cannot manage users, export, assign leads, or trigger global synchronization.

## Authentication

- Supabase Auth email/password login.
- Public sign-up remains disabled.
- An authenticated user without an active `profiles` row is denied access.
- Session persistence is handled by the Supabase client.
- Sign-out clears the local Supabase session.

## Database Model

### profiles

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `role text check in ('admin', 'sales')`
- `active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

### leads

Reuses the frontend `Lead` fields and adds:

- `owner_id uuid references profiles(id)`
- `claimed_at timestamptz`
- `created_by uuid references profiles(id)`

### follow_ups

- `id text primary key`
- `lead_id text references leads(id)`
- `operator_id uuid references profiles(id)`
- Existing follow-up fields are stored in snake_case columns.

### audit_logs

- `id bigint generated always as identity`
- `actor_id uuid`
- `action text`
- `lead_id text`
- `details jsonb`
- `created_at timestamptz`

### sync_runs

- Existing sync result fields are stored in this table.

## Row Level Security

- `profiles`: users can read their own row; admins can read and modify all rows.
- `leads`: admins can access all rows; sales can select owned or unassigned rows and update owned rows.
- Unassigned leads are claimable only through `claim_lead(text)`.
- `follow_ups`: admins can access all rows; sales can access rows whose lead is owned by them.
- `audit_logs` and `sync_runs`: admins only, except writes made by security-definer functions or trusted jobs.

## Claim and Assignment

- `claim_lead(lead_id)` locks the lead row, verifies `owner_id is null`, sets `owner_id = auth.uid()`, writes an audit log, and returns the updated lead.
- Admin assignment updates `owner_id` and `claimed_at`, and writes an audit log.

## Frontend Behavior

- Unauthenticated users see the login page.
- Missing Supabase configuration shows a clear setup screen instead of a blank page.
- The app loads visible leads through RLS, not through client-side filtering of global data.
- Admin-only navigation is hidden for sales users.
- Sales users see "待认领" leads and a Claim action.
- Sales users cannot export or trigger global synchronization.

## Configuration

GitHub Pages build requires:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The local CYF connector requires a server-only `SUPABASE_SERVICE_ROLE_KEY`; it must never be sent to the browser.

The Pages workflow reads the two browser values from GitHub repository
variables. A missing value produces the setup screen instead of rendering a
broken workbench.

## Data Exposure

The current static snapshot modules still contain real lead and phone data.
They must be imported into Supabase and removed from the deployed source bundle
before production use. Because the repository and Pages site have been public,
removing files does not erase copies already present in Git history or caches.

## Test Strategy

- Unit tests for role-based navigation and authorization helpers.
- Repository tests using an injected fake Supabase client.
- Component tests for login, claim, and admin assignment behavior.
- Existing workbench tests continue to pass.
- Production build must pass without secrets by using the setup screen fallback.
