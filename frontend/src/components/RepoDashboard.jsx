import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ScoreGauge from "./ScoreGauge";
import { FolderGit2, Star, GitFork, Clock, Activity, ShieldAlert, GitBranch, Share2, Download, FileJson, FileText, Zap, Layers, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Check, CheckCircle, XCircle, AlertOctagon, User, Calendar, MessageSquare, Cpu, Send, Terminal, FileCode, Play, RefreshCw, HelpCircle, Info } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import RecommendationCard from "./RecommendationCard";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

const getFileCategory = (id) => {
  const lower = id.toLowerCase();
  if (lower.includes("secret") || lower.includes("vulnerability") || lower.includes("security") || lower.includes("detector") || lower.includes("audit") || lower.includes("policy")) {
    return "Security Intelligence";
  }
  if (lower.includes("report") || lower.includes("export") || lower.includes("pdf") || lower.includes("generator") || lower.includes("printer")) {
    return "Reports Layer";
  }
  if (lower.includes("scanner") || lower.includes("parser") || lower.includes("analyzer") || lower.includes("intelligence") || lower.includes("kb") || lower.includes("db") || lower.includes("database") || lower.includes("search") || lower.includes("index")) {
    return "Analysis Engine";
  }
  if (lower.includes("route") || lower.includes("api") || lower.includes("controller") || lower.includes("main.py") || lower.includes("app.py") || lower.includes("server.py")) {
    return "API Layer";
  }
  if (lower.includes(".jsx") || lower.includes(".tsx") || lower.includes(".html") || lower.includes(".css") || lower.includes("frontend") || lower.includes("component") || lower.includes("view") || lower.includes("page")) {
    return "Frontend Layer";
  }
  return "API Layer"; // default fallback
};

const CustomNode = ({ data, selected }) => {
  const riskBorderColor = {
    red: "border-red-500/80 shadow-red-500/5",
    yellow: "border-yellow-500/80 shadow-yellow-500/5",
    blue: "border-blue-500/80 shadow-blue-500/5",
    green: "border-green-500/80 shadow-green-500/5"
  }[data.risk] || "border-zinc-700/80";

  const riskText = {
    red: "Critical",
    yellow: "Warning",
    blue: "Core",
    green: "Safe"
  }[data.risk] || "Info";

  const riskBadgeColor = {
    red: "bg-red-500/10 text-red-400 border border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border border-green-500/20"
  }[data.risk] || "bg-zinc-800 text-zinc-400";

  const layerLabels = {
    "Frontend Layer": "Frontend Component",
    "API Layer": "API Controller",
    "Analysis Engine": "Analysis Core",
    "Security Intelligence": "Security Guard",
    "Reports Layer": "Export Service"
  };

  const icons = {
    "Frontend Layer": <FileCode className="w-3.5 h-3.5 text-blue-400" />,
    "API Layer": <Zap className="w-3.5 h-3.5 text-indigo-400" />,
    "Analysis Engine": <Cpu className="w-3.5 h-3.5 text-orange-400" />,
    "Security Intelligence": <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
    "Reports Layer": <Layers className="w-3.5 h-3.5 text-emerald-400" />
  };

  return (
    <div className={`px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all flex flex-col gap-1.5 min-w-[170px] max-w-[220px] bg-zinc-950/90 ${riskBorderColor} ${
      selected ? 'ring-2 ring-indigo-500 border-indigo-500 scale-105 shadow-indigo-500/10' : ''
    }`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-indigo-500 border-none" />
      
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {icons[data.layer] || <FileCode className="w-3.5 h-3.5 text-zinc-400" />}
          <span className="text-[10px] font-bold text-zinc-350 truncate">{data.label}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-semibold text-zinc-500 tracking-wider leading-none uppercase">{layerLabels[data.layer] || "Module"}</span>
        <div className="flex justify-between items-center mt-1">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none ${riskBadgeColor}`}>Risk: {riskText}</span>
          <span className="text-[8.5px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">Deps: {data.dependenciesCount}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-indigo-500 border-none" />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode
};

function RepoCopilotGraph({ repoData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "assistant", text: "Hello! I am your AI Repository Copilot. Click any node in the graph to analyze it, or ask me questions about this codebase's architecture and flows." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const getNodeRisk = (path) => {
    const lower = path.toLowerCase();
    const isCritical = repoData.critical_files?.some(cf => cf.file?.toLowerCase() === lower);
    if (isCritical || lower.includes("auth") || lower.includes("crypt") || lower.includes("security")) {
      return "red";
    }
    if (lower.includes("controller") || lower.includes("route") || lower.includes("config") || lower.includes("db")) {
      return "yellow";
    }
    if (lower.includes("util") || lower.includes("helper") || lower.includes("service")) {
      return "blue";
    }
    return "green";
  };

  useEffect(() => {
    let rawNodes = repoData.relationships?.graph?.nodes || [];
    let rawEdges = repoData.relationships?.graph?.edges || [];

    if (rawNodes.length === 0) {
      const uniqueFiles = new Set();
      repoData.relationships?.dependency_map?.forEach(d => {
        uniqueFiles.add(d.from);
        uniqueFiles.add(d.to);
      });
      rawNodes = Array.from(uniqueFiles).map(f => ({
        id: f,
        label: "source_code",
        properties: { tags: [] }
      }));
    }

    if (rawEdges.length === 0) {
      rawEdges = (repoData.relationships?.dependency_map || []).map(d => ({
        source: d.from,
        target: d.to,
        relationship: "imports"
      }));
    }

    const seenNodeIds = new Set();
    const uniqueRawNodes = [];
    rawNodes.forEach(n => {
      if (n && n.id && !seenNodeIds.has(n.id)) {
        seenNodeIds.add(n.id);
        uniqueRawNodes.push(n);
      }
    });

    const layerY = {
      "Frontend Layer": 60,
      "API Layer": 180,
      "Analysis Engine": 300,
      "Security Intelligence": 420,
      "Reports Layer": 540
    };

    const mappedNodes = uniqueRawNodes.map((n) => {
      let nodeCategory = "File";
      const lowerId = n.id.toLowerCase();
      if (lowerId.includes("db") || lowerId.includes("database") || lowerId.includes("model")) {
        nodeCategory = "Database";
      } else if (lowerId.includes("api") || lowerId.includes("route") || lowerId.includes("controller")) {
        nodeCategory = "API";
      } else if (lowerId.includes("service") || lowerId.includes("helper")) {
        nodeCategory = "Service";
      } else if (lowerId.includes("test") || lowerId.includes("spec")) {
        nodeCategory = "Function";
      }

      const dependenciesCount = rawEdges.filter(e => e.source === n.id || e.target === n.id).length;
      const fileLayer = getFileCategory(n.id);

      return {
        id: n.id,
        type: 'customNode',
        data: { 
          label: n.id.split(/[/\\]/).pop(), 
          fullPath: n.id, 
          category: nodeCategory,
          risk: getNodeRisk(n.id),
          layer: fileLayer,
          dependenciesCount: dependenciesCount
        },
        position: { x: 400, y: 100 } // computed below
      };
    });

    // Group nodes by layer to calculate horizontal layout positions
    const layerGroups = {
      "Frontend Layer": [],
      "API Layer": [],
      "Analysis Engine": [],
      "Security Intelligence": [],
      "Reports Layer": []
    };

    mappedNodes.forEach(node => {
      const l = node.data.layer;
      if (layerGroups[l]) {
        layerGroups[l].push(node);
      } else {
        layerGroups["API Layer"].push(node);
      }
    });

    const graphWidth = 900;
    Object.keys(layerGroups).forEach(groupName => {
      const groupNodes = layerGroups[groupName];
      const y = layerY[groupName];
      const count = groupNodes.length;
      
      groupNodes.forEach((node, idx) => {
        let x = 400;
        if (count > 1) {
          const spacing = Math.min(220, graphWidth / (count + 1));
          const startX = 400 - ((count - 1) * spacing) / 2;
          x = startX + idx * spacing;
        } else {
          x = 400;
        }
        node.position = { x, y };
      });
    });

    const mappedEdges = rawEdges.map((e, idx) => {
      let rel = e.relationship || "imports";
      const lowerSource = e.source.toLowerCase();
      const lowerTarget = e.target.toLowerCase();
      
      if (lowerSource.includes("service") && lowerTarget.includes("db")) {
        rel = "uses";
      } else if (lowerSource.includes("api") && lowerTarget.includes("service")) {
        rel = "calls";
      } else if (lowerTarget.includes("config") || lowerTarget.includes("util")) {
        rel = "depends_on";
      }

      let edgeColor = "#6366f1"; // default indigo
      if (rel === "calls") edgeColor = "#f59e0b"; // yellow
      if (rel === "uses") edgeColor = "#10b981"; // green
      if (rel === "depends_on") edgeColor = "#3b82f6"; // blue
      if (rel === "imports") edgeColor = "#a855f7"; // purple

      return {
        id: `edge-${idx}`,
        source: e.source,
        target: e.target,
        label: rel,
        animated: true,
        style: { 
          stroke: edgeColor,
          strokeWidth: 1.5,
          opacity: 0.65
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor
        }
      };
    });

    setNodes(mappedNodes);
    setEdges(mappedEdges);
    
    if (mappedNodes.length > 0) {
      setSelectedNode(mappedNodes[0]);
      handleNodeClick(mappedNodes[0].id);
    }
  }, [repoData]);

  const handleNodeClick = async (nodePath) => {
    setDetailsLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const repoName = repoData.repository_overview?.name || "local_project";
      const response = await fetch(`${BASE_URL}/api/v1/node/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoName,
          node_path: nodePath
        })
      });
      if (response.ok) {
        const data = await response.json();
        setNodeDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const onNodeSelect = (event, node) => {
    setSelectedNode(node);
    handleNodeClick(node.id);
  };

  const handleSendChat = async () => {
    if (!query.trim()) return;
    const userText = query;
    setChatLog(prev => [...prev, { role: "user", text: userText }]);
    setQuery("");
    setChatLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const repoName = repoData.repository_overview?.name || "local_project";
      
      const payload = {
        repo_name: repoName,
        query: userText
      };
      
      if (selectedNode) {
        payload.selected_node = selectedNode.id;
        payload.node_type = selectedNode.data?.category || "file";
        if (nodeDetails) {
          payload.functions = nodeDetails.functions;
          payload.imports = nodeDetails.imports;
          payload.connected_nodes = nodeDetails.connected_nodes;
        }
      }

      const response = await fetch(`${BASE_URL}/api/v1/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("RAG API returned an error.");
      const resData = await response.json();
      setChatLog(prev => [...prev, { 
        role: "assistant", 
        text: resData.answer,
        sources: resData.sources 
      }]);
    } catch (err) {
      setChatLog(prev => [...prev, { 
        role: "assistant", 
        text: `⚠️ RAG chatbot connection failed. (Make sure your backend is running). Here is a general insight: The file ${selectedNode?.data?.label || 'selected'} manages core flow functionality. Ensure proper validation is implemented.` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };  const nodeExplanation = selectedNode ? true : false;  const layerGroups = {
    "Frontend Layer": [],
    "API Layer": [],
    "Analysis Engine": [],
    "Security Intelligence": [],
    "Reports Layer": []
  };

  nodes.forEach(node => {
    const l = node.data?.layer || "API Layer";
    if (layerGroups[l]) {
      layerGroups[l].push(node);
    } else {
      layerGroups["API Layer"].push(node);
    }
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[650px] w-full animate-in fade-in">
      {/* 1. Left Sidebar: Architecture Tree */}
      <div className="w-full lg:w-[260px] bg-zinc-900/60 border border-zinc-800 p-5 rounded-3xl flex flex-col shrink-0">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Architecture Tree
        </h3>
        <div className="flex-grow overflow-y-auto space-y-4 max-h-[580px] pr-2 custom-scrollbar">
          {Object.keys(layerGroups).map(layerName => {
            const nodesInLayer = layerGroups[layerName];
            if (nodesInLayer.length === 0) return null;
            
            return (
              <div key={layerName} className="space-y-1.5">
                <div className="text-[10px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-1">
                  <span>{layerName}</span>
                  <span className="text-[9px] bg-zinc-850 text-zinc-400 px-1.5 py-0.2 rounded-full font-mono">{nodesInLayer.length}</span>
                </div>
                <div className="flex flex-col gap-1 pl-2">
                  {nodesInLayer.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          handleNodeClick(node.id);
                        }}
                        className={`text-left text-xs font-mono py-1.5 px-2.5 rounded-lg border transition-all truncate ${
                          isSelected 
                            ? "bg-indigo-650/10 border-indigo-500/50 text-indigo-400 font-bold" 
                            : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                      >
                        {node.data.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Center Panel: Interactive System Graph */}
      <div className="flex-grow bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[500px]">
        <div className="p-4 bg-zinc-900/30 border-b border-zinc-800/80 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-zinc-200">Interactive System Graph</h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Layered Architecture Mapping • Click nodes to analyze</p>
            </div>
          </div>
          {selectedNode && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-indigo-500/20">Active: {selectedNode.data?.label}</span>
              <button onClick={() => { setSelectedNode(null); setNodeDetails(null); }} className="text-[9px] bg-zinc-800 text-zinc-400 font-bold px-2 py-1 rounded hover:bg-zinc-700 transition">Reset</button>
            </div>
          )}
        </div>

        <div className="flex-grow w-full h-[580px] relative overflow-hidden bg-zinc-950/90 select-none">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeSelect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            attributionPosition="bottom-left"
          >
            <Background color="#334155" gap={16} size={1} />
            <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-400" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.data?.risk === 'red') return '#ef4444';
                if (node.data?.risk === 'yellow') return '#f59e0b';
                if (node.data?.risk === 'blue') return '#3b82f6';
                return '#10b981';
              }}
              maskColor="rgba(9, 9, 11, 0.7)"
              className="!bg-zinc-900 !border-zinc-800"
            />
          </ReactFlow>
        </div>

        <div className="p-3.5 bg-zinc-900/30 border-t border-zinc-800/80 shrink-0 flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Critical Risk</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-yellow-500" /> Warning</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Service</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-green-500" /> Safe</div>
          </div>
          <div className="text-zinc-600 font-mono">Layered Dagre Layout</div>
        </div>
      </div>

      {/* 3. Right Sidebar: Node Intelligence Panel & AI Copilot Chat */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
        {selectedNode ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
              <div>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500 animate-pulse" /> Node Intelligence
                </span>
                <h3 className="text-sm font-black text-white font-mono break-all leading-tight mt-1">{selectedNode.data?.label}</h3>
                <span className="text-[9px] text-zinc-500 font-mono break-all block mt-0.5">{selectedNode.id}</span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                  selectedNode.data?.risk === "red" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  selectedNode.data?.risk === "yellow" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                  selectedNode.data?.risk === "blue" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
                  "bg-green-500/10 text-green-400 border border-green-500/20"
                }`}>
                  {selectedNode.data?.risk === "red" ? "Critical" :
                   selectedNode.data?.risk === "yellow" ? "Warning" :
                   selectedNode.data?.risk === "blue" ? "Core" : "Safe"}
                </span>
                <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase mt-1">{selectedNode.data?.layer}</span>
              </div>
            </div>

            {detailsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500 text-xs font-bold">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                Analyzing Node Context...
              </div>
            ) : nodeDetails ? (
              <div className="space-y-4 text-xs font-semibold leading-relaxed text-zinc-305 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
                <div>
                  <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">Purpose</span>
                  <p className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/50 text-zinc-400">{nodeDetails.purpose}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">Dependencies ({nodeDetails.imports?.length || 0})</span>
                    <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto custom-scrollbar">
                      {nodeDetails.imports?.length > 0 ? (
                        nodeDetails.imports.map((i, idx) => (
                          <span key={idx} className="bg-zinc-950 text-indigo-400 font-mono text-[8px] px-1.5 py-0.5 rounded border border-zinc-850">{i}</span>
                        ))
                      ) : (
                        <span className="text-zinc-600 italic text-[9px]">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">Connected Files ({nodeDetails.connected_nodes?.length || 0})</span>
                    <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto custom-scrollbar">
                      {nodeDetails.connected_nodes?.length > 0 ? (
                        nodeDetails.connected_nodes.map((c, idx) => (
                          <span key={idx} className="bg-zinc-950 text-zinc-400 font-mono text-[8px] px-1.5 py-0.5 rounded border border-zinc-850">{c.split(/[/\\]/).pop()}</span>
                        ))
                      ) : (
                        <span className="text-zinc-600 italic text-[9px]">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">Security Notes</span>
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    selectedNode.data?.risk === "red" ? "bg-red-950/20 border-red-900/50 text-red-400" :
                    selectedNode.data?.risk === "yellow" ? "bg-yellow-950/20 border-yellow-900/50 text-yellow-400" :
                    "bg-zinc-950/40 border-zinc-850/50 text-zinc-400"
                  }`}>
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-tight">{nodeDetails.security_notes}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">Change Impact Analysis</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-950/50 p-1.5 rounded-xl border border-zinc-850">
                      <span className="text-[8px] text-zinc-500 block leading-tight">Affected Files</span>
                      <span className="text-xs font-black text-white font-mono">{nodeDetails.impact_analysis?.affected_files || 0}</span>
                    </div>
                    <div className="bg-zinc-950/50 p-1.5 rounded-xl border border-zinc-850">
                      <span className="text-[8px] text-zinc-500 block leading-tight">Affected APIs</span>
                      <span className="text-xs font-black text-indigo-400 font-mono">{nodeDetails.impact_analysis?.affected_apis || 0}</span>
                    </div>
                    <div className="bg-zinc-950/50 p-1.5 rounded-xl border border-zinc-850">
                      <span className="text-[8px] text-zinc-500 block leading-tight">Affected Services</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">{nodeDetails.impact_analysis?.affected_services || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-550 font-bold block uppercase mb-1">AI Architecture Summary</span>
                  <p className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/50 text-zinc-400 text-[10.5px]">
                    The module <span className="font-mono text-indigo-400">{selectedNode.data?.label}</span> serves as a crucial <span className="text-zinc-200">{nodeDetails.role}</span> component within the <span className="text-zinc-200">{selectedNode.data?.layer}</span>. It acts as an integration point for system interactions, facilitating key operations while adhering to safety limits.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-zinc-500 text-xs text-center font-bold">Failed to load node intelligence.</div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl text-center py-16 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <Info className="w-8 h-8 text-zinc-650 animate-pulse" />
            <h4 className="font-bold text-sm text-zinc-400">No Node Selected</h4>
            <p className="text-xs leading-relaxed text-zinc-500 max-w-[200px] mx-auto">Click any node in the graph or select a file from the tree to view intelligence details.</p>
          </div>
        )}

        {/* AI Repository Copilot chat */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl flex flex-col h-[320px] overflow-hidden shadow-2xl">
          <div className="p-4 bg-zinc-900/30 border-b border-zinc-800/80 flex items-center gap-2 shrink-0">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">Repository Copilot</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatLog.map((log, idx) => (
              <div key={idx} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow ${
                  log.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-tl-none"
                }`}>
                  <div className="whitespace-pre-line">{log.text}</div>
                  {log.sources && log.sources.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-zinc-800/80 text-[9px] text-zinc-500 flex flex-wrap gap-1 font-mono">
                      Sources: {log.sources.map((src, sIdx) => (
                        <span key={sIdx} className="text-indigo-400 px-1 bg-zinc-900 rounded">{src.split(/[/\\]/).pop()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl rounded-tl-none px-4 py-2.5 text-zinc-500 flex items-center gap-2 text-xs font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  Analyzing context...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-850 bg-zinc-950/20 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-grow py-2 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-semibold placeholder-zinc-700 font-sans"
                placeholder={selectedNode ? `Ask about ${selectedNode.data?.label}...` : "Ask about system architecture..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChat();
                }}
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !query.trim()}
                className="p-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-650/15"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RepoDashboard({ data }) {
  const repoData = data?.github_platform || data;
  if (!repoData || !repoData.scores) return null;

  const [activeTab, setActiveTab] = useState("intelligence"); // intelligence, review_queue, tasks
  const [reviewQueue, setReviewQueue] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  const fetchQueue = async () => {
      setQueueLoading(true);
      try {
          const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${BASE_URL}/api/v1/github/governance/queue`);
          const d = await res.json();
          setReviewQueue(d.queue || []);
      } catch(e) {}
      setQueueLoading(false);
  };

  const fetchTasks = async () => {
      setTasksLoading(true);
      try {
          const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${BASE_URL}/api/v1/github/governance/tasks`);
          const d = await res.json();
          setTasks(d.tasks || []);
      } catch(e) {}
      setTasksLoading(false);
  };

  useEffect(() => {
      if (activeTab === "review_queue") fetchQueue();
      if (activeTab === "tasks") fetchTasks();
  }, [activeTab]);

  const handleDecision = async (id, decision) => {
      try {
          const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          await fetch(`${BASE_URL}/api/v1/github/governance/review`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ finding_id: id, reviewer: "Admin", decision, notes: "" })
          });
          fetchQueue();
      } catch (e) {}
  };

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  const radarData = [
    { subject: 'Arch', score: repoData.scores.architecture },
    { subject: 'Maint', score: repoData.scores.maintainability },
    { subject: 'Deps', score: repoData.scores.dependencies },
    { subject: 'Mod', score: repoData.scores.modularity },
    { subject: 'Scale', score: repoData.scores.scalability },
    { subject: 'Sec', score: repoData.scores.security },
    { subject: 'Test', score: repoData.scores.testing },
    { subject: 'Perf', score: repoData.scores.performance },
  ];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL copied to clipboard!");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(repoData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repoData.repository_overview.name}-audit.json`;
    a.click();
  };

  const handleExportCSV = () => {
    let csv = "Metric,Value\n";
    csv += `Repository,${repoData.repository_overview.name}\n`;
    csv += `Files Scanned,${repoData.kpis.files_scanned}\n`;
    csv += `Overall Health,${repoData.scores.overall}\n`;
    csv += `Architecture,${repoData.scores.architecture}\n`;
    csv += `Security,${repoData.scores.security}\n`;
    csv += `Technical Debt Level,${repoData.technical_debt.level}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repoData.repository_overview.name}-audit.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 pb-20 mt-4">
      
      {/* 0. TAB NAVIGATION */}
      <div className="flex gap-4 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl w-max">
          <button onClick={() => setActiveTab("intelligence")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "intelligence" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Intelligence Dashboard</button>
          <button onClick={() => setActiveTab("review_queue")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "review_queue" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Review Queue <span className="bg-blue-500/20 px-2 rounded-full text-xs">New</span></button>
          <button onClick={() => setActiveTab("tasks")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "tasks" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Developer Tasks <span className="bg-purple-500/20 px-2 rounded-full text-xs">New</span></button>
          <button onClick={() => setActiveTab("copilot")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "copilot" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Repository Digital Twin <span className="bg-indigo-500/20 px-2 rounded-full text-xs text-indigo-400">Enterprise</span></button>
      </div>

      {activeTab === "review_queue" && (
          <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl min-h-[600px] animate-in fade-in">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-blue-400"/> Governance Review Queue</h2>
              {queueLoading ? (
                  <p className="text-zinc-500 animate-pulse">Loading AI Findings...</p>
              ) : reviewQueue.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                      <h3 className="text-xl font-bold">Queue is Empty</h3>
                      <p>All repository findings have been reviewed.</p>
                  </div>
              ) : (
                  <div className="grid gap-6">
                      {reviewQueue.map(f => (
                          <div key={f.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${f.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : f.severity === 'High' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{f.severity}</span>
                                      <span className="text-xs text-zinc-500 font-mono">{f.id}</span>
                                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{f.finding_type}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-zinc-200 mb-2">{f.title}</h3>
                                  <p className="text-sm text-zinc-400 mb-4">{f.ai_reasoning}</p>
                                  <div className="text-xs text-zinc-500 grid grid-cols-2 gap-2">
                                      <div><span className="font-bold">Team:</span> {f.assigned_team}</div>
                                      <div><span className="font-bold">Confidence:</span> {(f.confidence_score*100).toFixed(0)}%</div>
                                      <div className="col-span-2"><span className="font-bold">Impact:</span> {f.business_impact}</div>
                                  </div>
                              </div>
                              <div className="flex flex-row md:flex-col gap-3 justify-center shrink-0">
                                  <button onClick={() => handleDecision(f.id, "APPROVE")} className="flex items-center justify-center gap-2 px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 font-bold rounded-lg transition"><Check className="w-4 h-4"/> Approve</button>
                                  <button onClick={() => handleDecision(f.id, "REJECT")} className="flex items-center justify-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold rounded-lg transition"><XCircle className="w-4 h-4"/> False Positive</button>
                                  <button onClick={() => handleDecision(f.id, "ESCALATE")} className="flex items-center justify-center gap-2 px-6 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 font-bold rounded-lg transition"><AlertOctagon className="w-4 h-4"/> Escalate</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === "tasks" && (
          <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl min-h-[600px] animate-in fade-in">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Layers className="w-6 h-6 text-purple-400"/> Developer Task Center</h2>
              {tasksLoading ? (
                  <p className="text-zinc-500 animate-pulse">Loading Tasks...</p>
              ) : tasks.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                      <h3 className="text-xl font-bold">No Active Tasks</h3>
                      <p>No findings have been approved for development yet.</p>
                  </div>
              ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {tasks.map(t => (
                          <div key={t.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="text-xs font-bold text-zinc-500 font-mono">{t.id}</div>
                                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300">{t.status}</span>
                              </div>
                              <h3 className="text-sm font-bold text-zinc-300 mb-2 truncate">Refactor: Finding {t.finding_id.substring(0,8)}</h3>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2"><User className="w-3 h-3"/> {t.assigned_team}</div>
                              <div className="flex items-center gap-2 text-xs text-orange-400/80 mb-4"><Calendar className="w-3 h-3"/> SLA Deadline: {new Date(t.eta * 1000).toLocaleDateString()}</div>
                              <button className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold text-xs rounded-lg transition border border-purple-500/20">Open in Jira</button>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === "copilot" && (
          <RepoCopilotGraph repoData={repoData} />
      )}

      {/* 1. REPOSITORY HEADER & EXPORT CENTER */}
      {activeTab === "intelligence" && (
        <>
          <motion.div variants={itemVars} className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <FolderGit2 className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100">{repoData.repository_overview.name}</h1>
            <p className="text-zinc-400 text-sm mb-2">by {repoData.repository_overview.owner}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1 text-yellow-500/90"><Star className="w-3.5 h-3.5"/> {repoData.repository_overview.stars}</span>
              <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5"/> {repoData.repository_overview.forks}</span>
              <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5"/> {repoData.repository_overview.branch}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Last Commit: {repoData.repository_overview.last_updated.split('T')[0]}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-bold border ${repoData.repository_overview.status === 'Healthy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{repoData.repository_overview.status}</span>
              <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-bold border border-zinc-700">{repoData.repository_overview.visibility}</span>
              <span className="text-zinc-500 text-[10px] ml-2">Scan: {repoData.repository_overview.scan_duration}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 border-none print:hidden">
          <button onClick={handleShare} className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition border border-zinc-700/50"><Share2 className="w-3.5 h-3.5"/> Share</button>
          <button onClick={handleExportJSON} className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition border border-zinc-700/50"><FileJson className="w-3.5 h-3.5"/> JSON</button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition border border-zinc-700/50"><FileText className="w-3.5 h-3.5"/> CSV</button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20"><Download className="w-4 h-4"/> Export PDF</button>
        </div>
      </motion.div>

      {/* 2. SMART KPI BAR */}
      <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Files Scanned", v: repoData.kpis.files_scanned, c: "text-blue-400" },
          { label: "Critical Risks", v: repoData.kpis.critical_risks, c: "text-red-500" },
          { label: "Medium Risks", v: repoData.kpis.medium_risks, c: "text-orange-400" },
          { label: "Unused Files", v: repoData.kpis.unused_files, c: "text-zinc-400" },
          { label: "Duplicate Code", v: repoData.kpis.duplicate_code, c: "text-yellow-500" },
          { label: "Coverage", v: repoData.kpis.test_coverage, c: "text-green-400" },
          { label: "Priority Tasks", v: repoData.kpis.open_recommendations, c: "text-indigo-400" }
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center">
             <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{kpi.label}</div>
             <div className={`text-xl font-black ${kpi.c}`}>{kpi.v}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. SYSTEMS HEALTH MAP */}
        <motion.div variants={itemVars} className="lg:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Systems Health Map</h2>
          <div className="h-[220px] w-full relative z-10 -ml-4">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize:'12px' }} itemStyle={{color:'#818cf8'}} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
          </div>
          <div className="flex flex-col items-center justify-center mt-2 relative z-10 group overflow-visible">
             <ScoreGauge score={repoData.scores.overall} label="Command Score" />
             <div className="text-[10px] text-zinc-400 mt-2 text-center max-w-[200px] leading-relaxed">
               Comprehensive health index aggregating architecture, maintainability, and risk vectors.
             </div>
          </div>
        </motion.div>

        {/* 4. AI EXECUTIVE SUMMARY */}
        <motion.div variants={itemVars} className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 to-zinc-900/80 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center">
           <Zap className="absolute top-4 right-4 w-48 h-48 text-indigo-500/5 rotate-12 pointer-events-none" />
           <div className="relative z-10">
               <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Zap className="w-4 h-4"/> AI Executive Consultant Summary</h2>
               <div className="bg-zinc-950/50 border border-indigo-500/10 p-5 rounded-xl shadow-inner">
                  <p className="text-zinc-300 text-sm leading-loose tracking-wide">{repoData.summary.text}</p>
               </div>
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. CODE ARCHITECTURE */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col">
           <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-400"/> Architecture Intelligence</h2>
           
           <div className="flex gap-4 mb-4 bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30">
              <div className="flex-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Detected Pattern</div>
                 <div className="text-lg font-black text-purple-400">{repoData.architecture.type}</div>
              </div>
              <div className="w-px bg-zinc-700"></div>
              <div className="flex-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Architecture Score</div>
                 <div className="text-lg font-black text-white">{repoData.architecture.score}/100</div>
              </div>
           </div>

           <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl mb-4">
              <p className="text-xs text-zinc-400 leading-relaxed">{repoData.architecture.explanation}</p>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="space-y-2">
                 <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-2">Platform Strengths</h3>
                 {repoData.architecture.strengths?.map((s,i) => <div key={i} className="text-[11px] text-zinc-300 flex gap-1.5"><ShieldCheck className="w-3 h-3 text-green-500/50 shrink-0 mt-0.5"/> <span>{s}</span></div>)}
              </div>
              <div className="space-y-2">
                 <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Structural Weaknesses</h3>
                 {repoData.architecture.issues?.map((w,i) => <div key={i} className="text-[11px] text-zinc-300 flex gap-1.5"><AlertTriangle className="w-3 h-3 text-red-500/50 shrink-0 mt-0.5"/> <span>{w}</span></div>)}
              </div>
           </div>
        </motion.div>

        {/* 6. RECOMMENDATIONS ENGINE */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
           <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Consultant Action Roadmap</h2>
           <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
             {repoData.recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} />
             ))}
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 7. CRITICAL TARGET FILES */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
           <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-400"/> Critical Target Files</h2>
           <div className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              These specific files have been flagged by the AI for rigorous code review due to their structural role in maintaining system safety, deployment flow, or access governance.
           </div>
           <div className="space-y-4">
             {repoData.critical_files?.map((cf, i) => (
                <div key={i} className="border-l-2 border-orange-500 bg-zinc-800/40 p-3.5 rounded-r-lg group">
                  <div className="flex justify-between items-center mb-1.5">
                     <div className="text-xs font-mono font-bold text-orange-300 truncate" title={cf.file}>{cf.file}</div>
                     <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${cf.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>{cf.severity}</span>
                  </div>
                  <div className="text-[11px] text-zinc-300 mb-2 leading-relaxed">{cf.reason} <span className="block mt-1 text-zinc-500 italic">Expected Fix: {cf.fix}</span></div>
                  <div className="flex justify-between items-center text-[9px] uppercase font-bold text-zinc-500">
                     <span>Owner: {cf.owner}</span>
                  </div>
                </div>
             ))}
           </div>
        </motion.div>

        {/* 10. SECURITY INSIGHTS & 11. TESTING */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-red-500">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Security Insights</h2>
              <div className="space-y-4">
                 {repoData.security_insights?.map((sec, i)=>(
                    <div key={i} className="flex flex-col gap-2 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                      <div className="flex items-start gap-2">
                         <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${sec.severity==='Critical'?'bg-red-500' : 'bg-orange-500'}`}></span>
                         <div>
                            <span className="text-[11px] font-bold text-zinc-200 block mb-1">{sec.issue}</span>
                            <span className="text-[10px] text-zinc-400 leading-relaxed block">{sec.impact}</span>
                         </div>
                      </div>
                    </div>
                 ))}
                 {repoData.security_insights?.length === 0 && <div className="text-xs text-zinc-500 italic">No heuristic security concerns detected in target boundaries.</div>}
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-green-500">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Testing Posture</h2>
                 <span className="text-xs font-black bg-green-500/10 text-green-400 px-2 py-1 rounded">{repoData.testing_health.coverage}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">{repoData.testing_health.explanation}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-zinc-800/40 p-2 rounded-lg text-center border border-zinc-700/30">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Test Suites</div>
                    <div className="text-lg font-bold text-zinc-200">{repoData.testing_health.test_files}</div>
                 </div>
                 <div className="bg-zinc-800/40 p-2 rounded-lg text-center border border-zinc-700/30">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Missing Mocks</div>
                    <div className="text-lg font-bold text-red-400">{repoData.testing_health.missing_tests.length}</div>
                 </div>
              </div>
              <div>
                 <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 flex items-center gap-1">Critical Untested Flows</div>
                 {repoData.testing_health.critical_untested?.map((un,i)=><div key={i} className="text-[10px] text-red-300 bg-red-500/10 px-2 py-1 inline-block rounded border border-red-500/20">{un}</div>)}
              </div>
           </div>
        </motion.div>

        {/* 13. TECHNICAL DEBT & 9. CLEANUP */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-yellow-500">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Technical Debt</h2>
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/50 mb-4">
                 <p className="text-[11px] text-zinc-400 leading-relaxed">{repoData.technical_debt.explanation}</p>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Aggregated Debt Level</span><span className="font-bold text-yellow-500 px-2 py-0.5 bg-yellow-500/10 rounded">{repoData.technical_debt.level}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Detected Duplications</span><span className="font-bold text-zinc-200">{repoData.technical_debt.duplications}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Flow Complexity</span><span className="font-bold text-zinc-200">{repoData.technical_debt.complexity}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Legacy Marker Load</span><span className="font-bold text-zinc-200">{repoData.technical_debt.legacy_code}</span></div>
                 <div className="mt-4 flex justify-between items-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Est. Stabilization Time</span>
                    <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{repoData.technical_debt.estimated_time}</span>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-zinc-500">
              <div className="flex justify-between items-start mb-4">
                 <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Artifact Cleanup Center</h2>
                 <span className="text-[10px] font-black tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">{repoData.cleanup.estimated_reduction} Savings</span>
              </div>
              <div className="space-y-2">
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Unused Source Files</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{repoData.cleanup.unused_files?.length || 0}</span></div>
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Dead Library Imports</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{repoData.cleanup.unused_imports}</span></div>
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Duplicate Util Functions</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{repoData.cleanup.duplicate_utils?.length || 0}</span></div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* BOTTOM WIDE PANELS (12. IMPACT, 8. DEPENDENCY, 14. TIMELINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

         {/* Change Impact & Timeline */}
         <motion.div variants={itemVars} className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
               <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Branch Impact Analysis</h2>
               
               <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{repoData.change_impact.explanation}</p>
               
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800/40 p-3 rounded-lg flex flex-col justify-center items-center border border-zinc-700/30">
                     <div className="text-2xl font-black text-blue-400">{repoData.change_impact.changed_files}</div>
                     <div className="text-[9px] uppercase text-zinc-500 font-bold text-center mt-1">Files Mutated</div>
                  </div>
                  <div className="bg-red-500/5 p-3 rounded-lg flex flex-col justify-center items-center border border-red-500/10">
                     <div className="text-2xl font-black text-red-500">{repoData.change_impact.high_risk_files}</div>
                     <div className="text-[9px] uppercase text-red-500/70 font-bold text-center mt-1">High Risk Intersects</div>
                  </div>
               </div>
               <div className="text-[9px] uppercase font-bold text-zinc-500 mb-2 tracking-wider">Business Flows Affected</div>
               <div className="flex flex-wrap gap-2">
                  {repoData.change_impact.business_flows_affected?.map((f,i)=><span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{f}</span>)}
               </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIvPjwvc3ZnPg==')]">
               <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-5">Execution Registry</h2>
               <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-zinc-800/80">
                  {repoData.timeline?.map((step, i) => (
                     <div key={i} className="flex gap-4 relative z-10 items-center">
                        <div className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-400 flex shrink-0" />
                        <div className="text-[11px] text-zinc-300">{step.step}</div>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>

         {/* Dependency Graph Visualization */}
         <motion.div variants={itemVars} className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
             <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Module Dependency Mapping</h2>
             <p className="text-[11px] text-zinc-400 mb-4 max-w-xl">
               Live topology scan mapping structural constraints and logical dependencies between detected active internal modules.
             </p>
             
             <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-6 flex flex-col justify-center gap-6 custom-scrollbar overflow-x-auto min-h-[200px]">
                 {repoData.relationships.dependency_map?.map((rel, i) => (
                    <div key={i} className="flex items-center gap-3 min-w-max mx-auto">
                       <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono px-4 py-2 rounded-lg shadow-lg">{rel.from}</div>
                       <div className="flex items-center">
                          <div className="h-px w-10 bg-indigo-500/50 relative"></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                          <div className="h-px w-10 bg-indigo-500/50 relative"></div>
                       </div>
                       <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono px-4 py-2 rounded-lg shadow-lg">{rel.to}</div>
                    </div>
                 ))}
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-red-500 mb-2 tracking-wider">Circular Dependencies</div>
                    {repoData.relationships.circular_dependencies?.length > 0 
                      ? repoData.relationships.circular_dependencies.map((c, i)=><div key={i} className="text-xs font-mono text-red-400">{c}</div>)
                      : <div className="text-xs text-green-500/80 flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> No Circular Logic Detected</div>}
                 </div>
                 <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-orange-400 mb-2 tracking-wider">Shared Risky Utilities</div>
                    {repoData.relationships.risky_utilities?.map((ru, i)=><div key={i} className="text-[11px] font-mono text-orange-300">{ru}</div>)}
                    {repoData.relationships.risky_utilities?.length === 0 && <div className="text-[11px] text-zinc-500 italic">No risky external utilities detected in core flow.</div>}
                 </div>
             </div>
         </motion.div>

      </div>

        </>
      )}
    </motion.div>
  );
}
