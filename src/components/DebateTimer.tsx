import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { elapsed, formatTime, freshClock, notifications, toggleClock } from "@/lib/debate";
import { ringBell, unlockAudio } from "@/lib/bell";
import { toast } from "sonner";

type Props = { label: string; english?: boolean; volume: number; position: "left" | "right" | "center"; ui: "en" | "fr" };
export default function DebateTimer({ label, english, volume, position, ui }: Props) {
  const clock = useRef(freshClock());
  const pending = useRef<number[]>([]);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const [display, setDisplay] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      setDisplay(elapsed(clock.current, now));
      if (english && clock.current.startedAt !== null) {
        const due = notifications(clock.current, now);
        if (due.length) {
          clock.current.fired.push(...due);
          due.forEach((_, index) => pending.current.push(window.setTimeout(() => { void ringBell(volumeRef.current).catch(() => toast.error(ui === "fr" ? "Son indisponible. Testez la cloche." : "Audio unavailable. Please test the bell.")); }, index * 1000)));
        }
      }
    };
    const interval = window.setInterval(tick, 100);
    return () => { window.clearInterval(interval); pending.current.forEach(id => window.clearTimeout(id)); pending.current = []; };
  }, [english, ui]);
  const toggle = () => {
    if (english) void unlockAudio().catch(() => toast.error(ui === "fr" ? "Veuillez autoriser le son." : "Please allow audio playback."));
    clock.current = toggleClock(clock.current, performance.now());
    setRunning(clock.current.startedAt !== null);
    setDisplay(elapsed(clock.current, performance.now()));
  };
  return <div className={`poster-timer timer-${position}`} aria-label={label}>
    <span className="timer-label">{label}</span>
    <div className="timer-digits" aria-live="off">{formatTime(display)}</div>
    <div className="timer-buttons">
      <button onClick={toggle} aria-label={`${label}: ${running ? "Pause" : "Start"}`} className={running ? "is-running" : ""}>{running ? <Pause /> : <Play />}{running ? "PAUSE" : ui === "fr" ? "DÉMARRER" : "START"}</button>
      <button aria-label={`${label}: Reset`} onClick={() => { pending.current.forEach(id => window.clearTimeout(id)); pending.current = []; clock.current = freshClock(); setDisplay(0); setRunning(false); }}><RotateCcw />{ui === "fr" ? "RAZ" : "RESET"}</button>
    </div>
  </div>;
}
