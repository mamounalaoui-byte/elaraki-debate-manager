export type Language = "fr" | "en";
export const DEFAULT_SCHOOL_YEAR = "2026-2027";
export const isSchoolYear = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{4}$/.test(value) && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1;
export type Debate = { id: string; mode: Language; topic: string; teamA: string; teamB: string; schoolYear: string; createdAt: string };
export type Clock = { accumulated: number; startedAt: number | null; fired: number[] };
export const freshClock = (): Clock => ({ accumulated: 0, startedAt: null, fired: [] });
export const elapsed = (clock: Clock, now: number) => clock.accumulated + (clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt));
export function toggleClock(clock: Clock, now: number): Clock {
  return clock.startedAt === null ? { ...clock, startedAt: now } : { ...clock, accumulated: elapsed(clock, now), startedAt: null };
}
export function notifications(clock: Clock, now: number): number[] {
  return [60, 180, 240].filter(second => elapsed(clock, now) >= second * 1000 && !clock.fired.includes(second));
}
export function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
const key = "elaraki-debates-v1";
export function loadDebates(): Debate[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data.filter((d): d is Debate => d && typeof d.id === "string" && (d.mode === "fr" || d.mode === "en") && [d.topic, d.teamA, d.teamB, d.createdAt].every(v => typeof v === "string")).map(d => ({ ...d, schoolYear: isSchoolYear(d.schoolYear) ? d.schoolYear : DEFAULT_SCHOOL_YEAR })) : [];
  } catch { return []; }
}
export function storeDebates(debates: Debate[]) { localStorage.setItem(key, JSON.stringify(debates)); }
