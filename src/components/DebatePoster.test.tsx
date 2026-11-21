import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DebatePoster from "./DebatePoster";
import { Debate } from "@/lib/debate";

const drawImage = vi.fn();
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage, fillRect: vi.fn(), fillStyle: "" } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal("Image", class {
    naturalWidth = 1672; naturalHeight = 941; onload: (() => void) | null = null;
    set src(value: string) { if (value.includes("english")) { this.naturalWidth = 1366; this.naturalHeight = 768; } this.onload?.(); }
  });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it.each(["fr", "en"] as const)("renders the selected year on the %s poster and updates it without changing timer placement", mode => {
  const debate: Debate = { id: "1", mode, topic: "A topic", teamA: "A", teamB: "B", schoolYear: "2027-2028", createdAt: "2026-01-01" };
  const { container, rerender } = render(<DebatePoster debate={debate} ui="fr" volume={0.8} />);
  expect(screen.getByLabelText("Année scolaire").textContent).toBe("2027-2028");
  expect(container.querySelectorAll(".poster-timer").length).toBe(mode === "fr" ? 2 : 1);
  expect(container.querySelector(mode === "fr" ? ".timer-left" : ".timer-center")).not.toBeNull();
  expect(drawImage.mock.calls[1][1]).toBeCloseTo((mode === "fr" ? 1672 : 1366) * (mode === "fr" ? 0.643 : 0.599));
  rerender(<DebatePoster debate={{ ...debate, schoolYear: "2028-2029" }} ui="fr" volume={0.8} />);
  expect(screen.getByLabelText("Année scolaire").textContent).toBe("2028-2029"); expect(screen.queryByText("2027-2028")).toBeNull();
});
