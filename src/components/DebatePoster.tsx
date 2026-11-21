import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { Debate, Language } from "@/lib/debate";
import DebateTimer from "./DebateTimer";

const topicAreas = {
  fr: { x: 360 / 1672, y: 383 / 941, width: 951 / 1672, height: 171 / 941 },
  en: { x: 303 / 1366, y: 322 / 768, width: 754 / 1366, height: 160 / 768 },
};
export const reference = (mode: Language) => `/assets/${mode === "fr" ? "french-reference.png" : "english-reference.jpg"}`;
const DebatePoster = forwardRef<HTMLDivElement, { debate: Debate; ui: Language; volume: number }>(({ debate, ui, volume }, ref) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const topic = useRef<HTMLDivElement>(null);
  const topicCopy = useRef<HTMLSpanElement>(null);
  const teamA = useRef<HTMLDivElement>(null);
  const teamB = useRef<HTMLDivElement>(null);
  const area = topicAreas[debate.mode];
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    setReady(false);
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled || !canvas.current) return;
      const c = canvas.current;
      c.width = image.naturalWidth; c.height = image.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const w = c.width, h = c.height;
      // Replace only the printed year; preserve the reference's original title lettering.
      const yearX = debate.mode === "fr" ? 0.643 : 0.599;
      const yearWidth = debate.mode === "fr" ? 0.177 : 0.158;
      ctx.drawImage(image, w * yearX, h * 0.283, w * yearWidth, h * 0.01, w * yearX, h * 0.297, w * yearWidth, h * 0.078);
      // Clear only inside the original frame, leaving its printed border untouched.
      ctx.drawImage(image, w * area.x, h * 0.377, w * area.width, h * 0.012, w * area.x, h * area.y, w * area.width, h * area.height);
      // Preserve the team labels and VS while removing only the printed class names.
      ctx.fillStyle = "#ffffff";
      if (debate.mode === "fr") {
        ctx.fillRect(w * 0.239, h * 0.84, w * 0.156, h * 0.091);
        ctx.fillRect(w * 0.582, h * 0.84, w * 0.171, h * 0.091);
      } else {
        ctx.fillRect(w * 0.261, h * 0.861, w * 0.118, h * 0.09);
        ctx.fillRect(w * 0.595, h * 0.854, w * 0.111, h * 0.092);
      }
      setReady(true);
    };
    image.src = reference(debate.mode);
    return () => { cancelled = true; };
  }, [debate.mode, area]);
  useLayoutEffect(() => {
    const labels = [title.current, teamA.current, teamB.current].filter(Boolean) as HTMLDivElement[];
    const fit = () => {
      labels.forEach(node => {
        const max = node === title.current && debate.mode === "fr" ? 0.047 : 0.04;
        let size = node.closest(".debate-poster")!.clientWidth * max;
        node.style.fontSize = `${size}px`;
        while ((node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1) && size > 1) {
          size -= 0.5; node.style.fontSize = `${size}px`;
        }
      });
      const box = topic.current;
      const text = topicCopy.current;
      if (!box || !text || box.clientWidth === 0 || box.clientHeight === 0) return;
      let low = 1;
      let high = box.clientHeight / 1.05;
      for (let step = 0; step < 16; step++) {
        const size = (low + high) / 2;
        text.style.fontSize = `${size}px`;
        if (text.scrollHeight <= box.clientHeight && text.scrollWidth <= box.clientWidth) low = size;
        else high = size;
      }
      text.style.fontSize = `${low}px`;
    };
    const observer = new ResizeObserver(fit);
    [...labels, topic.current].filter(Boolean).forEach(node => observer.observe(node!));
    fit();
    return () => observer.disconnect();
  }, [debate.topic, debate.teamA, debate.teamB, debate.schoolYear, debate.mode, ready]);
  return <div ref={ref} className={`debate-poster ${debate.mode}`} data-ready={ready}>
    <canvas ref={canvas} className="poster-artwork" aria-hidden="true" />
    {!ready && <div className="absolute inset-0 grid place-items-center bg-[#2468aa] text-white">{ui === "fr" ? "Préparation de l’affiche…" : "Preparing poster…"}</div>}
    {ready && <>
      <div ref={title} className="poster-year" aria-label={ui === "fr" ? "Année scolaire" : "School year"}>{debate.schoolYear}</div>
      <div className="topic-frame" style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.width * 100}%`, height: `${area.height * 100}%` }}><div ref={topic} className="topic-text"><span ref={topicCopy} className="topic-copy">{debate.topic}</span></div></div>
      <div ref={teamA} className="poster-team team-a">{debate.teamA}</div>
      <div ref={teamB} className="poster-team team-b">{debate.teamB}</div>
      <DebateTimer label={debate.mode === "fr" ? "POUR" : ui === "fr" ? "TEMPS DE PAROLE" : "SPEAKING TIME"} english={debate.mode === "en"} volume={volume} position={debate.mode === "fr" ? "left" : "center"} ui={ui} />
      {debate.mode === "fr" && <DebateTimer label="CONTRE" volume={volume} position="right" ui={ui} />}
    </>}
  </div>;
});
DebatePoster.displayName = "DebatePoster";
export default DebatePoster;
