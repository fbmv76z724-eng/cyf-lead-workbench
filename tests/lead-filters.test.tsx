import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { mockFollowUps, mockLeads } from "../src/data/mockLeads";
import {
  emptyLeadFilters,
  filterLeads,
  getLeadOrigin,
} from "../src/data/selectors";
import { LeadsPage } from "../src/pages/LeadsPage";
import { toLocalDateInputKey } from "../src/utils/format";

const offlineLead = {
  ...mockLeads[0],
  id: "test-offline",
  source: "offline" as const,
  channelType: "转介绍",
  inCompanyTime: "2026-09-15T14:00:00+08:00",
  localStatus: "待跟进" as const,
};

it("filters referral leads and an inclusive inflow date range", () => {
  const referralLeads = filterLeads([...mockLeads, offlineLead], {
    ...emptyLeadFilters,
    origin: "referral",
  });
  expect(referralLeads).toHaveLength(1);
  expect(referralLeads[0].channelType).toBe("转介绍");

  const dailyLeads = filterLeads(mockLeads, {
    ...emptyLeadFilters,
    dateFrom: "2026-09-15",
    dateTo: "2026-09-15",
  });
  expect(dailyLeads).toHaveLength(8);
  expect(
    dailyLeads.every(
      (lead) => toLocalDateInputKey(lead.inCompanyTime) === "2026-09-15",
    ),
  ).toBe(true);
});

it("classifies recruitment-website leads as offline", () => {
  expect(getLeadOrigin("招聘网站")).toBe("offline");
  expect(getLeadOrigin("司机介绍")).toBe("referral");
  expect(getLeadOrigin("门店")).toBe("offline");
  expect(getLeadOrigin("转介绍")).toBe("referral");
});

it("finds a lead by its full phone number while the list shows a masked value", () => {
  const result = filterLeads(
    [
      {
        ...mockLeads[0],
        id: "lead-full-phone",
        phoneMasked: "191****5089",
        phoneFull: "19136005089",
      },
    ],
    {
    ...emptyLeadFilters,
      search: "19136005089",
    },
  );

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("lead-full-phone");
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
    "2885118908860505",
  );
  expect(screen.getByLabelText("流入开始日期")).toBeVisible();
  expect(screen.getByLabelText("流入结束日期")).toBeVisible();
  expect(screen.getByLabelText("线索来源")).toBeVisible();
  expect(screen.getAllByText("ID 2885118908860505")).toHaveLength(2);
  expect(screen.queryByText("ID 2885118908785293")).not.toBeInTheDocument();
});
