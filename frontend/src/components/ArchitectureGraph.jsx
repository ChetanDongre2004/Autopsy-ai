import { useState, useEffect, useRef } from "react";
import ReactFlow, { Background, Controls, Handle, Position, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { BASE_URL } from "../api.js";
import {
  Layers, Terminal, Send, RefreshCw, ShieldAlert, CheckCircle2,
  Activity, AlertTriangle, Network, Box, Package
} from "lucide-react";

// ─── Layer definitions ────────────────────────────────────────────────────────
const LAYER_DEFS = [
  { id: "frontend",  label: "Frontend",         color: "#3b82f6", pos: { x: 150, y: 0   } },
  { id: "api",       label: "API / Controllers", color: "#6366f1", pos: { x: 150, y: 200 } },
  { id: "services",  label: "Services",          color: "#a855f7", pos: { x: 150, y: 400 } },
  { id: "data",      label: "Data / Models",     color: "#ec4899", pos: { x: 0,   y: 600 } },
  { id: "infra",     label: "Infrastructure",    color: "#f59e0b", pos: { x: 350, y: 600 } },
  { id: "testing",   label: "Testing",           color: "#22c55e", pos: { x: 650, y: 400 } },
];

function classifyToLayer(path) {
  const p = path.toLowerCase();
  if (/\.(jsx|tsx|vue|html|css|scss)$/.test(p) || /frontend\/|\/client\/|components\/|pages\//.test(p)) return "frontend";
  if (/test[_.]|[_.]test\.|spec[_.]|[_.]spec\.|\/tests\/|\/test\/|\/spec\//.test(p)) return "testing";
  if (/route|controller|endpoint|api\.py|main\.(py|js|ts)$|app\.(py|js|ts)$|server\./.test(p)) return "api";
  if (/service|engine|handler|analyzer|processor/.test(p)) return "services";
  if (/model|schema|repo|database|\/db\/|store|entity/.test(p)) return "data";
  if (/\.(yml|yaml|toml|ini|cfg|env)$|config|docker|infra|requirements|setup\.py|\.sh$/.test(p)) return "infra";
  return "services";
}

// ─── Custom Layer Node ────────────────────────────────────────────────────────
const LayerNode = ({ data, selected }) => {
  const riskStyle = data.risks > 3 ? "border-red-500/60" : data.risks > 0 ? "border-yellow-500/50" : "border-zinc-700";
  return (
    <div className={`bg-zinc-900 border-2 rounded-2xl p-4 w-52 shadow-xl transition-all
      ${riskStyle} ${selected ? "ring-2 ring-indigo-500 scale-105" : ""}`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-indigo-500 !border-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
          <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">{data.label}</span>
        </div>
        {data.risks > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            {data.risks}⚠
          </span>
        )}
      </div>

      <div className="flex gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-black text-zinc-100">{data.fileCount}</div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Files</div>
        </div>
        {data.deps > 0 && (
          <div className="text-center">
            <div className="text-lg font-black text-blue-400">{data.deps}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Deps</div>
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        {data.topFiles.slice(0, 3).map((f, i) => (
          <div key={i} className="text-[10px] font-mono text-zinc-600 truncate">{f}</div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-indigo-500 !border-none" />
    </div>
  );
};

const nodeTypes = { layerNode: LayerNode };

// ─── Score bar ────────────────────────────────────────────────────────────────
function SBar({ label, score }) {
  const col = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const bg  = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-bold w-6 text-right" style={{ color: col }}>{score}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ArchitectureGraph({ repoData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [chatLog, setChatLog] = useState([
    { role: "assistant", text: "I am your Repository Architect Assistant. Click any layer node or ask me about this codebase's architecture, flows, and dependencies." }
  ]);
  const [query, setQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const ai    = repoData.architecture_intelligence;
  const risks = ai?.risks || [];
  const sb    = ai?.score_breakdown || {};

  useEffect(() => { buildGraph(); }, [repoData]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog]);

  function buildGraph() {
    const allFiles  = repoData.relationships?.graph?.nodes?.map(n => n.id) || [];
    const depMap    = repoData.relationships?.dependency_map || [];

    // Group files by layer
    const layerMap = {};
    LAYER_DEFS.forEach(l => { layerMap[l.id] = { files: [], outDeps: 0 }; });
    allFiles.forEach(f => {
      const l = classifyToLayer(f);
      if (layerMap[l]) layerMap[l].files.push(f);
    });

    // Count risks per layer
    const risksByLayer = {};
    risks.forEach(r => {
      const l = classifyToLayer(r.file || "");
      risksByLayer[l] = (risksByLayer[l] || 0) + 1;
    });

    // Inter-layer edges
    const seenEdges = new Set();
    const interEdges = [];
    depMap.forEach(edge => {
      const src = classifyToLayer(edge.from);
      const tgt = classifyToLayer(edge.to);
      if (src !== tgt) {
        const key = `${src}→${tgt}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          layerMap[src].outDeps++;
          interEdges.push({
            id: `e-${key}`,
            source: src, target: tgt,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 1.5, opacity: 0.55 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          });
        }
      }
    });

    const newNodes = LAYER_DEFS
      .filter(l => layerMap[l.id]?.files.length > 0)
      .map(l => ({
        id: l.id,
        type: "layerNode",
        position: l.pos,
        data: {
          label:     l.label,
          color:     l.color,
          fileCount: layerMap[l.id].files.length,
          topFiles:  layerMap[l.id].files.slice(0, 3).map(f => f.split("/").pop()),
          allFiles:  layerMap[l.id].files,
          deps:      layerMap[l.id].outDeps,
          risks:     risksByLayer[l.id] || 0,
        },
      }));

    setNodes(newNodes);
    setEdges(interEdges);
  }

  const onNodeClick = (_, node) => {
    setSelectedLayer(node.data);
    const riskList = risks.filter(r => classifyToLayer(r.file || "") === node.id);
    const riskText = riskList.length > 0
      ? `\n\n⚠ Risks (${riskList.length}):\n` + riskList.slice(0, 3).map(r => `• ${r.type}: ${r.file?.split("/").pop()}`).join("\n")
      : "\n\n✓ No risks detected in this layer.";

    setChatLog(prev => [...prev, {
      role: "assistant",
      text: `**${node.data.label}** — ${node.data.fileCount} files\n\nTop modules:\n${node.data.allFiles.slice(0, 5).map(f => `• ${f.split("/").pop()}`).join("\n")}${riskText}`
    }]);
  };

  const sendChat = async () => {
    if (!query.trim()) return;
    const text = query.trim();
    setQuery("");
    setChatLog(prev => [...prev, { role: "user", text }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoData.repository_overview?.name || "repo",
          query: text,
          selected_node: selectedLayer ? `${selectedLayer.label} layer (${selectedLayer.fileCount} files)` : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setChatLog(prev => [...prev, {
        role: "assistant",
        text: d.answer || "No response from repository.",
        sources: d.sources,
      }]);
    } catch {
      setChatLog(prev => [...prev, {
        role: "assistant",
        text: "Insufficient repository evidence available to answer this question.",
      }]);
    }
    setChatLoading(false);
  };

  const scoreEntries = [
    { key: "folder_organization", label: "Folder Organization" },
    { key: "dependency_coupling", label: "Dependency Coupling" },
    { key: "module_separation",   label: "Module Separation"   },
    { key: "layer_boundaries",    label: "Layer Boundaries"    },
    { key: "circular_health",     label: "Circular Dep. Health"},
  ];

  const archStyle = ai?.overview?.style || repoData.architecture?.type || "Unknown";
  const archScore = ai ? Math.round(
    Object.values(sb).reduce((s, v) => s + (v.score || 0), 0) / Math.max(1, Object.keys(sb).length)
  ) : repoData.architecture?.score;
  const scoreColor = archScore >= 80 ? "#22c55e" : archScore >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[700px] w-full">

      {/* ── Left: Architecture Metrics ──────────────────────────────── */}
      <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Style card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Pattern</div>
          <div className="text-base font-black text-purple-300 mb-2">{archStyle}</div>
          {archScore != null && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${archScore}%`, background: scoreColor }} />
              </div>
              <span className="text-xs font-black" style={{ color: scoreColor }}>{archScore}</span>
            </div>
          )}
        </div>

        {/* Score breakdown */}
        {Object.keys(sb).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Score Breakdown</div>
            <div className="flex flex-col gap-2">
              {scoreEntries.map(({ key, label }) =>
                sb[key] ? <SBar key={key} label={label} score={sb[key].score} /> : null
              )}
            </div>
          </div>
        )}

        {/* Top risks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Risks ({risks.length})
          </div>
          {risks.length === 0 ? (
            <div className="flex items-center gap-1.5 text-[11px] text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> None detected
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {risks.slice(0, 5).map((r, i) => (
                <div key={i} className="text-[10px] text-zinc-400 flex items-start gap-1.5">
                  <span className={`shrink-0 mt-0.5 ${r.severity === "Critical" ? "text-red-400" : r.severity === "High" ? "text-orange-400" : "text-yellow-400"}`}>●</span>
                  <div>
                    <div className="font-semibold text-zinc-300">{r.type}</div>
                    <div className="text-zinc-600 truncate font-mono">{r.file?.split("/").pop()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Center: Layer Graph ─────────────────────────────────────── */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2 shrink-0">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-zinc-400">Layer Architecture Graph</span>
          <span className="text-[9px] text-zinc-700 ml-auto">Click a layer to inspect</span>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="!bg-zinc-900 !border-zinc-800" />
          </ReactFlow>
        </div>
        {/* Legend */}
        <div className="px-4 py-2 border-t border-zinc-800 flex gap-4 shrink-0">
          {LAYER_DEFS.slice(0, 4).map(l => (
            <div key={l.id} className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 uppercase">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Copilot ──────────────────────────────────────────── */}
      <div className="w-full lg:w-72 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 shrink-0">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Repository Architect</span>
          {selectedLayer && (
            <span className="ml-auto text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate">
              {selectedLayer.label}
            </span>
          )}
        </div>

        {/* Chat log */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed
                ${msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-tl-none"}`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                {msg.sources?.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex flex-wrap gap-1">
                    {msg.sources.map((s, si) => (
                      <span key={si} className="text-[9px] font-mono text-indigo-400 bg-zinc-900 px-1 rounded">
                        {s.split(/[/\\]/).pop()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-2 text-xs text-zinc-500">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" /> Analyzing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder={selectedLayer ? `Ask about ${selectedLayer.label}…` : "Ask about this architecture…"}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !query.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
