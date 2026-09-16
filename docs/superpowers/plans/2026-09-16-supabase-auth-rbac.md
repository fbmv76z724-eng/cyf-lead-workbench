# Supabase Auth and RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase email/password authentication, role-based navigation, database-backed lead storage, atomic claiming, and admin assignment.

**Architecture:** React keeps the existing repository interface but consumes a Supabase adapter. Supabase Auth establishes identity, `profiles` stores role and active state, and RLS enforces every read and write. The browser receives only the anon key; trusted jobs use the service role outside the bundle.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase JS, PostgreSQL, Supabase Auth, Row Level Security.

**Spec:** `docs/superpowers/specs/2026-09-16-supabase-auth-rbac-design.md`

## Global Constraints

- Do not commit Supabase secrets.
- Browser code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The service role key is local/trusted-job only.
- The production build must not crash when Supabase environment variables are absent.
- Sales users may select owned and unassigned leads, but may update only owned leads.
- Claiming must be atomic through a database RPC.
- Preserve the current login-free mock behavior only for automated tests and unconfigured local development.

---

### Task 1: Supabase Client, Auth State, and Login Page

**Files:**
- Create: `src/data/supabaseClient.ts`
- Create: `src/auth/AuthProvider.tsx`
- Create: `src/auth/permissions.ts`
- Create: `src/pages/LoginPage.tsx`
- Create: `tests/login-page.test.tsx`
- Modify: `src/main.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `getSupabaseClient(): SupabaseClient | null`
- Produces: `isSupabaseConfigured(): boolean`
- Produces: `AuthProvider({ children })`
- Produces: `useAuth(): { session; profile; loading; signIn; signOut }`
- Produces: `UserRole = "admin" | "sales"`

- [ ] **Step 1: Install the Supabase client**

Run:

```bash
PATH="/Users/fifidei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm add @supabase/supabase-js
```

- [ ] **Step 2: Write the failing login test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../src/pages/LoginPage";

it("submits email and password", async () => {
  const signIn = vi.fn().mockResolvedValue(undefined);
  render(<LoginPage signIn={signIn} />);
  await userEvent.type(screen.getByLabelText("邮箱"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("密码"), "secret123");
  await userEvent.click(screen.getByRole("button", { name: "登录" }));
  expect(signIn).toHaveBeenCalledWith("admin@example.com", "secret123");
});
```

- [ ] **Step 3: Run the failing test**

Run: `pnpm test -- tests/login-page.test.tsx`

Expected: FAIL because `LoginPage` does not exist.

- [ ] **Step 4: Implement the client, provider, and login page**

`getSupabaseClient` caches one client and returns `null` when configuration is absent. `AuthProvider` subscribes to `onAuthStateChange`, loads the matching `profiles` row, and rejects inactive profiles.

- [ ] **Step 5: Run the login test**

Run: `pnpm test -- tests/login-page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/data/supabaseClient.ts src/auth src/pages/LoginPage.tsx src/main.tsx tests/login-page.test.tsx
git commit -m "feat: add Supabase authentication foundation"
```

### Task 2: Database Schema, RLS, and Claim RPC

**Files:**
- Create: `supabase/migrations/202609160001_supabase_auth_rbac.sql`
- Create: `supabase/README.md`

**Interfaces:**
- Produces: `profiles`, `leads`, `follow_ups`, `audit_logs`, `sync_runs`
- Produces: `public.is_admin() returns boolean`
- Produces: `public.claim_lead(p_lead_id text) returns leads`

- [ ] **Step 1: Write the migration**

Create enums and tables, add automatic profile creation for new Auth users, enable RLS, create helper functions, and create policies matching the spec.

- [ ] **Step 2: Validate SQL structure**

Run:

```bash
rg -n "enable row level security|create policy|claim_lead|is_admin" supabase/migrations/202609160001_supabase_auth_rbac.sql
```

Expected: every required table and helper appears.

- [ ] **Step 3: Document project provisioning**

Document `supabase db push`, environment variables, first admin promotion, and public sign-up disabling.

- [ ] **Step 4: Commit**

```bash
git add supabase
git commit -m "feat: add Supabase schema and access policies"
```

### Task 3: Supabase Repository, Claim, and Assignment

**Files:**
- Create: `src/data/supabaseRepository.ts`
- Create: `tests/supabase-repository.test.ts`
- Modify: `src/data/repository.ts`
- Modify: `src/domain/lead.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages/OfflineLeadsPage.tsx`

**Interfaces:**
- Extends `LeadRepository` with `load(): Promise<void>`
- Produces: `claimLead(id: string): Promise<Lead>`
- Produces: `assignLead(id: string, ownerId: string | null): Promise<Lead>`
- Produces: `Lead.ownerId?: string`, `Lead.claimedAt?: string`

- [ ] **Step 1: Write the failing repository tests**

Test row mapping, claim RPC invocation, and admin assignment. Use a small injected fake query builder; no network calls.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm test -- tests/supabase-repository.test.ts`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter**

Persist and read snake_case columns with explicit mapping. `claimLead` calls `rpc("claim_lead", { p_lead_id: id })`; `assignLead` updates `owner_id` and `claimed_at`.

- [ ] **Step 4: Wire `App.tsx` to select the Supabase repository when configured**

Keep the mock repository for unconfigured development and tests. Show the setup screen when configuration is absent.

- [ ] **Step 5: Run repository and existing tests**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat: add Supabase lead repository"
```

### Task 4: Role-Aware UI, Claim Action, and Admin Assignment

**Files:**
- Create: `src/pages/AccountsPage.tsx`
- Create: `tests/auth-permissions.test.tsx`
- Modify: `src/app/navigation.ts`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/pages/LeadsPage.tsx`
- Modify: `src/components/LeadList.tsx`
- Modify: `src/components/LeadDetailDrawer.tsx`

**Interfaces:**
- Consumes: `useAuth()` and repository claim/assignment methods.
- Produces: role-filtered navigation.
- Produces: Claim action for unassigned leads.
- Produces: owner assignment control for admins.

- [ ] **Step 1: Write the failing permission tests**

Test that sales navigation excludes reports, sync, and accounts, while admin navigation includes them. Test that an unassigned lead renders a Claim action.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm test -- tests/auth-permissions.test.tsx`

Expected: FAIL because role filtering and Claim UI do not exist.

- [ ] **Step 3: Implement role-aware navigation and actions**

Pass the current profile role into the shell, hide admin-only entries, and use database permission errors as the final authority.

- [ ] **Step 4: Run tests**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: add role-aware workbench actions"
```

### Task 5: Build Configuration and Verification

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Create: `.env.example`
- Modify: `docs/superpowers/specs/2026-09-16-supabase-auth-rbac-design.md`

**Interfaces:**
- Consumes GitHub repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Add build-time environment variables**

Pass the two public Supabase values into `pnpm build`.

- [ ] **Step 2: Run verification**

Run:

```bash
PATH="/Users/fifidei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm test
PATH="/Users/fifidei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm build
git diff --check
```

Expected: tests pass, build succeeds, and the diff has no whitespace errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-pages.yml .env.example docs
git commit -m "chore: configure Supabase web builds"
```
