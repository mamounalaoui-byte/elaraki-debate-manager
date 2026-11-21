import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Debate, Language, DEFAULT_SCHOOL_YEAR, isSchoolYear } from "@/lib/debate";
import { reference } from "./DebatePoster";

export default function DebateForm({ mode, ui, initial, onBack, onGenerate }: { mode: Language; ui: Language; initial?: Debate; onBack: () => void; onGenerate: (data: Pick<Debate, "topic" | "teamA" | "teamB" | "schoolYear">) => void }) {
  const fr = ui === "fr";
  const [topic, setTopic] = useState(initial?.topic || "");
  const [teamA, setTeamA] = useState(initial?.teamA || "");
  const [teamB, setTeamB] = useState(initial?.teamB || "");
  const [startYear, setStartYear] = useState((initial?.schoolYear || DEFAULT_SCHOOL_YEAR).slice(0, 4));
  const schoolYear = `${startYear}-${Number(startYear) + 1}`;
  return <div className="mx-auto max-w-6xl py-8 md:py-12 animate-enter">
    <Button variant="ghost" className="mb-7 rounded-full text-slate-600" onClick={onBack}><ArrowLeft size={16} />{fr ? "Retour" : "Back"}</Button>
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
      <div><span className="eyebrow">{fr ? "PRÉPARER UN DÉBAT" : "PREPARE A DEBATE"} · {mode.toUpperCase()}</span>
        <h1 className="display-heading mt-4 text-4xl md:text-5xl">{fr ? "Les idées prennent" : "Great debates start"}<br />{fr ? "la parole." : "with a question."}</h1>
        <p className="mt-4 max-w-md text-slate-500">{fr ? "Choisissez votre sujet et vos équipes. Nous préparons la scène." : "Choose your topic and your teams. We’ll set the stage."}</p>
        <form className="mt-8 space-y-6" onSubmit={e => { e.preventDefault(); if (isSchoolYear(schoolYear)) onGenerate({ topic, teamA, teamB, schoolYear }); }}>
          <div><label htmlFor="school-year" className="field-label">{fr ? "Année scolaire — année de début" : "School year — starting year"}</label><div className="mt-2 flex items-center gap-3"><Input id="school-year" type="number" min="2000" max="9998" step="1" required value={startYear} onChange={e => setStartYear(e.target.value)} className="h-12 w-32 rounded-xl border-slate-200 bg-white px-4" /><span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">{isSchoolYear(schoolYear) ? schoolYear : "—"}</span></div><p className="mt-2 text-xs text-slate-500">{fr ? "L’année suivante est calculée automatiquement et apparaît sur l’affiche et le PDF." : "The following year is calculated automatically and appears on the poster and PDF."}</p></div>
          <div><label htmlFor="topic" className="field-label">{fr ? "Sujet du débat" : "Debate topic"}</label><Textarea id="topic" required value={topic} onChange={e => setTopic(e.target.value)} placeholder={fr ? "Quelle question souhaitez-vous débattre ?" : "What question will spark the conversation?"} className="mt-2 min-h-32 rounded-xl border-slate-200 bg-white p-4 text-base focus-visible:ring-blue-500" /><p className="mt-2 text-xs text-slate-500">{fr ? "Votre texte sera conservé exactement, sans reformulation." : "Your words stay exactly as entered. No rewriting."}</p>{topic.length > 600 && <p className="mt-2 text-xs text-amber-800">{fr ? "Un sujet très long nécessitera une police plus petite sur le projecteur." : "Very long topics need smaller type on the projector."}</p>}</div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="team-a" className="field-label">{mode === "fr" ? "Équipe POUR" : "Government"}</label><Input id="team-a" required value={teamA} onChange={e => setTeamA(e.target.value)} placeholder={fr ? "Classe ou groupe" : "Class or group"} className="mt-2 h-12 rounded-xl border-slate-200 bg-white px-4" /></div><div><label htmlFor="team-b" className="field-label">{mode === "fr" ? "Équipe CONTRE" : "Opposition"}</label><Input id="team-b" required value={teamB} onChange={e => setTeamB(e.target.value)} placeholder={fr ? "Classe ou groupe" : "Class or group"} className="mt-2 h-12 rounded-xl border-slate-200 bg-white px-4" /></div></div>
          <div className="flex flex-wrap gap-3 pt-2"><Button type="submit" disabled={!topic.trim() || !teamA.trim() || !teamB.trim() || !isSchoolYear(schoolYear)} className="h-12 rounded-xl bg-primary px-6 shadow-lg shadow-blue-900/10"><Sparkles size={17} />{fr ? "Générer le débat" : "Generate Debate"}<ArrowRight size={17} /></Button><Button type="button" variant="ghost" className="h-12 rounded-xl text-slate-500" onClick={() => { setTopic(""); setTeamA(""); setTeamB(""); setStartYear(DEFAULT_SCHOOL_YEAR.slice(0, 4)); }}><RotateCcw size={16} />{fr ? "Effacer" : "Clear form"}</Button></div>
        </form>
      </div>
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><span className="eyebrow">{fr ? "VOTRE MODÈLE D’AFFICHE" : "YOUR POSTER TEMPLATE"}</span><span className="language-tag">{mode.toUpperCase()}</span></div><img src={reference(mode)} alt={fr ? "Affiche de référence" : "Reference poster"} className="w-full rounded-xl" /><h3 className="mt-6 font-semibold">{mode === "fr" ? "Les Grands Débats d’Elaraki" : "The Eagles Great Debates"}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{fr ? "L’identité de votre école, votre sujet et vos équipes. Une affiche prête à être projetée." : "Your school’s identity, your topic, your teams. A poster made for the big screen."}</p><div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />{fr ? "Enregistrement local · Aucun compte requis" : "Saved locally · No account needed"}</div></aside>
    </div>
  </div>;
}
