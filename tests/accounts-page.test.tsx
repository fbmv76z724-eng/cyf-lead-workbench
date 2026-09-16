import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AccountsPage } from "../src/pages/AccountsPage";

it("edits an existing account", async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const profile = {
    id: "profile-1",
    displayName: "管理员",
    email: "admin@example.com",
    role: "admin" as const,
    active: true,
  };

  render(
    <AccountsPage
      onCreate={vi.fn()}
      onUpdate={onUpdate}
      profiles={[profile]}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: "编辑账号 管理员" }),
  );
  await userEvent.clear(screen.getByLabelText("账号姓名"));
  await userEvent.type(screen.getByLabelText("账号姓名"), "新管理员");
  await userEvent.clear(screen.getByLabelText("账号邮箱"));
  await userEvent.type(screen.getByLabelText("账号邮箱"), "new@example.com");
  await userEvent.type(screen.getByLabelText("新密码"), "new-password");
  await userEvent.click(screen.getByRole("button", { name: "保存修改" }));

  expect(onUpdate).toHaveBeenCalledWith({
    id: "profile-1",
    displayName: "新管理员",
    email: "new@example.com",
    password: "new-password",
    role: "admin",
    active: true,
  });
});
