import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { LeadList } from "../src/components/LeadList";
import { mockFollowUps, mockLeads } from "../src/data/mockLeads";

it("keeps synced CYF phone numbers and follow history", () => {
  const lead = mockLeads[0];
  const history = mockFollowUps.filter((item) => item.leadId === lead.id);

  expect(lead.phoneFull).toBe("19136005089");
  expect(lead.latestLinkStatus).toBe(1);
  expect(lead.latestFollowUser).toBe("沙马五字莫");
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({
    origin: "cyf",
    syncState: "synced",
    operatorName: "沙马五字莫",
  });
});

it("shows inflow time and driver source in the lead list", () => {
  render(
    <LeadList
      leads={[mockLeads[0]]}
      onRevealPhone={async (lead) => lead.phoneFull}
      onSelect={vi.fn()}
    />,
  );

  expect(screen.getByRole("columnheader", { name: "流入时间" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "司机来源" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "跟进人员" })).toBeVisible();
  expect(
    screen.queryByRole("columnheader", { name: "最新外呼" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("columnheader", { name: "最新跟进" }),
  ).not.toBeInTheDocument();
  expect(within(screen.getByRole("table")).getByText("线上")).toBeVisible();
  expect(
    within(screen.getByRole("table")).getByText("沙马五字莫"),
  ).toBeVisible();
  expect(
    within(screen.getByRole("table")).getByText("09/16 12:14"),
  ).toBeVisible();
});

it("reveals the full phone number from the list", async () => {
  const onRevealPhone = vi.fn().mockResolvedValue("19136005089");

  render(
    <LeadList
      leads={[mockLeads[0]]}
      onRevealPhone={onRevealPhone}
      onSelect={vi.fn()}
    />,
  );

  const table = screen.getByRole("table");
  await userEvent.click(
    within(table).getByRole("button", { name: "获取完整手机号 191****5089" }),
  );

  expect(onRevealPhone).toHaveBeenCalledWith(mockLeads[0]);
  expect(await within(table).findByText("19136005089")).toBeVisible();
});

it("copies the CYF driver id from the list", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(
    <LeadList
      leads={[mockLeads[0]]}
      onRevealPhone={async (lead) => lead.phoneFull}
      onSelect={vi.fn()}
    />,
  );

  const table = screen.getByRole("table");
  await userEvent.click(
    within(table).getByRole("button", {
      name: "复制司机ID 2885118908860505",
    }),
  );

  expect(writeText).toHaveBeenCalledWith("2885118908860505");
});
