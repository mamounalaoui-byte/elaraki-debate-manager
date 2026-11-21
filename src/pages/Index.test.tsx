import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Index from "./Index";
import { Debate } from "@/lib/debate";
const mocks = vi.hoisted(() => ({ png: vi.fn().mockResolvedValue("data:image/png;base64,poster"), save: vi.fn(), addImage: vi.fn(), full: vi.fn().mockResolvedValue(undefined) }));
vi.mock("html-to-image", () => ({ toPng: mocks.png }));
vi.mock("jspdf", () => ({ jsPDF: class { addImage = mocks.addImage; save = mocks.save; } }));
vi.mock("@/components/DebatePoster", async () => {
  const { forwardRef } = await import("react");
  return {
    reference: (mode: string) => `/assets/${mode === "fr" ? "french-reference.png" : "english-reference.jpg"}`,
    default: forwardRef<HTMLDivElement, { debate: Debate }>(({ debate }, ref) => <div ref={ref} className="debate-poster" data-ready="true">{debate.topic}<div className="poster-timer">00:00</div></div>),
  };
});
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: mocks.full });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
const openDebate = () => {
  render(<Index />);
  fireEvent.click(screen.getByText("English Debate"));
  fireEvent.change(screen.getByLabelText("Debate topic"), { target: { value: "A new debate topic" } });
  fireEvent.change(screen.getByLabelText("Government"), { target: { value: "Group A" } });
  fireEvent.change(screen.getByLabelText("Opposition"), { target: { value: "Group B" } });
  fireEvent.click(screen.getByText("Generate Debate"));
};
describe("complete application workflows", () => {
  it("creates a debate, returns home and reopens it from local history", () => {
    openDebate(); expect(screen.getByText("A new debate topic")).toBeTruthy();
    fireEvent.click(screen.getByText("Home")); expect(screen.getByText("Recent debates")).toBeTruthy();
    fireEvent.click(screen.getByText("A new debate topic")); expect(screen.getByText("Test bell")).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("elaraki-debates-v1")!); expect(stored[0].teamA).toBe("Group A");
  });
  it("switches interface language and remembers the choice", () => {
    render(<Index />); fireEvent.click(screen.getByRole("button", { name: "FR" }));
    expect(screen.getByText("CHOISISSEZ VOTRE DÉBAT")).toBeTruthy(); expect(localStorage.getItem("elaraki-language")).toBe("fr");
  });
  it("activates fullscreen presentation and can exit the fallback with Escape", async () => {
    openDebate(); fireEvent.click(screen.getByText("Present"));
    await waitFor(() => expect(mocks.full).toHaveBeenCalledOnce()); expect(document.querySelector(".presenting")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" }); expect(document.querySelector(".presenting")).toBeNull();
  });
  it("runs high-resolution poster export and downloads the PDF", async () => {
    openDebate(); fireEvent.click(screen.getByRole("button", { name: "PDF" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(mocks.png.mock.calls[0][1].pixelRatio).toBe(3); expect(mocks.addImage).toHaveBeenCalledWith("data:image/png;base64,poster", "PNG", 0, 0, 297, 167.0625, undefined, "FAST");
  });
  it("PDF can exclude the timer overlays", async () => {
    openDebate(); fireEvent.click(screen.getByRole("switch")); fireEvent.click(screen.getByRole("button", { name: "PDF" }));
    await waitFor(() => expect(mocks.png).toHaveBeenCalledOnce());
    const filter = mocks.png.mock.calls[0][1].filter;
    const timer = document.createElement("div"); timer.className = "poster-timer";
    expect(filter(timer)).toBe(false); expect(filter(document.createElement("canvas"))).toBe(true);
  });
  it("offers a new clean preparation form", () => {
    openDebate(); fireEvent.click(screen.getByText("New debate"));
    expect((screen.getByLabelText("Debate topic") as HTMLTextAreaElement).value).toBe("");
  });
});
