import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { OfflineLeadsPage } from "../src/pages/OfflineLeadsPage";

it("creates a local-only offline lead", async () => {
  const onCreate = vi.fn();
  render(<OfflineLeadsPage leads={[]} onCreate={onCreate} onFollowUp={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "新增线下线索" }));
  expect(screen.getByRole("option", { name: "司机介绍" })).toHaveValue("司机介绍");
  expect(screen.getByRole("option", { name: "招聘网站" })).toHaveValue("招聘网站");
  expect(screen.queryByLabelText("城市")).not.toBeInTheDocument();
  expect(screen.getByLabelText("期望区域")).toHaveValue("西昌市");
  expect(
    screen.getAllByRole("option").slice(0, 6).map((option) => option.textContent),
  ).toEqual(["西昌市", "会理市", "德昌县", "冕宁县", "盐源县", "越西县"]);
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
