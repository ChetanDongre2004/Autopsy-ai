import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, AlertTriangle, CheckCircle2, ChevronDown,
  Box, Network, RefreshCw, Shield, Package, TrendingUp,
  GitBranch, Activity
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const scoreColor = (s) => s >= 80 ? "#22c55e" : s >= 60 ? "#eab308" : "#ef4444";
const barColor   = (s) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-yellow-500" : "bg-red-500";
const scoreLabel = (s) => s >= 80 ? "Excellent" : s >= 60 ? "Fair" : "Poor";

const RISK_STYLE = {
  Critical: { pill: "bg-red-500/10 text-red-400 border-red-500/30",    dot: "bg-red-500" },
  High:     { pill: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500" },
  Medium:   { pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-500" },
  Low:      { pill: "bg-zinc-700/50 text-zinc-400 border-zinc-700",     dot: "bg-zinc-500" },
};

const RISK_ICON = {
  "Circular Dependency": <RefreshCw className="w-3.5 h-3.5" />,
  "God Module":          <Box       className="w-3.5 h-3.5" />,
  "Tight Coupling":      <Network   className="w-3.5 h-3.5" />,
  "Oversized Service":   <Package   className="w-3.5 h-3.5" />,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreBar({ label, score, reason }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left group"
    >
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs text-zinc-500 w-44 shrink-0 group-hover:text-zinc-300 transition-colors">
          {label}
        </span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor(score)}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-bold w-7 text-right tabular-nums"
          style={{ color: scoreColor(score) }}>
          {score}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-700 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      <AnimatePresence>
        {open && reason && (
          <motion.p
            key="reason"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[11px] text-zinc-600 leading-relaxed pl-[11.5rem] pb-1 overflow-hidden"
          >
            {reason}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

function RiskRow({ risk }) {
  const style = RISK_STYLE[risk.severity] || RISK_STYLE.Low;
  const icon  = RISK_ICON[risk.type] || <AlertTriangle className="w-3.5 h-3.5" />;
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
      <span className={`mt-0.5 ${RISK_STYLE[risk.severity]?.pill.split(" ")[1] || "text-zinc-400"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-200">{risk.type}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.pill}`}>
            {risk.severity}
          </span>
          {risk.file && (
            <code className="text-[10px] text-zinc-600 font-mono truncate">
              {risk.file.split("/").pop()}
            </code>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">{risk.detail}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArchitectureIntelligence({ data }) {
  // Support both new rich data AND old fallback data structure
  const ai  = data?.architecture_intelligence;
  const old = data?.architecture;

  // Overview values — prefer new data, fall back to old
  const style      = ai?.overview?.style      ?? old?.type        ?? "Not Available";
  const confidence = ai?.overview?.confidence ?? null;
  const archScore  = ai?.overview
    ? Math.round(Object.values(ai.score_breakdown || {}).reduce((s, v) => s + (v.score || 0), 0) /
        Math.max(1, Object.keys(ai.score_breakdown || {}).length))
    : (old?.score ?? null);

  const kpis = ai?.overview ? [
    { label: "Modules",     value: ai.overview.module_count    },
    { label: "Directories", value: ai.overview.directory_count },
    { label: "Services",    value: ai.overview.service_count   },
    { label: "APIs",        value: ai.overview.api_count       },
    { label: "Layers",      value: ai.overview.layer_count     },
    { label: "Test Files",  value: ai.overview.test_file_count },
  ] : [];

  const scoreBreakdown = ai?.score_breakdown ? [
    { key: "folder_organization", label: "Folder Organization" },
    { key: "dependency_coupling", label: "Dependency Coupling" },
    { key: "module_separation",   label: "Module Separation"   },
    { key: "layer_boundaries",    label: "Layer Boundaries"    },
    { key: "circular_health",     label: "Circular Dep. Health"},
  ] : [];

  const risks     = ai?.risks     ?? [];
  const strengths = ai?.strengths ?? old?.strengths ?? [];
  const weaknesses = old?.issues  ?? [];
  const explanation = old?.explanation ?? "";

  return (
    <div className="flex flex-col gap-5">

      {/* ─── Row 1: Pattern hero + Score ring + KPIs ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">

        {/* Left: Pattern + confidence ring */}
        <div className="flex gap-4 items-center bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          {/* SVG ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#27272a" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none"
                stroke={scoreColor(archScore ?? 0)}
                strokeWidth="6"
                strokeDasharray={`${((archScore ?? 0) / 100) * 163.4} 163.4`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-zinc-100">
              {archScore ?? "—"}
            </span>
          </div>

          {/* Labels */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">
              Architecture Pattern
            </div>
            <div className="text-lg font-black text-purple-300">{style}</div>
            {confidence != null && (
              <div className="text-[10px] text-zinc-600 mt-0.5">{confidence}% confidence</div>
            )}
            {archScore != null && (
              <div className="text-[10px] mt-1 font-semibold" style={{ color: scoreColor(archScore) }}>
                {scoreLabel(archScore)}
              </div>
            )}
          </div>
        </div>

        {/* Right: KPI chips — show only when new data available */}
        {kpis.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {kpis.map(({ label, value }) => (
              <div key={label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center py-3 gap-0.5 hover:border-zinc-700 transition-colors">
                <span className="text-lg font-black text-zinc-100 leading-none">{value ?? "—"}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</span>
              </div>
            ))}
          </div>
        ) : explanation ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center">
            <p className="text-xs text-zinc-400 leading-relaxed">{explanation}</p>
          </div>
        ) : null}
      </div>

      {/* ─── Row 2: Score Breakdown (new data only) ───────────────── */}
      {scoreBreakdown.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Score Breakdown
            </span>
            <span className="ml-auto text-[9px] text-zinc-700 italic">click row to see evidence</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {scoreBreakdown.map(({ key, label }) => {
              const entry = ai?.score_breakdown?.[key];
              if (!entry) return null;
              return <ScoreBar key={key} label={label} score={entry.score} reason={entry.reason} />;
            })}
          </div>
        </div>
      )}

      {/* ─── Row 3: Risks + Strengths side by side ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Risks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Architecture Risks
            </span>
            {risks.length > 0 && (
              <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full ml-1">
                {risks.length}
              </span>
            )}
          </div>

          {risks.length === 0 ? (
            <div className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-xs text-green-400">No architecture risks detected.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {risks.slice(0, 5).map((risk, i) => <RiskRow key={i} risk={risk} />)}
            </div>
          )}
        </div>

        {/* Strengths / Weaknesses */}
        <div>
          {strengths.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Strengths</span>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60 shrink-0 mt-0.5" />
                    {s}
                  </div>
                ))}
              </div>
            </>
          )}

          {weaknesses.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Weaknesses</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400/60 shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            </>
          )}

          {strengths.length === 0 && weaknesses.length === 0 && (
            <div className="text-xs text-zinc-600 italic">No qualitative findings available.</div>
          )}
        </div>

      </div>
    </div>
  );
}
