import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { mockLeads } from "../src/data/mockLeads";
import { getDashboardMetrics } from "../src/data/selectors";
import { DashboardPage } from "../src/pages/DashboardPage";

it("counts today's cyf inflow and pending calls", () => {
  const metrics = getDashboardMetrics(
    mockLeads,
    new Date("2026-09-16T10:00:00+08:00"),
  );
  expect(metrics.todayInflow).toBe(3);
  expect(metrics.waitingForCall).toBe(4);
  expect(metrics.syncIssues).toBe(2);
});

it("shows the KPI strip and sync health", () => {
  render(
    <DashboardPage leads={mockLeads} onNavigate={vi.fn()} onSync={vi.fn()} />,
  );

  expect(screen.getByText("今日流入")).toBeVisible();
  expect(screen.getByText("待外呼")).toBeVisible();
  expect(screen.getByText("2 条待处理")).toBeVisible();
});
