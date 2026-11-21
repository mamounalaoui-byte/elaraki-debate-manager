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
  const expectedInterior = mode === "fr" ? [360, 383, 951, 171] : [303, 322, 754, 160];
  drawImage.mock.calls[2].slice(5).forEach((coordinate, index) => expect(coordinate).toBeCloseTo(expectedInterior[index]));
  rerender(<DebatePoster debate={{ ...debate, schoolYear: "2028-2029" }} ui="fr" volume={0.8} />);
  expect(screen.getByLabelText("Année scolaire").textContent).toBe("2028-2029"); expect(screen.queryByText("2027-2028")).toBeNull();
});

it("maximizes topic text inside the unchanged frame and preserves long multiline input", () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("topic-text") ? 500 : this.classList.contains("debate-poster") ? 1000 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("topic-text") ? 120 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(function (this: HTMLElement) {
    if (!this.classList.contains("topic-copy")) return 0;
    const size = parseFloat(this.style.fontSize) || 1;
    const lines = (this.textContent || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length * size * 0.6 / 500)), 0);
    return Math.ceil(lines * size * 1.05);
  });
  const debate: Debate = { id: "1", mode: "fr", topic: "Court", teamA: "A", teamB: "B", schoolYear: "2027-2028", createdAt: "2026-01-01" };
  const { container, rerender } = render(<DebatePoster debate={debate} ui="fr" volume={0.8} />);
  const frame = container.querySelector(".topic-frame")!;
  const originalStyle = frame.getAttribute("style");
  const copy = container.querySelector(".topic-copy") as HTMLElement;
  const shortSize = parseFloat(copy.style.fontSize);
  expect(shortSize).toBeGreaterThan(34);
  const longTopic = `  ${"Un sujet beaucoup plus long. ".repeat(25)}\nUne deuxième ligne exacte.  `;
  rerender(<DebatePoster debate={{ ...debate, topic: longTopic }} ui="fr" volume={0.8} />);
  expect(frame.getAttribute("style")).toBe(originalStyle);
  expect(copy.textContent).toBe(longTopic);
  expect(parseFloat(copy.style.fontSize)).toBeLessThan(shortSize);
  expect(copy.scrollHeight).toBeLessThanOrEqual(120);
});
