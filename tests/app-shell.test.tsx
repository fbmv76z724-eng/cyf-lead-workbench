import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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
