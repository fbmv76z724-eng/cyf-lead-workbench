import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../src/pages/LoginPage";

it("submits email and password", async () => {
  const signIn = vi.fn().mockResolvedValue(undefined);
  render(<LoginPage signIn={signIn} />);

  await userEvent.type(screen.getByLabelText("邮箱"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("密码"), "secret123");
  await userEvent.click(screen.getByRole("button", { name: "登录" }));

  expect(signIn).toHaveBeenCalledWith("admin@example.com", "secret123");
});
