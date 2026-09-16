import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { LeadDetailDrawer } from "../src/components/LeadDetailDrawer";
import { mockLeads } from "../src/data/mockLeads";

it("requires call status and intent before submitting", async () => {
  render(
    <LeadDetailDrawer
      history={[]}
      lead={mockLeads[0]}
      onClose={vi.fn()}
      onRevealPhone={async () => mockLeads[0].phoneFull}
      onSubmitFollowUp={vi.fn()}
      open
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "保存跟进" }));
  const errorSummary = screen.getByRole("alert");
  expect(within(errorSummary).getByText("请选择外呼状态")).toBeVisible();
  expect(within(errorSummary).getByText("请选择加盟意向")).toBeVisible();
});

it("submits a valid follow-up and shows feedback", async () => {
  const onSubmitFollowUp = vi.fn().mockResolvedValue(undefined);
  render(
    <LeadDetailDrawer
      history={[]}
      lead={mockLeads[0]}
      onClose={vi.fn()}
      onRevealPhone={async () => mockLeads[0].phoneFull}
      onSubmitFollowUp={onSubmitFollowUp}
      open
    />,
  );

  await userEvent.selectOptions(screen.getByLabelText("外呼状态 *"), "1");
  await userEvent.selectOptions(screen.getByLabelText("加盟意向 *"), "1");
  await userEvent.click(screen.getByRole("button", { name: "保存跟进" }));

  expect(onSubmitFollowUp).toHaveBeenCalledWith(
    expect.objectContaining({ leadId: "lead-001", linkStatus: 1 }),
  );
  expect(
    await screen.findByText("跟进记录已保存，等待同步到 CYF。"),
  ).toBeVisible();
});

it("keeps the masked phone and offers a retry when reveal fails", async () => {
  const onRevealPhone = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce("19100000001");

  render(
    <LeadDetailDrawer
      history={[]}
      lead={mockLeads[0]}
      onClose={vi.fn()}
      onRevealPhone={onRevealPhone}
      onSubmitFollowUp={vi.fn()}
      open
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "查看完整号码" }));

  expect(
    await screen.findByText("暂未获取到完整号码，请重试"),
  ).toBeVisible();
  expect(screen.getByText(mockLeads[0].phoneMasked)).toBeVisible();

  await userEvent.click(screen.getByRole("button", { name: "重试获取" }));

  expect(await screen.findByText("19100000001")).toBeVisible();
  expect(onRevealPhone).toHaveBeenCalledTimes(2);
});
