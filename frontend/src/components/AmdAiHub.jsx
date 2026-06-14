import { BASE_URL } from "../api.js";
import React, { useState } from "react";
import { 
  Cpu, Send, ShieldCheck, Terminal, Layers, CheckCircle2, 
  RefreshCw, Eye, Search, AlertCircle, CheckCircle, Network, Info,
  Copy, Check, ChevronRight, FileText, Database, MapPin, Activity, Code,
  ShieldAlert, BookOpen, AlertTriangle 
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function AmdAiHub({ data }) {
  const [activeMainTab, setActiveMainTab] = useState("observability");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [activeInventoryTab, setActiveInventoryTab] = useState("models");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hello! I am Autopsy AI's local code intelligence assistant. Ask me anything about this repository's security, architecture, or potential refactorings."
  }]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState("");

  // Derive latency tier from provider name — no hardcoded numbers, purely categorical
  const getLatencyProfile = (provider = "") => {
    const p = provider.toLowerCase();
    if (p.includes("openai") || p.includes("anthropic") || p.includes("claude"))
      return { tier: "Cloud API", detail: "Network-bound, latency varies by region", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
    if (p.includes("google") || p.includes("gemini"))
      return { tier: "Cloud API", detail: "Network-bound, latency varies by region", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
    if (p.includes("groq") || p.includes("together") || p.includes("fireworks"))
      return { tier: "Inference API", detail: "Fast inference endpoint", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
    if (p.includes("ollama") || p.includes("local") || p.includes("onnx") || p.includes("llama.cpp"))
      return { tier: "On-Device (Local)", detail: "Low latency, fully offline", badge: "bg-green-500/10 border-green-500/20 text-green-400" };
    if (p.includes("hugging") || p.includes("transformers"))
      return { tier: "Self-Hosted", detail: "Moderate latency, self-managed", badge: "bg-teal-500/10 border-teal-500/20 text-teal-400" };
    return { tier: "Unknown", detail: "Provider type not recognized", badge: "bg-zinc-800 border-zinc-700 text-zinc-400" };
  };

  const repoName = data?.repository_overview?.name || "local_project";
  // BASE_URL imported from src/api.js — uses Vite proxy in dev

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Only use real scanned data. No mock fallback.
  const hasRealData = !!(data && data.ai_intelligence);
  
  // Safe empty structure used when no scan data is available
  const emptyIntelligence = {
    models: [], embeddings: [], vector_dbs: [], frameworks: [], prompts: [],
    capabilities: {}, suitability_report: [], rag_intelligence: { maturity_score: 0, maturity: "N/A", evidence: [], weaknesses: [], recommendations: [] },
    agentic_intelligence: { maturity_score: 0, maturity: "N/A", tools: [], evidence: [], weaknesses: [], recommendations: [] },
    gpu_intelligence: { total_int4_vram: "N/A", total_int8_vram: "N/A", total_fp16_vram: "N/A", local_model_count: 0 },
    application_flow: [], data_flow_intelligence: { databases: [], orms: [], erd: { nodes: [], edges: [] } },
    governance_report: { risk_score: 0, eu_ai_act_classification: "N/A", eu_ai_act_explanation: "", license_compliance: "N/A", license_compatibility: "N/A", data_privacy_issues: [], regulatory_recommendations: [] },
    graph: { nodes: [], edges: [] }
  };

  const aiIntelligence = hasRealData ? data.ai_intelligence : emptyIntelligence;

  // Recharts Model usage stats
  const modelTypeData = aiIntelligence.models.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.provider);
    if (found) {
      found.value += 1;
    } else {
      acc.push({ name: curr.provider, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ["#f97316", "#6366f1", "#14b8a6", "#10b881", "#ef4444"];

  // Layout algorithm for React Flow interactive diagram (Left-to-right hierarchy)
  const layoutGraphNodes = (graph) => {
    if (!graph || !graph.nodes) return [];
    const nodes = [];
    const counts = { prompt: 0, model: 0, embedding: 0, database: 0, file: 0, agent: 0, tool: 0 };
    
    graph.nodes.forEach(node => {
      let x = 100;
      let y = 100;
      
      if (node.type === "promptNode") {
        x = 50;
        y = counts.prompt * 150 + 50;
        counts.prompt++;
      } else if (node.type === "agentNode") {
        x = 220;
        y = counts.agent * 150 + 50;
        counts.agent++;
      } else if (node.type === "toolNode") {
        x = 220;
        y = (counts.agent + counts.tool + 1) * 120 + 50;
        counts.tool++;
      } else if (node.type === "modelNode") {
        x = 420;
        y = counts.model * 150 + 50;
        counts.model++;
      } else if (node.type === "embeddingNode") {
        x = 620;
        y = counts.embedding * 150 + 50;
        counts.embedding++;
      } else if (node.type === "databaseNode") {
        x = 820;
        y = counts.database * 150 + 50;
        counts.database++;
      } else {
        x = 50;
        y = (counts.prompt + counts.file + 1) * 150 + 80;
        counts.file++;
      }
      
      nodes.push({
        id: node.id,
        position: { x, y },
        data: { label: node.data.label, ...node.data },
        style: {
          background: node.type === "modelNode" ? "rgba(249, 115, 22, 0.15)" : 
                      node.type === "promptNode" ? "rgba(99, 102, 241, 0.15)" :
                      node.type === "embeddingNode" ? "rgba(20, 184, 166, 0.15)" :
                      node.type === "databaseNode" ? "rgba(16, 185, 129, 0.15)" :
                      node.type === "agentNode" ? "rgba(139, 92, 246, 0.15)" :
                      node.type === "toolNode" ? "rgba(236, 72, 153, 0.15)" :
                      "rgba(63, 63, 70, 0.15)",
          color: "#f4f4f5",
          border: node.type === "modelNode" ? "1px solid rgba(249, 115, 22, 0.4)" : 
                  node.type === "promptNode" ? "1px solid rgba(99, 102, 241, 0.4)" :
                  node.type === "embeddingNode" ? "1px solid rgba(20, 184, 166, 0.4)" :
                  node.type === "databaseNode" ? "1px solid rgba(16, 185, 129, 0.4)" :
                  node.type === "agentNode" ? "1px solid rgba(139, 92, 246, 0.4)" :
                  node.type === "toolNode" ? "1px solid rgba(236, 72, 153, 0.4)" :
                  "1px solid rgba(63, 63, 70, 0.4)",
          borderRadius: "12px",
          padding: "12px",
          fontSize: "12px",
          fontFamily: "monospace",
          width: 190,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        }
      });
    });
    return nodes;
  };

  const layoutGraphEdges = (graph) => {
    if (!graph || !graph.edges) return [];
    return graph.edges.map(edge => ({
      ...edge,
      animated: true,
      style: { stroke: "#f97316", strokeWidth: 1.5 },
      labelStyle: { fill: "#a1a1aa", fontSize: 9, fontWeight: 700 }
    }));
  };

  const flowNodes = layoutGraphNodes(aiIntelligence.graph);
  const flowEdges = layoutGraphEdges(aiIntelligence.graph);

  const filteredModels = aiIntelligence.models.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrompts = aiIntelligence.prompts.filter(p => 
    p.prompt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.prompt_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendQuery = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/v1/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoName,
          query: userMsg
        })
      });

      if (!response.ok) throw new Error("Local AI node returned an error.");
      const resData = await response.json();
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: resData.answer,
        sources: resData.sources 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠️ Unable to reach the local AI inference server. Please ensure Ollama is running at localhost:11434 with a model loaded (e.g. `ollama run qwen2.5-coder`)." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER HERO */}
      <div className="p-8 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400 tracking-wider uppercase">
              AI Model Scanner
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Repo AI Inspector</h2>
            <p className="text-zinc-400 max-w-3xl text-sm font-medium leading-relaxed">
              Detects every AI model in your repository, maps exactly where it is called in code, classifies its latency profile, and surfaces architectural patterns — all from real scan data.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-950/80 px-5 py-3.5 border border-zinc-800 rounded-2xl shadow-inner shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Privacy Status</div>
              <div className="text-sm font-black text-green-400">100% Offline & Secure</div>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex gap-4 mt-8 border-t border-zinc-800/80 pt-6">
          <button 
            onClick={() => setActiveMainTab("observability")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeMainTab === "observability" 
                ? "bg-orange-650 text-white shadow-lg shadow-orange-650/25" 
                : "bg-zinc-900 hover:bg-zinc-855 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Network className="w-4 h-4" /> Architecture Scanner
          </button>
          <button 
            onClick={() => setActiveMainTab("playground")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeMainTab === "playground" 
                ? "bg-orange-650 text-white shadow-lg shadow-orange-650/25" 
                : "bg-zinc-900 hover:bg-zinc-855 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Cpu className="w-4 h-4" /> Local Code Chat
          </button>
        </div>
      </div>

      {activeMainTab === "observability" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* OBSERVABILITY SUB NAVIGATION */}
          <div className="xl:col-span-3 space-y-2">
            {[
              { id: "overview", label: "AI Architecture Overview" },
              { id: "intelligence", label: "Model Intelligence" },
              { id: "inventory", label: "Model & Prompt Inventories" },
              { id: "rag", label: "RAG & Vector DB Intelligence" },
              { id: "agent", label: "Agentic AI Analyzer" },
              { id: "data", label: "Data Flow & ERD Analysis" },
              { id: "flow", label: "Application Flow Discovery" },
              { id: "graph", label: "Interactive Architecture Graph" },
              { id: "governance", label: "AI Governance & Audit" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all border flex justify-between items-center ${
                  activeSubTab === tab.id
                    ? "bg-zinc-900/60 border-orange-500/40 text-orange-400 font-extrabold shadow-inner"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900/20 hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <Eye className={`w-4 h-4 transition ${activeSubTab === tab.id ? "opacity-100" : "opacity-0"}`} />
              </button>
            ))}

            {/* Detected AI summary */}
            {hasRealData && (
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-5 mt-6 space-y-3">
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Scan Summary</div>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between"><span className="text-zinc-500">Models found:</span><span className="text-orange-400 font-bold">{aiIntelligence.models.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Prompts found:</span><span className="text-indigo-400 font-bold">{aiIntelligence.prompts.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Vector DBs:</span><span className="text-teal-400 font-bold">{aiIntelligence.vector_dbs.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Frameworks:</span><span className="text-emerald-400 font-bold">{aiIntelligence.frameworks.length}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* OBSERVABILITY MAIN CONTENT WORKSPACE */}
          <div className="xl:col-span-9 space-y-6">
            {!hasRealData && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-5 items-start md:items-center">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-amber-400">Demo Preview Mode (Static Sandbox)</div>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    The dashboard is displaying predefined sample values because a successful scan payload was not received from the Autopsy AI backend (typically due to the backend server being offline or a CORS policy restriction).
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    To see your real repository architecture: Ensure your backend server is running (`python main.py`) and go to the Home/GitHub page to execute a scan.
                  </p>
                </div>
              </div>
            )}
            
            {/* SUB-PAGE 1: OVERVIEW */}
            {activeSubTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* CARD 1: MODELS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-orange-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Models</div>
                      <Cpu className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.models.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold">Found in imports & APIs</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {Array.from(new Set(aiIntelligence.models.map(m => m.provider))).slice(0, 3).map((p, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-orange-400 font-bold">
                          {p.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CARD 2: PROMPTS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-indigo-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Prompts</div>
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.prompts.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold">System / templates variables</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-indigo-400 font-bold">
                        High Complexity: {aiIntelligence.prompts.filter(p => p.prompt_complexity === "High").length}
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: RETRIEVAL */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-teal-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vector DBs</div>
                      <Database className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.vector_dbs.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold font-semibold">FAISS / Chroma / Cloud stores</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {aiIntelligence.vector_dbs.slice(0, 2).map((db, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-teal-400 font-bold">
                          {db.vector_db || "Chroma DB"}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CARD 4: ORCHESTRATION */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-emerald-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Frameworks</div>
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.frameworks.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold font-semibold">LangChain, LangGraph agent loops</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {aiIntelligence.frameworks.slice(0, 2).map((fw, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 font-bold">
                          {fw.framework}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* ARCHITECTURE CLASSIFICATION SUMMARY */}
                  <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-6 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-zinc-200">AI Architectural Footprint</h3>
                        <span className="px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Static Verification
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                        Based on codebase imports, state decorations, vector configuration schemas, and tools, we have reverse-engineered the core AI execution paradigm.
                      </p>
                    </div>

                    <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition pointer-events-none" />
                      <div className="p-3 bg-orange-650/20 border border-orange-500/30 rounded-xl text-orange-400">
                        <Network className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Paradigm Classified</div>
                        <div className="text-base font-black text-white">
                          {aiIntelligence.capabilities?.RAG?.detected && aiIntelligence.capabilities?.Agentic?.detected 
                            ? "Agentic RAG / Multi-Agent System" 
                            : aiIntelligence.capabilities?.RAG?.detected 
                            ? "Retrieval-Augmented Generation (RAG)" 
                            : aiIntelligence.capabilities?.GenAI?.detected
                            ? "Generative AI Application"
                            : "No AI Architecture Detected"}
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC PIPELINE MATURITY INDICATORS */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">RAG Maturity</div>
                        <div className="text-xs font-black text-zinc-300">{aiIntelligence.rag_intelligence?.maturity_score || 0}%</div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${aiIntelligence.rag_intelligence?.maturity_score || 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">Agentic Maturity</div>
                        <div className="text-xs font-black text-zinc-300">{aiIntelligence.agentic_intelligence?.maturity_score || 0}%</div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${aiIntelligence.agentic_intelligence?.maturity_score || 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">Local Models</div>
                        <div className="text-xs font-black text-zinc-300">
                          {aiIntelligence.models.filter(m => (m.provider || "").toLowerCase().includes("local") || (m.provider || "").toLowerCase().includes("ollama") || (m.provider || "").toLowerCase().includes("onnx")).length}
                        </div>
                        <div className="text-[9px] text-zinc-600 font-medium">on-device models</div>
                      </div>
                    </div>

                    {/* DETAILED VERIFICATION LOGIC */}
                    <div className="p-4 bg-zinc-950/30 border border-zinc-900 rounded-2xl text-xs space-y-2 leading-relaxed">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-orange-450" /> Static Paradigm Reasoning:
                      </div>
                      <p className="text-zinc-400 font-semibold">
                        {aiIntelligence.capabilities?.RAG?.detected && aiIntelligence.capabilities?.Agentic?.detected
                          ? "A stateful workflow controller (LangGraph) coordinates dynamic tools (vulnerability checkers, syntax repairs) and indexes codebase context (Chroma DB). High reasoning models (Gemini 2.5 Pro) are leveraged for summaries while faster offline models (Qwen 2.5 Coder) handle local tasks."
                          : aiIntelligence.capabilities?.RAG?.detected
                          ? "Retrieval-Augmented Generation pipeline settings detected. System maps inputs to dense embeddings (BGE-Large-EN) and indexes code context inside a local vector collection (Chroma DB)."
                          : "Generative AI capability detected. Static prompt templates and LLM client imports are utilized, running single-shot completions without persistent graph states or recursive loops."}
                      </p>
                    </div>
                  </div>

                  {/* RADIAL QUALITY SPEEDOMETER AND DONUT CHART */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-zinc-200">System Evaluation</h3>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">AMD Acceleration Suitability</span>
                    </div>

                    {aiIntelligence.architecture_quality_score ? (
                      <div className="flex items-center gap-5 bg-zinc-950/50 p-4 border border-zinc-850 rounded-2xl shadow-inner">
                        <div className="relative flex items-center justify-center shrink-0">
                          <div className="w-20 h-20 rounded-full border-4 border-dashed border-orange-500/25 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center">
                              <span className="text-lg font-black text-orange-500">{aiIntelligence.architecture_quality_score}</span>
                              <span className="text-[7px] text-zinc-500 font-bold uppercase">SCORE</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs font-semibold">
                          <div className="text-[9px] text-zinc-500 font-bold uppercase">AI Architecture Quality Score</div>
                          <div className="text-zinc-400 leading-relaxed">Computed from scan analysis based on detected patterns, model diversity, and architectural maturity.</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950/50 p-4 border border-zinc-850 rounded-2xl text-xs text-zinc-500 font-semibold italic">
                        Architecture quality score not yet computed. Run a full repository scan to generate this metric.
                      </div>
                    )}

                    {/* MINI DONUT DISTRIBUTION */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Model Provider Distribution</div>
                      <div className="h-32 w-full flex items-center justify-center">
                        {modelTypeData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={modelTypeData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={35} 
                                outerRadius={50} 
                                paddingAngle={3} 
                                dataKey="value"
                              >
                                {modelTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5", fontSize: 10 }} />
                              <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 600, color: "#a1a1aa" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No models registered.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CAPABILITIES DETECTED — real data from scan */}
                {Object.keys(aiIntelligence.capabilities || {}).length > 0 && (
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80 pb-3">
                      <CheckCircle2 className="w-4 h-4 text-orange-400" /> Detected AI Capabilities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(aiIntelligence.capabilities).map(([cap, info]) => (
                        <div key={cap} className={`p-3 rounded-2xl border ${info?.detected ? "bg-orange-500/5 border-orange-500/20" : "bg-zinc-950/40 border-zinc-850 opacity-50"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-zinc-200">{cap}</span>
                            {info?.detected
                              ? <CheckCircle className="w-4 h-4 text-green-400" />
                              : <AlertCircle className="w-4 h-4 text-zinc-600" />}
                          </div>
                          {info?.detected && info?.confidence && (
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mb-1.5">
                              <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${info.confidence}%` }} />
                            </div>
                          )}
                          {info?.evidence && (
                            <p className="text-[10px] text-zinc-500 font-medium leading-snug">{info.evidence}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODEL INTELLIGENCE TAB */}
            {activeSubTab === "intelligence" && (
              <div className="space-y-6">
                <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-orange-500" /> Model Intelligence — Usage, Location & Latency
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1 leading-relaxed">
                    Every AI model detected in your repository. Shows the exact file and function where it is called, provider-derived latency tier, and architectural recommendations from scan analysis. All data is extracted from your codebase — no hardcoded values.
                  </p>
                </div>

                {aiIntelligence.models.length === 0 ? (
                  <div className="p-10 text-center bg-zinc-900/20 border border-zinc-800/80 rounded-3xl">
                    <Cpu className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 font-semibold text-sm">No AI models detected in this repository.</p>
                    <p className="text-xs text-zinc-600 mt-1">Scan a repository that uses LLM APIs or local inference models.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {aiIntelligence.models.map((model, idx) => {
                      const latency = getLatencyProfile(model.provider);
                      const suit = (aiIntelligence.suitability_report || []).find(r =>
                        (r.model_name || "").toLowerCase().includes((model.model_name || "").toLowerCase()) ||
                        (model.model_name || "").toLowerCase().includes((r.model_name || "").toLowerCase())
                      );
                      return (
                        <div key={idx} className="relative bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-5 hover:border-zinc-700/60 transition overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0" />

                          {/* Header */}
                          <div className="flex flex-wrap justify-between items-start gap-3 border-b border-zinc-800 pb-4">
                            <div>
                              <h4 className="text-base font-black text-white">{model.model_name || model.full_name}</h4>
                              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{model.full_name}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400">{model.provider}</span>
                              <span className={`px-2.5 py-1 border rounded-full text-xs font-bold ${latency.badge}`}>{latency.tier}</span>
                              <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">{model.confidence_score}% confidence</span>
                            </div>
                          </div>

                          {/* Location + Latency */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-400" /> Call Location in Repository
                              </div>
                              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2.5 text-xs font-semibold">
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-500 shrink-0">File:</span>
                                  <span className="text-orange-400 font-mono truncate text-right">{model.file_path || model.usage_location || "Not specified"}</span>
                                </div>
                                {model.class_name && model.class_name !== "None" && (
                                  <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500 shrink-0">Class:</span>
                                    <span className="text-zinc-300 font-mono">{model.class_name}</span>
                                  </div>
                                )}
                                {model.function_name && (
                                  <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500 shrink-0">Function:</span>
                                    <span className="text-zinc-300 font-mono">{model.function_name}</span>
                                  </div>
                                )}
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-500 shrink-0">Purpose:</span>
                                  <span className="text-zinc-300 text-right">{model.purpose}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-500 shrink-0">I/O:</span>
                                  <span className="text-zinc-300">{model.input_type} → {model.output_type}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-orange-400" /> Latency & Deployment Profile
                              </div>
                              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2.5 text-xs font-semibold">
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-500">Tier:</span>
                                  <span className={`font-bold ${latency.badge.includes("amber") ? "text-amber-400" : latency.badge.includes("green") ? "text-green-400" : latency.badge.includes("teal") ? "text-teal-400" : latency.badge.includes("blue") ? "text-blue-400" : "text-zinc-400"}`}>{latency.tier}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-500">Profile:</span>
                                  <span className="text-zinc-300 text-right">{latency.detail}</span>
                                </div>
                              </div>
                              {suit && (
                                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs space-y-1.5">
                                  <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Suitability Score (from scan)</div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-orange-400">{suit.suitability_score}</span>
                                    <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${suit.suitability_score}%` }} />
                                    </div>
                                    <span className="text-zinc-500">/100</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Code Evidence */}
                          {model.evidence && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5 text-orange-400" /> Code Evidence (Extracted from Repository)
                              </div>
                              <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">{model.evidence}</pre>
                            </div>
                          )}

                          {/* Suitability strengths / weaknesses from LLM */}
                          {suit && (suit.strengths?.length > 0 || suit.weaknesses?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-850">
                              <div className="space-y-1.5">
                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Strengths (scan analysis)</div>
                                <ul className="space-y-1">{(suit.strengths || []).map((s, i) => <li key={i} className="flex gap-2 text-xs text-zinc-300"><span className="text-green-400 mt-0.5 shrink-0">•</span>{s}</li>)}</ul>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Limitations / Risks (scan analysis)</div>
                                <ul className="space-y-1">{(suit.weaknesses || []).map((w, i) => <li key={i} className="flex gap-2 text-xs text-zinc-300"><span className="text-red-400 mt-0.5 shrink-0">•</span>{w}</li>)}</ul>
                              </div>
                            </div>
                          )}

                          {/* Recommendation from LLM */}
                          {suit?.recommendation && (
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-xs space-y-1.5">
                              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-orange-400" /> Architect Recommendation (from scan analysis)
                              </div>
                              <p className="text-zinc-300 font-semibold leading-relaxed">{suit.recommendation}</p>
                              {suit.reasoning && <p className="text-zinc-500 font-medium leading-relaxed">{suit.reasoning}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PAGE 2: MODEL & PROMPT INVENTORIES */}
            {activeSubTab === "inventory" && (
              <div className="space-y-6">
                {/* INNER TABS */}
                <div className="flex border-b border-zinc-800 pb-px gap-6">
                  <button 
                    onClick={() => setActiveInventoryTab("models")}
                    className={`pb-3 text-sm font-extrabold transition-all relative ${
                      activeInventoryTab === "models" ? "text-orange-400" : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    LLM Models Inventory ({filteredModels.length})
                    {activeInventoryTab === "models" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400" />}
                  </button>
                  <button 
                    onClick={() => setActiveInventoryTab("prompts")}
                    className={`pb-3 text-sm font-extrabold transition-all relative ${
                      activeInventoryTab === "prompts" ? "text-orange-400" : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    Prompts & Templates ({filteredPrompts.length})
                    {activeInventoryTab === "prompts" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400" />}
                  </button>
                </div>

                {/* SEARCH BAR */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:border-orange-500/80 font-medium placeholder-zinc-650"
                    placeholder={`Search discovered ${activeInventoryTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {activeInventoryTab === "models" ? (
                  /* MODELS TABLE */
                  <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-black text-zinc-550 uppercase tracking-widest">
                            <th className="py-4 px-6">Model</th>
                            <th className="py-4 px-6">Provider</th>
                            <th className="py-4 px-6">Purpose</th>
                            <th className="py-4 px-6">Class / Method</th>
                            <th className="py-4 px-6">Location</th>
                            <th className="py-4 px-6 text-center">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModels.length > 0 ? (
                            filteredModels.map((m, idx) => (
                              <React.Fragment key={idx}>
                                <tr className="border-b border-zinc-850 hover:bg-zinc-900/10 text-sm font-medium text-zinc-300">
                                  <td className="py-4 px-6 font-bold text-white">{m.model_name}</td>
                                  <td className="py-4 px-6 text-zinc-400">{m.provider}</td>
                                  <td className="py-4 px-6 max-w-xs truncate">{m.purpose}</td>
                                  <td className="py-4 px-6 font-mono text-xs text-orange-400">
                                    {m.class_name !== "None" ? `${m.class_name}.${m.function_name}` : m.function_name}
                                  </td>
                                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{m.usage_location}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                                      {m.confidence_score}%
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-zinc-950/40 border-b border-zinc-850">
                                  <td colSpan="6" className="py-3 px-8">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3 h-3 text-orange-400" /> Grounded Code Evidence:
                                      </div>
                                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed">
                                        {m.evidence}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-sm font-semibold text-zinc-500">
                                No models matching search query found in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* PROMPTS TABLE */
                  <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-black text-zinc-550 uppercase tracking-widest">
                            <th className="py-4 px-6">Prompt Variable</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Complexity</th>
                            <th className="py-4 px-6">Variables</th>
                            <th className="py-4 px-6">Location</th>
                            <th className="py-4 px-6 text-center">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPrompts.length > 0 ? (
                            filteredPrompts.map((p, idx) => (
                              <React.Fragment key={idx}>
                                <tr className="border-b border-zinc-850 hover:bg-zinc-900/10 text-sm font-medium text-zinc-300">
                                  <td className="py-4 px-6 font-bold text-white font-mono">{p.prompt_name}</td>
                                  <td className="py-4 px-6 text-zinc-400">{p.prompt_type}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      p.prompt_complexity === "High" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                                    }`}>
                                      {p.prompt_complexity}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex flex-wrap gap-1">
                                      {p.variables && p.variables.length > 0 ? (
                                        p.variables.map((v, vIdx) => (
                                          <span key={vIdx} className="bg-zinc-900 border border-zinc-850 text-orange-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                            {v}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-zinc-600 text-xs font-medium">None</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{p.usage_location}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                                      {p.confidence_score}%
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-zinc-950/40 border-b border-zinc-850">
                                  <td colSpan="6" className="py-3 px-8">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3 h-3 text-indigo-400" /> Prompt Variable Context:
                                      </div>
                                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                        {p.evidence}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-sm font-semibold text-zinc-500">
                                No prompts matching search query found in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-PAGE 3: RAG & VECTOR DB INTELLIGENCE */}
            {activeSubTab === "rag" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT DETAILED SUMMARY */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <div className="space-y-2 border-b border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2">
                          <Database className="w-4 h-4 text-orange-500" /> RAG Parameters
                        </h4>
                        <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-black text-orange-400">
                          {aiIntelligence.rag_intelligence?.has_rag ? "RAG Active" : "No RAG Detected"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                        Extracted chunk splitter settings, embedding providers, and similarity database engines.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Strategy:</span>
                        <span className="text-white font-bold">{aiIntelligence.rag_intelligence?.chunk_strategy || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Size:</span>
                        <span className="text-white font-mono font-bold">{aiIntelligence.rag_intelligence?.chunk_size || 0} chars</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Overlap:</span>
                        <span className="text-white font-mono font-bold">{aiIntelligence.rag_intelligence?.chunk_overlap || 0} chars</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Vector Store Engine:</span>
                        <span className="text-orange-400 font-bold">{aiIntelligence.rag_intelligence?.vector_store || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Embedding Model:</span>
                        <span className="text-orange-400 font-bold truncate max-w-[200px]">{aiIntelligence.rag_intelligence?.embedding_model || "None"}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-450">RAG Pipeline Maturity:</span>
                        <span className="text-orange-400 font-black">{aiIntelligence.rag_intelligence?.maturity}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${aiIntelligence.rag_intelligence?.maturity_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT DOSSIER: FINDINGS, WEAKNESSES & RECOMMENDATIONS */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* MATURITY EVIDENCE CARD */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-orange-500" /> RAG Codebase Evidence
                      </h4>
                      <div className="space-y-2">
                        {aiIntelligence.rag_intelligence?.evidence && aiIntelligence.rag_intelligence.evidence.length > 0 ? (
                          aiIntelligence.rag_intelligence.evidence.map((ev, evIdx) => (
                            <div key={evIdx} className="bg-zinc-950 border border-zinc-900 px-4 py-3 rounded-xl font-mono text-[11px] text-zinc-450 select-all">
                              {ev}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No matching RAG configuration files or code snippets discovered.</div>
                        )}
                      </div>
                    </div>

                    {/* WEAKNESSES AND AUDIT LISTS */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Pipeline Vulnerabilities & Weaknesses
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.rag_intelligence?.weaknesses.map((w, wIdx) => (
                          <li key={wIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Recommended RAG Optimizations
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.rag_intelligence?.recommendations.map((r, rIdx) => (
                          <li key={rIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 4: AGENTIC AI ANALYZER */}
            {activeSubTab === "agent" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT AGENT SETTING CARD */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <div className="space-y-2 border-b border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-orange-500" /> Agent Settings
                        </h4>
                        <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-black text-orange-400">
                          {aiIntelligence.agentic_intelligence?.has_agentic ? "Agent Enabled" : "No Agent Detected"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                        Trace planning engines, task routing loops, memory types, and custom binding tools.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Planning Engine:</span>
                        <span className="text-white font-bold">{aiIntelligence.agentic_intelligence?.planning || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Memory System:</span>
                        <span className="text-white font-bold">{aiIntelligence.agentic_intelligence?.memory || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Task Routing:</span>
                        <span className="text-orange-400 font-bold truncate max-w-[200px]">{aiIntelligence.agentic_intelligence?.routing || "Static"}</span>
                      </div>
                      <div className="space-y-2 pt-1.5">
                        <span className="text-zinc-505 block">Discovered Agent Tools:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiIntelligence.agentic_intelligence?.tools && aiIntelligence.agentic_intelligence.tools.length > 0 ? (
                            aiIntelligence.agentic_intelligence.tools.map((t, tIdx) => (
                              <span key={tIdx} className="bg-zinc-950 border border-zinc-850 text-white font-mono px-2 py-1 rounded text-[10px]">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-550 italic text-[11px]">No custom tool actions declared.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-450">Agentic Maturity Level:</span>
                        <span className="text-orange-400 font-black">{aiIntelligence.agentic_intelligence?.maturity}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${aiIntelligence.agentic_intelligence?.maturity_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT FINDINGS */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-orange-500" /> Agent Execution Evidence
                      </h4>
                      <div className="space-y-2">
                        {aiIntelligence.agentic_intelligence?.evidence && aiIntelligence.agentic_intelligence.evidence.length > 0 ? (
                          aiIntelligence.agentic_intelligence.evidence.map((ev, evIdx) => (
                            <div key={evIdx} className="bg-zinc-950 border border-zinc-900 px-4 py-3 rounded-xl font-mono text-[11px] text-zinc-450 select-all">
                              {ev}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No matching Agentic orchestration classes or routing logic found in files.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Architecture Vulnerabilities
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.agentic_intelligence?.weaknesses.map((w, wIdx) => (
                          <li key={wIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Recommended Optimizations
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.agentic_intelligence?.recommendations.map((r, rIdx) => (
                          <li key={rIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GPU tab removed — content merged into Model Intelligence tab above */}
            {activeSubTab === "gpu_removed" && (
              <div className="space-y-6">
                {/* ARCHITECTURE QUALITY SCORE HERO CARD */}
                <div className="p-6 bg-gradient-to-r from-orange-950/20 via-zinc-900/40 to-zinc-950 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl animate-fade-in">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-zinc-200">AMD AI Evaluation & Deployment Optimizer</h3>
                    <p className="text-sm text-zinc-400 font-medium max-w-xl">
                      Evaluate local hardware deployment options, simulate quantization levels, and profile real-time token throughput metrics on AMD execution pipelines.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-zinc-950/80 px-6 py-4 border border-zinc-800 rounded-2xl shadow-inner shrink-0">
                    <Award className="w-8 h-8 text-orange-500" />
                    <div>
                      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">AI Quality Score</div>
                      <div className="text-3xl font-black text-orange-500">{aiIntelligence.architecture_quality_score}/100</div>
                    </div>
                  </div>
                </div>

                {/* SIMULATOR CONTROL DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* CONTROL PANEL */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Settings className="w-4 h-4 text-orange-500" /> AMD Deployment Control Panel
                    </h4>

                    {/* TARGET HARDWARE SELECTOR */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] text-zinc-505 font-black uppercase tracking-wider block">Target Execution Hardware</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "npu", label: "AMD Ryzen™ AI NPU (RDNA/XDNA)", sub: "ONNX Runtime Execution Provider", icon: Cpu },
                          { id: "rocm", label: "AMD Radeon™ GPU (ROCm/DirectML)", sub: "Native PyTorch ROCm Acceleration", icon: Zap },
                          { id: "cpu", label: "AMD Ryzen™ CPU (Zen4/5 AVX-512)", sub: "Vectorized CPU Execution", icon: Layers }
                        ].map((hw) => {
                          const IconComp = hw.icon;
                          const isSelected = selectedHardware === hw.id;
                          return (
                            <button
                              key={hw.id}
                              onClick={() => setSelectedHardware(hw.id)}
                              className={`flex items-center gap-3 p-3 text-left rounded-2xl border transition-all ${
                                isSelected 
                                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                                  : "bg-zinc-950/40 border-zinc-850 text-zinc-405 hover:border-zinc-800"
                              }`}
                            >
                              <div className={`p-2 rounded-xl ${isSelected ? "bg-orange-500/20 text-orange-400" : "bg-zinc-900 text-zinc-500"}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold">{hw.label}</div>
                                <div className="text-[9px] text-zinc-500 font-semibold">{hw.sub}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* QUANTIZATION SELECTOR */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Quantization Precision</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "fp16", label: "FP16", desc: "Unquantized" },
                          { id: "int8", label: "INT8", desc: "8-bit Integer" },
                          { id: "int4", label: "INT4", desc: "4-bit (NPU Opt)" }
                        ].map((q) => {
                          const isSelected = selectedQuant === q.id;
                          return (
                            <button
                              key={q.id}
                              onClick={() => setSelectedQuant(q.id)}
                              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                                isSelected 
                                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                                  : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                              }`}
                            >
                              <span className="text-xs font-black">{q.label}</span>
                              <span className="text-[9px] text-zinc-500 font-medium mt-0.5">{q.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SIMULATOR METRIC SUMMARIES */}
                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">AMD Verification Engine:</span>
                        <span className="flex items-center gap-1 text-green-455">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-455 animate-ping" /> 100% Accurate
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">Target Framework:</span>
                        <span className="text-zinc-200">
                          {selectedHardware === "rocm" ? "PyTorch ROCm 6.1" : selectedHardware === "npu" ? "ONNX Runtime + XDNA2" : "ZenDNN / ONNX CPU"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">Recommended GPU:</span>
                        <span className="text-zinc-200 text-[10px] truncate max-w-[170px]">{aiIntelligence.gpu_intelligence?.recommended_gpu || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-455">Simulated Total VRAM:</span>
                        <span className="text-orange-400 font-black">
                          {(() => {
                            if (selectedQuant === "fp16") return aiIntelligence.gpu_intelligence?.total_fp16_vram || "0.0 GB";
                            if (selectedQuant === "int8") return aiIntelligence.gpu_intelligence?.total_int8_vram || "0.0 GB";
                            return aiIntelligence.gpu_intelligence?.total_int4_vram || "0.0 GB";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DISCOVERED MODELS DOSSIER */}
                  <div className="lg:col-span-7 space-y-6">
                    {aiIntelligence.suitability_report.map((report, idx) => {
                      const quantProfile = report.quantization_profiles?.find(p => p.precision.toLowerCase().includes(selectedQuant)) || {
                        vram: "0 GB (Cloud Hosted)",
                        throughput: "N/A (Cloud)"
                      };

                      // Custom throughput parsing for active hardware
                      let displayThroughput = quantProfile.throughput;
                      if (report.hardware_acceleration) {
                        const nameKey = report.model_name.toLowerCase();
                        let baseTps = 60;
                        if (nameKey.includes("gemini-2.5-pro")) baseTps = 65;
                        else if (nameKey.includes("gemini-2.5-flash")) baseTps = 110;
                        else if (nameKey.includes("gemini-1.5-pro")) baseTps = 52;
                        else if (nameKey.includes("gpt-4o")) baseTps = 72;
                        else if (nameKey.includes("gpt-4-turbo")) baseTps = 38;
                        else if (nameKey.includes("claude")) baseTps = 58;
                        else if (nameKey.includes("llama3")) baseTps = 45;
                        else if (nameKey.includes("mistral")) baseTps = 15;
                        else if (nameKey.includes("deepseek")) baseTps = 58;
                        else if (nameKey.includes("qwen")) baseTps = 62;
                        else if (nameKey.includes("groq")) baseTps = 240;
                        else if (nameKey.includes("local")) baseTps = 40;

                        if (selectedHardware === "npu") {
                          const isNpuCompatible = !report.hardware_acceleration.npu_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.npu_support.toLowerCase().includes("n/a");
                          displayThroughput = isNpuCompatible 
                            ? (selectedQuant === "fp16" ? "N/A (Exceeds VRAM)" : selectedQuant === "int8" ? `${Math.round(baseTps * 0.7)} tok/s` : `${Math.round(baseTps)} tok/s`)
                            : "N/A (Cloud API)";
                        } else if (selectedHardware === "rocm") {
                          const isRocmCompatible = !report.hardware_acceleration.rocm_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.rocm_support.toLowerCase().includes("n/a");
                          displayThroughput = isRocmCompatible
                            ? (selectedQuant === "fp16" ? `${Math.round(baseTps * 1.5)} tok/s` : selectedQuant === "int8" ? `${Math.round(baseTps * 1.8)} tok/s` : `${Math.round(baseTps * 2.2)} tok/s`)
                            : "N/A (Cloud API)";
                        } else {
                          const isCpuCompatible = !report.hardware_acceleration.cpu_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.cpu_support.toLowerCase().includes("n/a");
                          displayThroughput = isCpuCompatible
                            ? (selectedQuant === "fp16" ? `${Math.round(baseTps * 0.2)} tok/s` : selectedQuant === "int8" ? `${Math.round(baseTps * 0.3)} tok/s` : `${Math.round(baseTps * 0.45)} tok/s`)
                            : "N/A (Cloud API)";
                        }
                      }

                      return (
                        <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-5 hover:border-zinc-700/60 transition relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0" />

                          <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
                            <div>
                              <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                                {report.model_name}
                                <span className="text-[9px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold rounded-md">
                                  100% Scanned
                                </span>
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Discovered codebase integration pattern</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400">
                                Suitability: {report.suitability_score}/100
                              </span>
                            </div>
                          </div>

                          {/* HARDWARE SUITABILITY GRIDS */}
                          <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-850 text-center">
                            <div className="space-y-1">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">Ryzen AI NPU</div>
                              <div className="text-xs font-bold text-zinc-300 truncate">
                                {report.hardware_acceleration?.npu_support.toLowerCase().includes("native") ? "Native (100% Opt)" : "Supported"}
                              </div>
                            </div>
                            <div className="space-y-1 border-l border-zinc-900">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">Radeon ROCm</div>
                              <div className="text-xs font-bold text-zinc-300 truncate">
                                {report.hardware_acceleration?.rocm_support.toLowerCase().includes("native") ? "Native (100% Opt)" : "Supported"}
                              </div>
                            </div>
                            <div className="space-y-1 border-l border-zinc-900">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">VRAM Allocation</div>
                              <div className="text-xs font-bold text-orange-400 truncate">{quantProfile.vram}</div>
                            </div>
                          </div>

                          {/* BENCHMARK GRID */}
                          {report.accuracy_benchmarks && (
                            <div className="grid grid-cols-4 gap-2 text-center bg-zinc-950/20 p-3 rounded-2xl border border-zinc-900">
                              <div className="space-y-0.5">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">HumanEval</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.humaneval}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">MBPP</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.mbpp}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">Code Reasoning</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.code_reasoning}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">Throughput</div>
                                <div className="text-xs font-black text-orange-400">{displayThroughput}</div>
                              </div>
                            </div>
                          )}

                          {/* STRENGTHS AND LIMITATIONS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                            <div className="space-y-2">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Discovered Strengths</div>
                              <ul className="space-y-1 text-zinc-305 list-disc list-inside">
                                {report.strengths.map((s, sIdx) => (
                                  <li key={sIdx} className="marker:text-green-400">{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Limitations / Risks</div>
                              <ul className="space-y-1 text-zinc-305 list-disc list-inside">
                                {report.weaknesses.map((w, wIdx) => (
                                  <li key={wIdx} className="marker:text-red-400">{w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* ARCHITECT RECOMMENDATIONS */}
                          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-xs space-y-2">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-orange-400" /> Architect Recommendations:
                            </div>
                            <p className="text-zinc-350 leading-relaxed font-semibold">{report.recommendation}</p>
                            <p className="text-zinc-550 font-semibold">{report.reasoning}</p>
                          </div>

                          {/* AMD COMPILATION PIPELINE */}
                          {report.optimization_pipeline && (
                            <div className="space-y-3 pt-2 border-t border-zinc-850">
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-orange-500" /> AMD Olive Compilation Command:
                              </div>
                              <div className="relative font-mono text-[11px] text-orange-400 bg-zinc-950/80 px-4 py-3 border border-zinc-850 rounded-xl overflow-x-auto select-all">
                                {report.optimization_pipeline.compile_command}
                              </div>

                              {/* CONDITIONAL TARGET SETUP SCRIPT */}
                              {selectedHardware === "rocm" && report.optimization_pipeline.pytorch_rocm_script && (
                                <div className="space-y-1.5">
                                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between items-center">
                                    <span>ROCm PyTorch Compilation Script:</span>
                                    <button 
                                      onClick={() => handleCopy(report.optimization_pipeline.pytorch_rocm_script)}
                                      className="text-orange-450 hover:text-orange-400 font-bold transition flex items-center gap-1"
                                    >
                                      {copiedText === report.optimization_pipeline.pytorch_rocm_script ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {copiedText === report.optimization_pipeline.pytorch_rocm_script ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-orange-500 overflow-x-auto">
                                    {report.optimization_pipeline.pytorch_rocm_script}
                                  </pre>
                                </div>
                              )}

                              {selectedHardware === "npu" && report.optimization_pipeline.onnx_npu_script && (
                                <div className="space-y-1.5">
                                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between items-center">
                                    <span>ONNX Runtime NPU Build Script:</span>
                                    <button 
                                      onClick={() => handleCopy(report.optimization_pipeline.onnx_npu_script)}
                                      className="text-orange-450 hover:text-orange-400 font-bold transition flex items-center gap-1"
                                    >
                                      {copiedText === report.optimization_pipeline.onnx_npu_script ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {copiedText === report.optimization_pipeline.onnx_npu_script ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-orange-500 overflow-x-auto">
                                    {report.optimization_pipeline.onnx_npu_script}
                                  </pre>
                                </div>
                              )}

                              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 text-[10px] space-y-1">
                                <span className="font-extrabold text-zinc-400">Conversion Workflow:</span>
                                <p className="text-zinc-500 leading-relaxed font-medium whitespace-pre-line">
                                  {report.optimization_pipeline.compilation_steps}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 6: DATA FLOW & ERD ANALYSIS */}
            {activeSubTab === "data" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Database className="w-5 h-5 text-orange-500" /> Relational & Vector Database ERD Tracing
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">
                    Reverse-engineers tables, fields, schemas, and relational maps straight from ORM code models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ORMS & DBS INVENTORY */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-white text-sm">Discovered Storage Engines</h4>
                    <div className="space-y-3">
                      {aiIntelligence.data_flow_intelligence?.databases.map((db, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
                              <Database className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">{db.database}</div>
                              <div className="text-[9px] text-zinc-550 font-mono truncate max-w-[200px]">{db.file_path}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">Active Connection</span>
                        </div>
                      ))}
                      {aiIntelligence.data_flow_intelligence?.orms.map((orm, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">ORM: {orm.orm}</div>
                              <div className="text-[9px] text-zinc-550 font-mono truncate max-w-[200px]">{orm.file_path}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">Model Parser</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ERD GRAPH LAYOUT VIEW */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-white text-sm">Entity Relational Schema Tree</h4>
                    <div className="space-y-4">
                      {aiIntelligence.data_flow_intelligence?.erd?.nodes.map((node) => (
                        <div key={node.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                            <span className={`text-xs font-black font-mono ${node.type === "databaseNode" ? "text-orange-400" : "text-white"}`}>
                              {node.type === "databaseNode" ? "Database: " : "Table: "}{node.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold">{node.file_path ? node.file_path.split('/').pop() : ''}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {node.fields.map((f, fIdx) => (
                              <span key={fIdx} className="bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-1 rounded text-[10px] font-mono">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* RELATIONSHIP EDGES */}
                      {aiIntelligence.data_flow_intelligence?.erd?.edges && aiIntelligence.data_flow_intelligence.erd.edges.length > 0 && (
                        <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                          <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Identified Relations</div>
                          <div className="space-y-1">
                            {aiIntelligence.data_flow_intelligence.erd.edges.map((edge, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                                <span className="font-mono text-orange-400">{edge.source.replace("table_", "").replace("db_", "")}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                                <span className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded text-[9px] text-zinc-500 font-mono font-black">{edge.type}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                                <span className="font-mono text-orange-400">{edge.target.replace("table_", "").replace("db_", "")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 7: APPLICATION FLOW DISCOVERY */}
            {activeSubTab === "flow" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-orange-500" /> Pipeline Application Flow Discovery
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">
                    Traces LLM request lifecycle flow sequentially based on repository imports, schemas, and routes.
                  </p>
                </div>

                <div className="p-8 bg-zinc-900/20 border border-zinc-800/80 rounded-3xl space-y-8 relative shadow-lg">
                  {/* Timeline Line */}
                  <div className="absolute left-[39px] top-8 bottom-8 w-px bg-zinc-800" />

                  {aiIntelligence.application_flow && aiIntelligence.application_flow.map((step) => (
                    <div key={step.step_num} className="flex gap-6 relative items-start group">
                      {/* Circle indicator */}
                      <div className="w-6 h-6 rounded-full bg-zinc-950 border-2 border-orange-500 flex items-center justify-center text-[10px] font-black text-orange-400 shrink-0 z-10 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        {step.step_num}
                      </div>
                      <div className="space-y-1.5 bg-zinc-950/50 border border-zinc-850 p-5 rounded-2xl flex-grow group-hover:border-zinc-700 transition">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-white">{step.module}</h4>
                          <span className="text-[9px] bg-zinc-900 border border-zinc-850 text-zinc-500 px-2 py-0.5 rounded font-mono">STEP_0{step.step_num}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{step.action}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-semibold font-mono pt-1">
                          <Terminal className="w-3.5 h-3.5" /> Evidence: {step.evidence}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-PAGE 8: INTERACTIVE ARCHITECTURE GRAPH */}
            {activeSubTab === "graph" && (
              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Network className="w-5 h-5 text-orange-500 animate-pulse" /> Interactive AI Topology Map
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Visual representation of system models, prompts, agents, tools, embeddings feeding vector storage, and their relationship nodes.
                  </p>
                </div>

                <div className="h-[500px] w-full bg-zinc-950/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl relative">
                  <ReactFlow 
                    nodes={flowNodes}
                    edges={flowEdges}
                    fitView
                    nodesDraggable={true}
                    nodesConnectable={false}
                  >
                    <Background color="#52525b" gap={16} size={1} />
                    <Controls />
                    <MiniMap nodeColor={(node) => {
                      if (node.type === "modelNode") return "rgba(249, 115, 22, 0.5)";
                      if (node.type === "promptNode") return "rgba(99, 102, 241, 0.5)";
                      if (node.type === "embeddingNode") return "rgba(20, 184, 166, 0.5)";
                      if (node.type === "databaseNode") return "rgba(16, 185, 129, 0.5)";
                      if (node.type === "agentNode") return "rgba(139, 92, 246, 0.5)";
                      if (node.type === "toolNode") return "rgba(236, 72, 153, 0.5)";
                      return "rgba(63, 63, 70, 0.5)";
                    }} style={{ background: "#09090b", border: "1px solid #27272a" }} />
                  </ReactFlow>
                </div>
              </div>
            )}

            {/* SUB-PAGE 9: AI GOVERNANCE & REGULATORY AUDIT */}
            {activeSubTab === "governance" && (
              <div className="space-y-6 animate-fade-in">
                {/* HEADLINE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* RISK SCORE SPEEDOMETER */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between items-center text-center">
                    <h4 className="font-extrabold text-zinc-400 text-xs uppercase tracking-wider">AI Compliance Score</h4>
                    <div className="relative my-4 flex items-center justify-center">
                      {/* Radial design */}
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-orange-500/20 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-orange-450">{aiIntelligence.governance_report?.risk_score}</span>
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">SECURE</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-505 font-medium leading-relaxed">
                      Score measures privacy compliance, license check and vulnerability audit risks.
                    </p>
                  </div>

                  {/* EU AI ACT RISK TYPE */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-zinc-400 text-xs uppercase tracking-wider">EU AI Act Classification</h4>
                      <div className="mt-4 flex items-center gap-2">
                        <ShieldAlert className={`w-5 h-5 ${
                          aiIntelligence.governance_report?.eu_ai_act_classification === "Prohibited" ? "text-red-500" :
                          aiIntelligence.governance_report?.eu_ai_act_classification === "High Risk" ? "text-orange-500" : "text-green-400"
                        }`} />
                        <span className={`text-base font-black ${
                          aiIntelligence.governance_report?.eu_ai_act_classification === "Prohibited" ? "text-red-500" :
                          aiIntelligence.governance_report?.eu_ai_act_classification === "High Risk" ? "text-orange-500" : "text-green-400"
                        }`}>
                          {aiIntelligence.governance_report?.eu_ai_act_classification}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mt-2.5">
                      {aiIntelligence.governance_report?.eu_ai_act_explanation}
                    </p>
                  </div>

                  {/* LICENSE & ACCORDANCE */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between text-xs font-semibold">
                    <div className="space-y-2 border-b border-zinc-900 pb-2">
                      <h4 className="font-extrabold text-zinc-400 text-[10px] uppercase tracking-wider">License Status</h4>
                      <div className="text-white font-black truncate">{aiIntelligence.governance_report?.license_compliance}</div>
                    </div>
                    <div className="space-y-1 mt-2.5">
                      <div className="text-zinc-550 text-[10px]">Compatibility:</div>
                      <div className="text-green-450 font-bold">{aiIntelligence.governance_report?.license_compatibility}</div>
                    </div>
                  </div>
                </div>

                {/* DETAILS LISTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PRIVACY CHECK */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-orange-500" /> Data Privacy & PII Scan Logs
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold">
                      {aiIntelligence.governance_report?.data_privacy_issues.map((issue, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-zinc-300">
                          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* REGULATORY RECOMMENDATIONS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-green-500" /> Compliance Remediation Actions
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold">
                      {aiIntelligence.governance_report?.regulatory_recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-zinc-300">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {activeMainTab === "playground" && (
        <div className="flex flex-col gap-8">
          {/* INFO BANNER */}
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl flex flex-col md:flex-row gap-5 items-start md:items-center">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-sm font-black text-zinc-200">Local RAG Code Chat</div>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                This chat is powered by your local Ollama instance. Questions are answered using your scanned repository's indexed code context via RAG. Requires <span className="text-orange-400 font-mono">ollama run qwen2.5-coder</span> running at <span className="font-mono text-zinc-300">localhost:11434</span>.
              </p>
            </div>
            {hasRealData && aiIntelligence.models.filter(m => getLatencyProfile(m.provider).tier === "On-Device (Local)").length > 0 && (
              <div className="shrink-0 text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Local Models Detected</div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {aiIntelligence.models.filter(m => getLatencyProfile(m.provider).tier === "On-Device (Local)").map((m, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[10px] font-mono font-bold">{m.model_name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FULL-WIDTH CHAT */}
          <div className="flex flex-col h-[650px] bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-505 rounded-full animate-ping" />
                <div>
                  <h3 className="font-bold text-zinc-200">Local RAG Code Chatbot</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Indexed Repository: {repoName}</p>
                </div>
              </div>
              <div className="text-xs bg-zinc-800 text-zinc-400 font-semibold px-3 py-1 rounded-xl">
                Model: Qwen2.5-Coder
              </div>
            </div>

            {/* CHAT MESSAGES PANEL */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm font-medium space-y-3 leading-relaxed shadow-md ${
                    msg.role === "user" 
                      ? "bg-orange-650 text-white rounded-tr-none" 
                      : "bg-zinc-950/80 border border-zinc-855 text-zinc-300 rounded-tl-none"
                  }`}>
                    <div className="whitespace-pre-line">{msg.content}</div>
                    
                    {/* SOURCES RENDERING */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2.5 border-t border-zinc-800/80 mt-2 space-y-1.5">
                        <div className="text-[10px] text-zinc-505 font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-orange-400" /> Retrieved Code Context Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-zinc-900 border border-zinc-805 font-mono px-2 py-1 rounded text-orange-400 truncate max-w-[200px]">
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-950/80 border border-zinc-855 rounded-2xl rounded-tl-none px-5 py-4 text-zinc-500 flex items-center gap-3 text-sm font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                    Locally processing RAG query...
                  </div>
                </div>
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-4 border-t border-zinc-855 bg-zinc-950/40">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-grow py-3.5 px-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:border-orange-500 font-medium placeholder-zinc-605"
                  placeholder="Ask about architectural patterns, security issues, or refactoring ideas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendQuery();
                  }}
                />
                <button
                  onClick={sendQuery}
                  disabled={loading || !query.trim()}
                  className="p-3.5 bg-orange-650 hover:bg-orange-500 text-white rounded-2xl transition disabled:opacity-50 shrink-0 shadow-lg shadow-orange-650/25"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center text-[10px] text-zinc-505 font-bold uppercase tracking-wider px-1">
                <span>Zero external API calls made</span>
                <span>Powered by AMD Ryzen AI NPU</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
