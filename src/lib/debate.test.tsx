import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import DebateTimer from "@/components/DebateTimer";
import DebateForm from "@/components/DebateForm";
import { Debate, elapsed, formatTime, freshClock, loadDebates, notifications, storeDebates, toggleClock, topicHeight } from "./debate";
import { ringBell } from "./bell";
import { jsPDF } from "jspdf";
vi.mock("./bell", () => ({ ringBell: vi.fn().mockResolvedValue(undefined), unlockAudio: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); localStorage.clear(); });
describe("accurate elapsed timer logic", () => {
  it("starts at 00:00 and uses MM:SS only", () => { expect(formatTime(0)).toBe("00:00"); expect(formatTime(183999)).toBe("03:03"); expect(formatTime(3600000)).toBe("60:00"); });
  it("preserves fractional seconds across pause and resume", () => {
    let clock = toggleClock(freshClock(), 1000);
    clock = toggleClock(clock, 2520);
    expect(elapsed(clock, 9000)).toBe(1520);
    clock = toggleClock(clock, 10000);
    expect(elapsed(clock, 10750)).toBe(2270);
  });
  it("catches delayed ticks without drift", () => { const clock = toggleClock(freshClock(), 100); expect(elapsed(clock, 240100)).toBe(240000); expect(notifications(clock, 240100)).toEqual([60, 180, 240]); });
  it("does not repeat markers and reset clears markers", () => { const clock = { ...toggleClock(freshClock(), 0), fired: [60, 180] }; expect(notifications(clock, 240000)).toEqual([240]); expect(freshClock().fired).toEqual([]); });
});
describe("interactive poster timers", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "performance"] }));
  const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
  it("positions and operates French timers independently", () => {
    const { container } = render(<><DebateTimer label="POUR" volume={1} position="left" ui="fr" /><DebateTimer label="CONTRE" volume={1} position="right" ui="fr" /></>);
    expect(container.querySelector(".timer-left")).not.toBeNull(); expect(container.querySelector(".timer-right")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("POUR: Start")); advance(6500);
    expect(within(screen.getByLabelText("POUR")).getByText("00:06")).toBeTruthy();
    expect(within(screen.getByLabelText("CONTRE")).getByText("00:00")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("CONTRE: Start")); fireEvent.click(screen.getByLabelText("POUR: Pause")); advance(5000);
    expect(within(screen.getByLabelText("POUR")).getByText("00:06")).toBeTruthy();
    expect(within(screen.getByLabelText("CONTRE")).getByText("00:05")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("POUR: Reset")); advance(1000);
    expect(within(screen.getByLabelText("POUR")).getByText("00:00")).toBeTruthy();
    expect(within(screen.getByLabelText("CONTRE")).getByText("00:06")).toBeTruthy(); expect(ringBell).not.toHaveBeenCalled();
  });
  it("English has one centered timer and bells exactly at 1, 3 and 4 minutes", () => {
    const { container } = render(<DebateTimer label="SPEAKING TIME" english volume={0.65} position="center" ui="en" />);
    expect(container.querySelectorAll(".poster-timer").length).toBe(1); expect(container.querySelector(".timer-center")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("SPEAKING TIME: Start")); advance(59900); expect(ringBell).not.toHaveBeenCalled();
    advance(101); expect(ringBell).toHaveBeenCalledTimes(1); expect(ringBell).toHaveBeenLastCalledWith(0.65);
    advance(120000); expect(ringBell).toHaveBeenCalledTimes(2);
    advance(60000); expect(ringBell).toHaveBeenCalledTimes(3);
    advance(60000); expect(ringBell).toHaveBeenCalledTimes(3);
  });
  it("pause/resume does not repeat bells and reset starts a fresh session", () => {
    render(<DebateTimer label="EN" english volume={1} position="center" ui="en" />);
    fireEvent.click(screen.getByLabelText("EN: Start")); advance(60001); expect(ringBell).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("EN: Pause")); advance(120000); expect(ringBell).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("EN: Start")); advance(1000); expect(ringBell).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("EN: Reset")); expect(screen.getByText("00:00")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("EN: Start")); advance(60200); expect(ringBell).toHaveBeenCalledTimes(2);
  });
});
describe("debate creation and storage", () => {
  it.each(["fr", "en"] as const)("generates a %s debate without changing topic or team text", mode => {
    const onGenerate = vi.fn();
    render(<DebateForm mode={mode} ui="en" onBack={vi.fn()} onGenerate={onGenerate} />);
    const topic = "  Faut-il changer ?\nA topic exactly as entered!  ";
    fireEvent.change(screen.getByLabelText("Debate topic"), { target: { value: topic } });
    fireEvent.change(document.getElementById("team-a")!, { target: { value: "1SM1" } });
    fireEvent.change(document.getElementById("team-b")!, { target: { value: "2SMB" } });
    fireEvent.click(screen.getByText("Generate Debate"));
    expect(onGenerate).toHaveBeenCalledWith({ topic, teamA: "1SM1", teamB: "2SMB" });
  });
  it("clears the preparation form", () => {
    render(<DebateForm mode="en" ui="en" onBack={vi.fn()} onGenerate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Debate topic"), { target: { value: "Some topic" } }); fireEvent.click(screen.getByText("Clear form"));
    expect((screen.getByLabelText("Debate topic") as HTMLTextAreaElement).value).toBe("");
  });
  it("stores and reopens debates locally with exact multiline topics", () => {
    const debate: Debate = { id: "1", mode: "fr", topic: "  Bonjour\nmonde !", teamA: "A", teamB: "B", createdAt: "2026-01-01" };
    storeDebates([debate]); expect(loadDebates()).toEqual([debate]); storeDebates([]); expect(loadDebates()).toEqual([]);
  });
  it("safely handles invalid history", () => { localStorage.setItem("elaraki-debates-v1", "bad json"); expect(loadDebates()).toEqual([]); localStorage.setItem("elaraki-debates-v1", '[{"id":1}]'); expect(loadDebates()).toEqual([]); });
  it("expands and contracts the topic area including explicit newlines", () => { expect(topicHeight("Short topic")).toBe(12); expect(topicHeight("x".repeat(140))).toBeGreaterThan(12); expect(topicHeight("x".repeat(1000))).toBe(24); expect(topicHeight("a\nb\nc\nd\ne")).toBe(24); });
  it("creates a valid landscape PDF with the chosen paper ratio", () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167.0625] });
    pdf.text("EL ARAKI DEBATE MANAGER", 10, 10);
    expect(pdf.output().startsWith("%PDF-")).toBe(true);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(297, 2);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(167.0625, 2);
  });
});
