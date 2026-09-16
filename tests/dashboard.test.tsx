import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { mockOnboardingRecords } from "../src/data/mockOnboarding";
import { mockLeads } from "../src/data/mockLeads";
import {
  getDashboardMetrics,
  getPeriodComparisonMetrics,
} from "../src/data/selectors";
import { DashboardPage } from "../src/pages/DashboardPage";

it("counts today's cyf inflow and pending calls", () => {
  const metrics = getDashboardMetrics(
    mockLeads,
    new Date("2026-09-16T10:00:00+08:00"),
  );
  expect(metrics.todayInflow).toBe(5);
  expect(metrics.waitingForCall).toBe(0);
  expect(metrics.calledToday).toBe(5);
  expect(metrics.connectedToday).toBe(5);
  expect(metrics.syncIssues).toBe(0);
});

it("shows the KPI strip and sync health", () => {
  render(
    <DashboardPage leads={mockLeads} onNavigate={vi.fn()} onSync={vi.fn()} />,
  );

  expect(screen.getByText("今日流入")).toBeVisible();
  expect(screen.getByText("待外呼")).toBeVisible();
  expect(screen.getByText("同步正常")).toBeVisible();
});

it("aggregates today, this week, last week, and this month", () => {
  const periods = getPeriodComparisonMetrics(
    mockLeads,
    mockOnboardingRecords,
    new Date("2026-09-16T10:00:00+08:00"),
  );

  expect(periods.today).toMatchObject({
    inflow: 5,
    onboarded: 0,
    onboarding: { total: 0, didi: 0, xinju: 0, newDrivers: 0 },
    conversionRate: 0,
  });
  expect(periods.thisWeek).toMatchObject({
    inflow: 22,
    onboarded: 3,
    onboarding: { total: 3, didi: 1, xinju: 2, newDrivers: 2 },
    conversionRate: 13.6,
  });
  expect(periods.lastWeek).toMatchObject({
    inflow: 46,
    onboarded: 19,
    onboarding: { total: 19, didi: 13, xinju: 6, newDrivers: 19 },
    conversionRate: 41.3,
  });
  expect(periods.thisMonth).toMatchObject({
    inflow: 69,
    onboarded: 37,
    onboarding: { total: 37, didi: 27, xinju: 10, newDrivers: 34 },
    conversionRate: 53.6,
  });
});

it("shows the onboarding breakdown", () => {
  render(
    <DashboardPage
      leads={mockLeads}
      onboardingRecords={mockOnboardingRecords}
      onNavigate={vi.fn()}
      onSync={vi.fn()}
    />,
  );

  expect(screen.getByRole("heading", { name: "司机上岗结构" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "滴滴司机" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "新桔司机" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "纯新司机" })).toBeVisible();
});

it("renders both trends as unfilled lines with data points", () => {
  const { container } = render(
    <DashboardPage leads={mockLeads} onNavigate={vi.fn()} onSync={vi.fn()} />,
  );

  const chart = screen.getByRole("img", {
    name: "最近七天流入与外呼趋势图",
  });
  const inflowLine = container.querySelector(".chart-line--inflow");
  const callsLine = container.querySelector(".chart-line--calls");

  expect(inflowLine).toHaveAttribute("points");
  expect(callsLine).toHaveAttribute("points");
  expect(container.querySelectorAll(".chart-point")).toHaveLength(14);
  expect(chart).toBeVisible();
});
