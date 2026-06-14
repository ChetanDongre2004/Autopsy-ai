import { useState } from "react";
import {
  ChevronDown, ChevronUp, ExternalLink, ShieldAlert, BookOpen,
  Clock, Activity, Zap, FileText, Video, Github, Lightbulb,
  Code2, MapPin, AlertTriangle, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getTypeIcon = (type) => {
  switch (type) {
    case "Video": return <Video className="w-4 h-4 text-pink-400" />;
    case "Documentation": return <FileText className="w-4 h-4 text-blue-400" />;
    case "Community": return <Github className="w-4 h-4 text-zinc-400" />;
    case "Article": return <BookOpen className="w-4 h-4 text-green-400" />;
    default: return <ExternalLink className="w-4 h-4 text-indigo-400" />;
  }
};

const priorityConfig = {
  Critical: { bar: "bg-red-500",   badge: "bg-red-600/20 text-red-300 border-red-500/30",   icon: <AlertTriangle className="w-4 h-4" /> },
  High:     { bar: "bg-orange-500", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: <ShieldAlert className="w-4 h-4" /> },
  Medium:   { bar: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <Shield className="w-4 h-4" /> },
  Low:      { bar: "bg-zinc-500",   badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",   icon: <Shield className="w-4 h-4" /> },
};

/** Extract the plain code snippet from the evidence string */
function extractSnippet(evidence) {
  if (!evidence) return null;
  const parts = evidence.split(" | ");
  const snippetPart = parts.find(p => p.startsWith("Snippet:"));
  if (!snippetPart) return null;
  return snippetPart.replace(/^Snippet:\s*/, "").trim();
}

/** Extract all non-snippet evidence chips */
function extractChips(evidence) {
  if (!evidence) return [];
  return evidence.split(" | ").filter(p => !p.startsWith("Snippet:"));
}

export default function RecommendationCard({ rec, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prio = priorityConfig[rec.priority] || priorityConfig.Low;
  const codeSnippet = extractSnippet(rec.evidence);
  const chips = extractChips(rec.evidence);

  return (
    <motion.div
      layout
      className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden font-sans"
    >
      {/* Priority colour bar at top */}
      <div className={`h-0.5 w-full ${prio.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div
        className="p-6 md:p-8 lg:p-10 cursor-pointer flex flex-col gap-5 relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* ── TITLE ROW ── */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl md:text-2xl font-bold font-heading text-zinc-100 flex items-center gap-3 min-w-0">
            <span className="bg-indigo-500/10 text-indigo-400 w-9 h-9 rounded-xl flex shrink-0 items-center justify-center text-sm font-black border border-indigo-500/20">
              {index + 1}
            </span>
            <span className="leading-tight break-words">{rec.title}</span>
          </h3>
          <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${prio.badge}`}>
            {prio.icon}{rec.priority}
          </span>
        </div>

        {/* ── DETECTED CODE BLOCK (repo-specific proof) ── */}
        {codeSnippet && (
          <div className="rounded-xl bg-zinc-950 border border-zinc-700/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/60 border-b border-zinc-700/60">
              <Code2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Detected in Repository</span>
              {chips.find(c => c.startsWith("File:")) && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  {chips.find(c => c.startsWith("File:"))?.replace("File: `","").replace("`","")}
                </span>
              )}
            </div>
            <pre className="px-4 py-3 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {codeSnippet}
            </pre>
          </div>
        )}

        {/* ── WHY + FIX PANELS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-zinc-950/40 p-5 border border-zinc-800/80 rounded-xl group-hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-red-400/90 font-bold uppercase tracking-widest text-xs">
              <ShieldAlert className="w-4 h-4" /> Why This Matters
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base font-medium">
              {rec.why_this_matters || rec.benefit}
            </p>
          </div>

          <div className="bg-indigo-950/20 p-5 border border-indigo-500/10 rounded-xl group-hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-indigo-400/90 font-bold uppercase tracking-widest text-xs">
              <Lightbulb className="w-4 h-4" /> Recommended Fix
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base font-medium">{rec.fix}</p>
          </div>
        </div>

        {/* ── META ROW ── */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-semibold">
            <Zap className="w-4 h-4 text-amber-400" /> Effort: <span className="text-zinc-100 font-bold">{rec.effort}</span>
          </div>
          <div className="w-px h-5 bg-zinc-700 hidden md:block" />
          <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-semibold">
            <Activity className="w-4 h-4 text-green-400" /> Category: <span className="text-zinc-100 font-bold">{rec.impact}</span>
          </div>
          <div className="w-px h-5 bg-zinc-700 hidden md:block" />
          <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-semibold">
            <Clock className="w-4 h-4 text-blue-400" /> ETA: <span className="text-zinc-100 font-bold">{rec.eta}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-zinc-700">
              {rec.owner}
            </span>
            <button
              className="bg-zinc-800 hover:bg-zinc-700 p-2.5 rounded-xl text-zinc-300 transition-colors shrink-0 outline-none"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── EVIDENCE CHIPS ── */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chunk, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                {chunk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── EXPANDABLE: LEARNING RESOURCES ── */}
      <AnimatePresence>
        {isExpanded && rec.learn_more && rec.learn_more.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-950/80 border-t border-zinc-800/80"
          >
            <div className="p-6 md:p-8">
              <h4 className="text-base md:text-lg font-heading font-bold text-zinc-200 mb-4 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Learn More Resources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rec.learn_more.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col justify-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition group/link relative"
                  >
                    <ExternalLink className="absolute top-4 right-4 w-4 h-4 text-zinc-600 group-hover/link:text-indigo-400 transition" />
                    <div className="flex flex-col items-start gap-2">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="pr-5">
                        <div className="text-sm font-bold text-zinc-200 group-hover/link:text-indigo-300 transition-colors leading-snug">
                          {resource.title}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 font-medium">
                          {resource.type || "Resource"}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
