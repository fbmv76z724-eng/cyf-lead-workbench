import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { mockFollowUps, mockLeads } from "../src/data/mockLeads";
import { filterLeads, emptyLeadFilters } from "../src/data/selectors";
import { LeadsPage } from "../src/pages/LeadsPage";

it("filters offline leads by status", () => {
  const result = filterLeads(mockLeads, {
    ...emptyLeadFilters,
    source: "offline",
    localStatus: "待跟进",
  });
  expect(result).toHaveLength(1);
  expect(result[0].source).toBe("offline");
});

it("applies search filters", async () => {
  render(
    <LeadsPage
      getFollowUps={(leadId) =>
        mockFollowUps.filter((followUp) => followUp.leadId === leadId)
      }
      leads={mockLeads}
      onCloseDetail={vi.fn()}
      onRevealPhone={async (lead) => lead.phoneFull}
      onSelect={vi.fn()}
      onSubmitFollowUp={vi.fn()}
    />,
  );
  await userEvent.type(
    screen.getByLabelText("搜索司机ID或手机号"),
    "2000000000000001",
  );
  expect(screen.getAllByText("ID 2000000000000001")).toHaveLength(2);
  expect(screen.queryByText("ID 2000000000000002")).not.toBeInTheDocument();
});
