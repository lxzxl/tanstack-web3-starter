import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast("success", "Saved!")}>
      go
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a pushed toast and dismisses it on click", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("go"));

    const toast = await screen.findByText("Saved!");
    expect(toast).toBeInTheDocument();

    fireEvent.click(toast);
    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });
});
