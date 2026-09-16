import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { getNavigationItems } from "../src/app/navigation";
import { LeadList } from "../src/components/LeadList";
import { mockLeads } from "../src/data/mockLeads";

it("filters administrator-only navigation for sales users", () => {
  expect(getNavigationItems("sales").map((item) => item.id)).toEqual([
    "dashboard",
    "leads",
    "offline",
  ]);
  expect(getNavigationItems("admin").map((item) => item.id)).toEqual([
    "dashboard",
    "leads",
    "offline",
    "reports",
    "sync",
    "accounts",
  ]);
});

it("shows a claim action for an unassigned lead", () => {
  render(
    <LeadList
      leads={[{ ...mockLeads[0], ownerId: undefined }]}
      onClaim={vi.fn()}
      onRevealPhone={async (lead) => lead.phoneFull}
      onSelect={vi.fn()}
    />,
  );

  expect(
    screen.getAllByRole("button", {
      name: `认领线索 ${mockLeads[0].phoneMasked}`,
    }),
  ).toHaveLength(2);
});
