import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, Download, Globe2, Home, Maximize, Minimize, Pencil, Plus, ShieldCheck, Volume2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Welcome from "@/components/Welcome";
import DebateForm from "@/components/DebateForm";
import DebatePoster from "@/components/DebatePoster";
import { Debate, Language, loadDebates, storeDebates } from "@/lib/debate";
import { ringBell } from "@/lib/bell";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function Index() {
  const [ui, setUi] = useState<Language>(() => { try { return localStorage.getItem("elaraki-language") === "fr" ? "fr" : "en"; } catch { return "en"; } });
  const [history, setHistory] = useState(loadDebates);
  const [page, setPage] = useState<"home" | "form" | "poster">("home");
  const [mode, setMode] = useState<Language>("fr");
  const [debate, setDebate] = useState<Debate | undefined>();
  const [editing, setEditing] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [exportTimers, setExportTimers] = useState(true);
  const [exportQuality, setExportQuality] = useState<"4k" | "8k">("4k");
  const [exporting, setExporting] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const poster = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fr = ui === "fr";
  useEffect(() => {
    const connection = () => setOnline(navigator.onLine);
    const full = () => { if (!document.fullscreenElement) setPresentation(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setPresentation(false); };
    const installable = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    window.addEventListener("online", connection); window.addEventListener("offline", connection);
    window.addEventListener("beforeinstallprompt", installable);
    window.addEventListener("keydown", key); document.addEventListener("fullscreenchange", full);
    return () => { window.removeEventListener("online", connection); window.removeEventListener("offline", connection); window.removeEventListener("beforeinstallprompt", installable); window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", full); };
  }, []);
  const save = (items: Debate[]) => {
    setHistory(items);
    try { storeDebates(items); return true; } catch { toast.error(fr ? "Stockage local indisponible ou plein. Le débat reste ouvert, mais n’est pas enregistré." : "Local storage is unavailable or full. Your debate is open, but has not been saved."); return false; }
  };
  const choose = (choice: Language) => { setMode(choice); setEditing(false); setPage("form"); window.scrollTo(0, 0); };
  const goHome = () => { setPage("home"); window.scrollTo(0, 0); };
  const fullscreen = async () => {
    if (presentation) { if (document.fullscreenElement) await document.exitFullscreen(); setPresentation(false); return; }
    setPresentation(true);
    try { await stage.current?.requestFullscreen(); } catch { toast.info(fr ? "Mode présentation activé. Le plein écran natif est bloqué dans cet aperçu." : "Presentation mode enabled. Native fullscreen is blocked in this preview."); }
  };
  const exportPdf = async () => {
    if (!poster.current || poster.current.dataset.ready !== "true") { toast.info(fr ? "Veuillez attendre le chargement de l’affiche." : "Please wait for the poster to load."); return; }
    setExporting(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const canvasWidth = exportQuality === "8k" ? 7680 : 3840;
      const canvasHeight = exportQuality === "8k" ? 4320 : 2160;
      const image = await toPng(poster.current, { canvasWidth, canvasHeight, pixelRatio: 1, cacheBust: false, skipFonts: true, filter: node => exportTimers || !(node instanceof HTMLElement && node.classList.contains("poster-timer")) });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167.0625] });
      pdf.addImage(image, "PNG", 0, 0, 297, 167.0625, undefined, "FAST");
      pdf.save(`ELARAKI-${debate!.mode}-${debate!.schoolYear}-${debate!.createdAt.slice(0, 10)}-${exportQuality.toUpperCase()}.pdf`);
      toast.success(fr ? `Affiche PDF ${exportQuality.toUpperCase()} téléchargée.` : `${exportQuality.toUpperCase()} poster PDF downloaded.`);
    } catch { toast.error(fr ? "L’export a échoué. Veuillez réessayer. Si vous avez choisi 8K, essayez 4K pour réduire la mémoire utilisée." : "PDF export failed. Please retry. If you selected 8K, try 4K to use less memory."); }
    finally { setExporting(false); }
  };
  return <div className="min-h-screen">
    <header className="border-b border-slate-200/80 bg-white/90"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 md:px-10"><button onClick={goHome} className="flex items-center gap-3 text-left" aria-label={fr ? "Accueil" : "Home"}><img src="/assets/school-logo.jpg" alt="Logo ELARAKI" className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain" /><span><span className="block text-[15px] font-extrabold tracking-[0.08em] text-[#20364b]">ELARAKI <span className="hidden font-medium text-primary sm:inline">DEBATE MANAGER</span></span><span className="mt-0.5 block text-[10px] tracking-[0.045em] text-slate-500 sm:text-xs">International School of Morocco</span></span></button><div className="flex items-center gap-2 md:gap-5">{install && <Button variant="ghost" className="hidden rounded-full text-xs sm:flex" onClick={async () => { await install.prompt(); const choice = await install.userChoice; if (choice.outcome === "accepted") setInstall(null); }}><Download size={14} />{fr ? "Installer" : "Install app"}</Button>}<a href="#history" onClick={() => setPage("home")} className="hidden text-xs font-medium text-slate-500 hover:text-primary md:block">{fr ? "Mes débats" : "My debates"}</a><div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1"><Globe2 size={14} className="mx-1.5 text-slate-400" />{(["fr", "en"] as const).map(lang => <button key={lang} aria-pressed={ui === lang} onClick={() => { setUi(lang); try { localStorage.setItem("elaraki-language", lang); } catch { /* The interface can still change when storage is blocked. */ } }} className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${ui === lang ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>{lang.toUpperCase()}</button>)}</div></div></div></header>
    <main className="mx-auto max-w-7xl px-5 md:px-10">
      {page === "home" && <Welcome ui={ui} history={history} choose={choose} reopen={d => { setDebate(d); setMode(d.mode); setPage("poster"); window.scrollTo(0, 0); }} remove={id => { if (window.confirm(fr ? "Supprimer ce débat de l’historique ?" : "Delete this debate from history?")) save(history.filter(d => d.id !== id)); }} />}
      {page === "form" && <DebateForm key={`${mode}-${editing}`} mode={mode} ui={ui} initial={editing ? debate : undefined} onBack={() => editing ? setPage("poster") : goHome()} onGenerate={data => { const d: Debate = { ...data, mode, id: editing && debate ? debate.id : crypto.randomUUID(), createdAt: editing && debate ? debate.createdAt : new Date().toISOString() }; setDebate(d); const saved = save([d, ...history.filter(old => old.id !== d.id)]); setPage("poster"); window.scrollTo(0, 0); if (saved) toast.success(fr ? "Débat prêt et enregistré sur cet appareil." : "Debate ready and saved on this device."); }} />}
      {page === "poster" && debate && <div className="py-7 animate-enter"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Button size="icon" variant="outline" className="rounded-full bg-white" aria-label={fr ? "Retour" : "Back"} onClick={() => { setEditing(true); setPage("form"); }}><ArrowLeft size={17} /></Button><div><h1 className="font-semibold">{debate.mode === "fr" ? "Les Grands Débats d’El Araki" : "The Eagles Great Debates"}</h1><p className="mt-1 text-xs text-slate-500">{fr ? "Votre scène est prête. Place au débat." : "Your stage is set. Let the debate begin."}</p></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl bg-white text-slate-600" onClick={() => { setEditing(true); setPage("form"); }}><Pencil size={15} />{fr ? "Modifier" : "Edit"}</Button><Button variant="outline" className="rounded-xl bg-white text-slate-600" onClick={exportPdf} disabled={exporting}><Download size={16} />{exporting ? (fr ? "Export…" : "Exporting…") : "PDF"}</Button><Button className="rounded-xl bg-primary" onClick={fullscreen}><Maximize size={16} />{fr ? "Présenter" : "Present"}</Button></div></div>
        <div ref={stage} className={`presentation-stage ${presentation ? "presenting" : ""}`}><DebatePoster key={debate.id} ref={poster} debate={debate} ui={ui} volume={volume} />{presentation && <button className="exit-presentation" onClick={fullscreen}><Minimize size={15} />{fr ? "Quitter le plein écran" : "Exit presentation"}</button>}</div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-4">{debate.mode === "en" ? <div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-2 text-sm font-medium"><Bell size={17} className="text-amber-700" />{fr ? "Cloche automatique" : "Automatic bell"}<span className="text-xs font-normal text-slate-500">01:00 · 03:00 · 04:00</span></div><label className="flex items-center gap-2"><Volume2 size={16} className="text-slate-500" /><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label={fr ? "Volume de la cloche" : "Bell volume"} className="w-24 accent-blue-600" /><span className="w-8 text-xs text-slate-500">{Math.round(volume * 100)}%</span></label><Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => { void ringBell(volume).catch(() => toast.error(fr ? "Son bloqué par le navigateur." : "Audio blocked by browser.")); }}>{fr ? "Tester la cloche" : "Test bell"}</Button></div> : <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={17} className="text-primary" />{fr ? "Deux chronomètres indépendants. Aucun signal sonore." : "Two independent timers. No audio notifications."}</p>}<div className="flex flex-wrap items-center gap-4"><label htmlFor="export-quality" className="flex items-center gap-2 text-xs font-medium text-slate-600">{fr ? "Qualité PDF" : "PDF quality"}<select id="export-quality" value={exportQuality} disabled={exporting} onChange={e => setExportQuality(e.target.value === "8k" ? "8k" : "4k")} className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"><option value="4k">4K · 3840 × 2160</option><option value="8k">8K · 7680 × 4320</option></select></label><label className="flex items-center gap-2 text-xs text-slate-500"><Switch checked={exportTimers} onCheckedChange={setExportTimers} disabled={exporting} className="data-[state=checked]:bg-primary" />{fr ? "Chronomètres dans le PDF" : "Include timers in PDF"}</label></div></div><p className="mt-3 text-center text-xs leading-relaxed text-slate-500">{fr ? "Textes et chronomètres exportés en haute résolution. Les fonds conservent les détails des images originales. L’export 8K est plus volumineux." : "Text and timers are exported at high resolution. Background detail is limited by the original images. 8K exports create larger files."}</p>
        <div className="mt-6 flex justify-center gap-3"><Button variant="ghost" className="rounded-full text-slate-500" onClick={goHome}><Home size={15} />{fr ? "Accueil" : "Home"}</Button><Button variant="ghost" className="rounded-full text-primary" onClick={() => choose(debate.mode)}><Plus size={16} />{fr ? "Nouveau débat" : "New debate"}</Button></div>
      </div>}
    </main>
    <footer className="border-t border-slate-200/80"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-[11px] text-slate-500 sm:flex-row md:px-10"><span>ELARAKI DEBATE MANAGER <span className="mx-2 text-slate-300">/</span> {fr ? "Les idées nous font grandir." : "Growing through ideas."}</span><span className="flex flex-wrap items-center justify-center gap-3"><span>developped by MAMOUN ALAOUI</span>{!online && <span className="flex items-center gap-1.5"><WifiOff size={13} className="text-primary" />{fr ? "Hors connexion" : "Offline"}</span>}</span></div></footer>
  </div>;
}
