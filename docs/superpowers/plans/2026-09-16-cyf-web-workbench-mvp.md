# CYF Web Workbench MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable, responsive web workbench MVP for lead operations using the approved CYF design specification and a replaceable mock data adapter.

**Architecture:** A single React + TypeScript + Vite frontend consumes a typed repository interface. The first iteration uses deterministic in-memory data so all dashboard, lead, follow-up, offline-lead, export, and sync workflows can be exercised before the Fastify/PostgreSQL and CYF connector layers are added. Android and real CYF writes are explicitly excluded from this plan.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Lucide React, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-16-cyf-lead-workbench-design.md`

## Global Constraints

- Web first; Android APK design and implementation are deferred.
- Do not write to the real `cyf` system in this plan.
- Keep all `cyf` and offline records behind a repository interface so a Fastify API can replace the in-memory implementation.
- Use the persisted design system in `design-system/cyf-lead-workbench/MASTER.md`.
- Apply page overrides in `design-system/cyf-lead-workbench/pages/dashboard.md` and `pages/leads.md` when those pages are built.
- Use Lucide SVG icons; never use emoji as UI icons.
- Body text is at least 16px on mobile and 14px on dense desktop tables.
- Touch targets are at least 44x44px on touch layouts.
- Cards use a maximum 8px border radius.
- No marketing hero, decorative gradient orbs, nested cards, or unnecessary scroll animation.
- Support 375px, 768px, 1024px, and 1440px viewports without horizontal page overflow.
- Include visible keyboard focus and respect `prefers-reduced-motion`.
- Every metric must have a label, time context, and a path to its filtered record set.
- The first render must show the actual workbench, not a landing page.

## File Structure

```text
package.json
tsconfig.json
tsconfig.node.json
vite.config.ts
index.html
src/
  main.tsx
  App.tsx
  app/
    AppShell.tsx
    navigation.ts
  components/
    Button.tsx
    EmptyState.tsx
    KpiCard.tsx
    LeadDetailDrawer.tsx
    LeadFilters.tsx
    LeadList.tsx
    StatusBadge.tsx
    SyncHealthPanel.tsx
  data/
    mockLeads.ts
    repository.ts
    selectors.ts
  domain/
    lead.ts
    followUp.ts
    navigation.ts
  pages/
    DashboardPage.tsx
    LeadsPage.tsx
    OfflineLeadsPage.tsx
    ReportsPage.tsx
    SyncPage.tsx
  styles/
    global.css
    tokens.css
  test/
    setup.ts
  utils/
    format.ts
tests/
  app-shell.test.tsx
  dashboard.test.tsx
  lead-filters.test.tsx
  lead-detail.test.tsx
  offline-leads.test.tsx
```

## Task 1: Scaffold and App Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/app/AppShell.tsx`
- Create: `src/app/navigation.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/test/setup.ts`
- Test: `tests/app-shell.test.tsx`

**Interfaces:**
- Produces: `AppShell({ currentPage, onNavigate, children })`
- Produces: `NavigationItem { id: PageId; label: string; icon: LucideIcon }`
- Produces: `PageId = "dashboard" | "leads" | "offline" | "reports" | "sync"`

- [ ] **Step 1: Write the failing app-shell test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../src/app/AppShell";

it("renders primary navigation and reports a page change", async () => {
  const onNavigate = vi.fn();
  render(
    <AppShell currentPage="dashboard" onNavigate={onNavigate}>
      <h1>今日工作台</h1>
    </AppShell>,
  );

  expect(screen.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "线索管理" }));
  expect(onNavigate).toHaveBeenCalledWith("leads");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test -- tests/app-shell.test.tsx`

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Create the Vite React TypeScript scaffold**

Use React 19, Vite, TypeScript, Vitest, Testing Library, and Lucide React. Configure `vite.config.ts` with `environment: "jsdom"` and `setupFiles: "./src/test/setup.ts"`.

- [ ] **Step 4: Implement the tokens and shell**

Use the persisted design-system colors and spacing. The desktop shell uses a 232px left rail; mobile uses a fixed bottom navigation with `padding-bottom: calc(72px + env(safe-area-inset-bottom))` on the main content.

```tsx
export function AppShell({ currentPage, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <aside className="sidebar">...</aside>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <nav className="bottom-nav" aria-label="移动端主导航">...</nav>
    </div>
  );
}
```

- [ ] **Step 5: Run the app-shell test**

Run: `pnpm test -- tests/app-shell.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json tsconfig.node.json vite.config.ts index.html src tests/app-shell.test.tsx
git commit -m "feat: scaffold web workbench shell"
```

## Task 2: Domain Model, Mock Data, and Selectors

**Files:**
- Create: `src/domain/lead.ts`
- Create: `src/domain/followUp.ts`
- Create: `src/domain/navigation.ts`
- Create: `src/data/mockLeads.ts`
- Create: `src/data/repository.ts`
- Create: `src/data/selectors.ts`
- Test: `tests/dashboard.test.tsx`

**Interfaces:**
- Produces: `Lead`, `FollowUp`, `LeadSource`, `SyncState`, `LinkStatus`, `PossibleJoin`
- Produces: `LeadRepository { listLeads(filters): Lead[]; getLead(id): Lead | undefined; addFollowUp(input): FollowUp; addOfflineLead(input): Lead; sync(): Promise<SyncResult> }`
- Produces: `getDashboardMetrics(leads, now): DashboardMetrics`
- Produces: `filterLeads(leads, filters): Lead[]`

- [ ] **Step 1: Write failing metric and filter tests**

```tsx
it("counts today's cyf inflow and pending calls", () => {
  const metrics = getDashboardMetrics(mockLeads, new Date("2026-09-16T10:00:00+08:00"));
  expect(metrics.todayInflow).toBe(3);
  expect(metrics.waitingForCall).toBe(4);
});

it("filters offline leads by status", () => {
  const result = filterLeads(mockLeads, { source: "offline", localStatus: "待跟进" });
  expect(result.every((lead) => lead.source === "offline")).toBe(true);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm test -- tests/dashboard.test.tsx`

Expected: FAIL because domain types and selectors do not exist.

- [ ] **Step 3: Implement the domain and deterministic fixtures**

Use the exact external codes from the spec:

```ts
export const LINK_STATUS = {
  waitingSecondCall: 0,
  connected: 1,
  secondCallMissed: 2,
  emptyNumber: 3,
  notCalled: 4,
} as const;

export const POSSIBLE_JOIN = {
  noIntent: 0,
  high: 1,
  normal: 2,
} as const;
```

Create at least 12 leads with a mix of `cyf` and `offline`, all link statuses, all sync states, and multiple cities and areas. Use masked phone values in list fixtures and separate full-phone values only where the detail test needs them.

- [ ] **Step 4: Implement repository and selectors**

The in-memory repository owns all mutations. `addFollowUp` marks a `cyf` lead as `pending`; `addOfflineLead` marks it `local_only`. `sync()` changes pending records to `synced` after a 600ms delay and returns counts.

- [ ] **Step 5: Run the tests**

Run: `pnpm test -- tests/dashboard.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain src/data tests/dashboard.test.tsx
git commit -m "feat: add web domain model and mock repository"
```

## Task 3: Dashboard Page

**Files:**
- Create: `src/components/KpiCard.tsx`
- Create: `src/components/SyncHealthPanel.tsx`
- Create: `src/pages/DashboardPage.tsx`
- Modify: `src/App.tsx`
- Test: `tests/dashboard.test.tsx`

**Interfaces:**
- Consumes: `getDashboardMetrics`, `LeadRepository`
- Produces: `DashboardPage({ leads, onNavigate })`
- Produces: `KpiCard({ label, value, context, tone, onClick })`

- [ ] **Step 1: Add a failing dashboard rendering test**

```tsx
it("shows the KPI strip and sync health", () => {
  render(<DashboardPage leads={mockLeads} onNavigate={vi.fn()} />);
  expect(screen.getByText("今日流入")).toBeVisible();
  expect(screen.getByText("待外呼")).toBeVisible();
  expect(screen.getByText("同步正常")).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test -- tests/dashboard.test.tsx`

Expected: FAIL because `DashboardPage` does not exist.

- [ ] **Step 3: Implement the KPI strip**

Render six cards: 今日流入, 待外呼, 今日已呼, 今日接通, 线下待跟进, 同步异常. Each card is a button when it has a drill-down action. Keep card heights stable with `min-height: 112px`.

- [ ] **Step 4: Implement funnel, trend, sync health, and work queue**

Use CSS and inline SVG rather than adding a chart dependency. The funnel displays stage label, count, percentage, and a factual summary. The trend chart has a visible data table below it. The recent work queue shows five leads needing attention.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test -- tests/dashboard.test.tsx && pnpm build`

Expected: tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/KpiCard.tsx src/components/SyncHealthPanel.tsx src/pages/DashboardPage.tsx src/App.tsx tests/dashboard.test.tsx
git commit -m "feat: add dashboard workbench"
```

## Task 4: Leads List and Filters

**Files:**
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/LeadFilters.tsx`
- Create: `src/components/LeadList.tsx`
- Create: `src/pages/LeadsPage.tsx`
- Create: `src/utils/format.ts`
- Modify: `src/App.tsx`
- Test: `tests/lead-filters.test.tsx`

**Interfaces:**
- Produces: `LeadFilters({ value, onChange, cities })`
- Produces: `LeadList({ leads, onSelect })`
- Produces: `LeadsPage({ leads, onSelect, initialFilters })`

- [ ] **Step 1: Write failing filter tests**

```tsx
it("applies search and source filters", async () => {
  render(<LeadsPage leads={mockLeads} onSelect={vi.fn()} />);
  await userEvent.type(screen.getByLabelText("搜索司机ID或手机号"), "5089");
  expect(screen.getByText("2885118908860505")).toBeVisible();
  expect(screen.queryByText("2885118908785293")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test -- tests/lead-filters.test.tsx`

Expected: FAIL because `LeadsPage` does not exist.

- [ ] **Step 3: Implement the filter bar**

Include source, city, stage, call status, intent, sync state, and text search. Use native select elements and labeled inputs. The mobile version opens the same filters in a sheet; do not hide the only filter entry behind hover.

- [ ] **Step 4: Implement desktop table and mobile cards**

Use a semantic table for desktop. Use article-based cards for mobile. Both views share the same filtered data and active lead selection.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test -- tests/lead-filters.test.tsx && pnpm build`

Expected: tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/StatusBadge.tsx src/components/LeadFilters.tsx src/components/LeadList.tsx src/pages/LeadsPage.tsx src/utils/format.ts src/App.tsx tests/lead-filters.test.tsx
git commit -m "feat: add lead list and filters"
```

## Task 5: Lead Detail and Follow-up Form

**Files:**
- Create: `src/components/LeadDetailDrawer.tsx`
- Modify: `src/pages/LeadsPage.tsx`
- Modify: `src/data/repository.ts`
- Test: `tests/lead-detail.test.tsx`

**Interfaces:**
- Produces: `LeadDetailDrawer({ lead, open, onClose, onSubmitFollowUp, onRevealPhone })`
- Produces: `FollowUpInput { leadId; calledAt; linkStatus; possibleJoin; remarkType; remark; operatorName }`

- [ ] **Step 1: Write failing form tests**

```tsx
it("requires call status and intent before submitting", async () => {
  render(<LeadDetailDrawer lead={mockLeads[0]} open onClose={vi.fn()} onSubmitFollowUp={vi.fn()} onRevealPhone={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "保存跟进" }));
  expect(screen.getByText("请选择外呼状态")).toBeVisible();
  expect(screen.getByText("请选择加盟意向")).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test -- tests/lead-detail.test.tsx`

Expected: FAIL because `LeadDetailDrawer` does not exist.

- [ ] **Step 3: Implement the drawer and form**

Use a semantic dialog. Move focus to the heading on open and return focus to the row trigger on close. Include base information, latest state, call history, remote history, and conflict notice. Full phone display requires the explicit “查看完整号码” button.

- [ ] **Step 4: Implement validation and submit feedback**

Validate on blur and submit. Show an error summary at the top of the form and inline messages near fields. Disable the submit button while saving and show success or failure status after completion.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test -- tests/lead-detail.test.tsx && pnpm build`

Expected: tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/LeadDetailDrawer.tsx src/pages/LeadsPage.tsx src/data/repository.ts tests/lead-detail.test.tsx
git commit -m "feat: add lead detail and follow-up workflow"
```

## Task 6: Offline Leads, Reports, and Sync Status

**Files:**
- Create: `src/pages/OfflineLeadsPage.tsx`
- Create: `src/pages/ReportsPage.tsx`
- Create: `src/pages/SyncPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/repository.ts`
- Test: `tests/offline-leads.test.tsx`

**Interfaces:**
- Produces: `OfflineLeadsPage({ leads, onCreate, onFollowUp })`
- Produces: `ReportsPage({ leads })`
- Produces: `SyncPage({ status, onSync })`

- [ ] **Step 1: Write a failing offline creation test**

```tsx
it("creates a local-only offline lead", async () => {
  const onCreate = vi.fn();
  render(<OfflineLeadsPage leads={[]} onCreate={onCreate} onFollowUp={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "新增线下线索" }));
  await userEvent.type(screen.getByLabelText("姓名"), "测试用户");
  await userEvent.type(screen.getByLabelText("手机号"), "13800000000");
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ source: "offline" }));
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test -- tests/offline-leads.test.tsx`

Expected: FAIL because `OfflineLeadsPage` does not exist.

- [ ] **Step 3: Implement offline leads**

Support local status, source, owner, notes, and next follow-up. Every row and card carries the “仅本地” label and never renders a sync-outbox action.

- [ ] **Step 4: Implement reports and sync status**

Reports use the current filter snapshot and show today inflow, call outcomes, intent, offline status, and export feedback. Sync status shows connector state, last pull, last write, queue counts, recent errors, and a manual full-sync action.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test -- tests/offline-leads.test.tsx && pnpm build`

Expected: tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/OfflineLeadsPage.tsx src/pages/ReportsPage.tsx src/pages/SyncPage.tsx src/App.tsx src/data/repository.ts tests/offline-leads.test.tsx
git commit -m "feat: add offline leads reports and sync status"
```

## Task 7: Responsive and Accessibility Verification

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`
- Modify: `README.md`
- Test: `tests/accessibility.test.tsx`

**Interfaces:**
- Verifies all previously produced screens without changing domain interfaces.

- [ ] **Step 1: Add failing accessibility smoke tests**

```tsx
it("provides a skip link and one main landmark", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "跳到主要内容" })).toBeVisible();
  expect(screen.getAllByRole("main")).toHaveLength(1);
});
```

- [ ] **Step 2: Run the test and verify it fails if the landmark contract regressed**

Run: `pnpm test -- tests/accessibility.test.tsx`

Expected: PASS only when the shell semantics are complete.

- [ ] **Step 3: Verify responsive layouts**

Run the app and capture screenshots at 375x812, 768x1024, 1024x768, and 1440x900.

Expected: no horizontal page scroll; KPI cards, tables, charts, drawer, filters, and bottom navigation remain readable and do not overlap.

- [ ] **Step 4: Run the complete verification**

Run: `pnpm test && pnpm build`

Expected: all tests PASS and production build succeeds.

- [ ] **Step 5: Document local startup**

Add `README.md` with install, test, build, and dev-server commands. State that the MVP uses deterministic mock data and does not write to `cyf`.

- [ ] **Step 6: Commit**

```bash
git add src/styles README.md tests/accessibility.test.tsx
git commit -m "test: verify responsive web workbench"
```

## Self-Review

- Spec coverage: the plan covers the dashboard, lead list, filtering, lead detail, call recording, offline leads, reports, export feedback, sync status, audit-facing operator labels, responsive Web behavior, and accessibility.
- Deferred by scope: Android, Fastify/PostgreSQL persistence, authentication, real CYF connector, Cloudflare Tunnel, backup jobs, and real write-back.
- No placeholder steps: every task has a concrete deliverable and verification command.
- Type consistency: `Lead`, `FollowUp`, `LeadRepository`, `PageId`, filter inputs, and callback names are introduced before consumers use them.

