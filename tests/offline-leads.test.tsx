import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { OfflineLeadsPage } from "../src/pages/OfflineLeadsPage";

it("creates a local-only offline lead", async () => {
  const onCreate = vi.fn();
  render(<OfflineLeadsPage leads={[]} onCreate={onCreate} onFollowUp={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "新增线下线索" }));
  await userEvent.type(screen.getByLabelText("姓名"), "测试用户");
  await userEvent.type(screen.getByLabelText("手机号"), "13800000000");
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(onCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "测试用户",
      phone: "13800000000",
      localStatus: "待跟进",
    }),
  );
});
