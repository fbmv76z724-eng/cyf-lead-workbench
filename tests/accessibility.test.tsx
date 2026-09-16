import { render, screen } from "@testing-library/react";
import { WorkbenchApp } from "../src/App";

it("provides a skip link and one main landmark", () => {
  render(<WorkbenchApp />);
  expect(screen.getByRole("link", { name: "跳到主要内容" })).toBeVisible();
  expect(screen.getAllByRole("main")).toHaveLength(1);
});
