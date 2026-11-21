import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { Debate, Language, topicHeight } from "@/lib/debate";
import DebateTimer from "./DebateTimer";

export const reference = (mode: Language) => `/assets/${mode === "fr" ? "french-reference.png" : "english-reference.jpg"}`;
const DebatePoster = forwardRef<HTMLDivElement, { debate: Debate; ui: Language; volume: number }>(({ debate, ui, volume }, ref) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const topic = useRef<HTMLDivElement>(null);
  const teamA = useRef<HTMLDivElement>(null);
  const teamB = useRef<HTMLDivElement>(null);
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
      // Replace the printed topic area with the reference's own blank blue artwork.
      const x = debate.mode === "fr" ? 0.205 : 0.211;
      const width = debate.mode === "fr" ? 0.588 : 0.574;
      ctx.drawImage(image, w * x, h * 0.377, w * width, h * 0.012, w * x, h * 0.395, w * width, h * 0.252);
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
  }, [debate.mode]);
  useLayoutEffect(() => {
    const nodes = [title.current, topic.current, teamA.current, teamB.current].filter(Boolean) as HTMLDivElement[];
    const fit = () => nodes.forEach(node => {
      const max = node === title.current && debate.mode === "fr" ? 0.047 : node === topic.current ? 0.034 : 0.04;
      let size = node.closest(".debate-poster")!.clientWidth * max;
      node.style.fontSize = `${size}px`;
      while ((node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1) && size > 1) {
        size -= 0.5; node.style.fontSize = `${size}px`;
      }
    });
    const observer = new ResizeObserver(fit);
    nodes.forEach(node => observer.observe(node));
    fit();
    return () => observer.disconnect();
  }, [debate.topic, debate.teamA, debate.teamB, debate.schoolYear, debate.mode, ready]);
  return <div ref={ref} className={`debate-poster ${debate.mode}`} data-ready={ready}>
    <canvas ref={canvas} className="poster-artwork" aria-hidden="true" />
    {!ready && <div className="absolute inset-0 grid place-items-center bg-[#2468aa] text-white">{ui === "fr" ? "Préparation de l’affiche…" : "Preparing poster…"}</div>}
    {ready && <>
      <div ref={title} className="poster-year" aria-label={ui === "fr" ? "Année scolaire" : "School year"}>{debate.schoolYear}</div>
      <div className="topic-frame" style={{ height: `${topicHeight(debate.topic)}%` }}><div ref={topic} className="topic-text">{debate.topic}</div></div>
      <div ref={teamA} className="poster-team team-a">{debate.teamA}</div>
      <div ref={teamB} className="poster-team team-b">{debate.teamB}</div>
      <DebateTimer label={debate.mode === "fr" ? "POUR" : ui === "fr" ? "TEMPS DE PAROLE" : "SPEAKING TIME"} english={debate.mode === "en"} volume={volume} position={debate.mode === "fr" ? "left" : "center"} ui={ui} />
      {debate.mode === "fr" && <DebateTimer label="CONTRE" volume={volume} position="right" ui={ui} />}
    </>}
  </div>;
});
DebatePoster.displayName = "DebatePoster";
export default DebatePoster;
