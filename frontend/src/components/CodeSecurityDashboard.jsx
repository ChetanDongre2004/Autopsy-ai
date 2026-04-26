import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, ShieldCheck, Activity, Search, Filter, 
  Key, Lock, Server, FileText, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Github, FileCode2, Package, CheckCircle2, XCircle, Clock, Users, Zap
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const getSeverityColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
};

const getSeverityIconColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    default: return 'text-blue-500';
  }
};

export default function CodeSecurityDashboard({ data }) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const [expandedSast, setExpandedSast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [remediationPlan, setRemediationPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
     setToastMessage(msg);
     setTimeout(() => setToastMessage(""), 4000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/security/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Autopsy_AI_Security_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("PDF Report Successfully Downloaded!");
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    }
    setIsExporting(false);
  };

  const handleRemediateAll = async () => {
    setIsRemediating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/security/remediate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      if (!res.ok) throw new Error("Failed to build remediation plan");
      const json = await res.json();
      setRemediationPlan(json);
      showToast("Master Action Plan successfully generated!");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setIsRemediating(false);
  };

  if (!data || !data.security_platform) return null;
  const sec = data.security_platform;
  
  // Recharts Data mapping
  const severityData = [
    { name: 'Critical', value: sec.overview.critical, color: '#ef4444' },
    { name: 'High', value: sec.overview.high, color: '#f97316' },
    { name: 'Medium', value: sec.overview.medium, color: '#eab308' },
    { name: 'Low', value: sec.overview.low, color: '#3b82f6' }
  ];

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-10 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/20 p-8 lg:p-10 rounded-3xl border border-zinc-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.15)]"><ShieldCheck className="w-8 h-8 text-red-400" /></div>
             <h2 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tight">Security Intelligence Platform</h2>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-zinc-400">
             <span className="flex items-center gap-2"><Github className="w-4 h-4"/> Repository: <span className="text-zinc-200">project-name</span></span>
             <span className="flex items-center gap-2"><Lock className="w-4 h-4"/> Branch: <span className="text-zinc-200">main</span></span>
             <span className="flex items-center gap-2"><Clock className="w-4 h-4"/> Last Scan: <span className="text-zinc-200">Just Now</span></span>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 shrink-0">
          <button 
             onClick={handleExportPDF} disabled={isExporting}
             className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
             {isExporting ? <Clock className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5"/>} 
             {isExporting ? "Generating PDF..." : "Export PDF Report"}
          </button>
          
          <button 
             onClick={handleRemediateAll} disabled={isRemediating}
             className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition flex items-center gap-2 disabled:opacity-50"
          >
             {isRemediating ? <Activity className="w-5 h-5 animate-pulse"/> : <CheckCircle2 className="w-5 h-5"/>}
             {isRemediating ? "Analyzing Plan..." : "Remediate All"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="fixed top-8 right-8 z-50 bg-green-500 text-white px-6 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-3">
           <CheckCircle2 className="w-5 h-5"/> {toastMessage}
        </motion.div>
      )}

      {/* REMEDIATION DASHBOARD VIEW */}
      {remediationPlan ? (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
           <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-indigo-400">Master Action Plan</h2>
              <button onClick={() => setRemediationPlan(null)} className="text-zinc-400 hover:text-zinc-200 font-bold flex items-center gap-2"><XCircle className="w-5 h-5"/> Dismiss</button>
           </div>
           
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="text-xl font-bold mb-6 text-zinc-200">Automatically Generated Roadmap</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {remediationPlan.tasks.map((t, idx) => (
                    <div key={idx} className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 text-xs uppercase font-bold rounded ${getSeverityColor(t.priority)} border`}>{t.priority}</span>
                          <span className="text-sm font-bold text-zinc-500 flex items-center gap-1"><Users className="w-4 h-4"/> {t.team}</span>
                       </div>
                       <div className="font-bold text-lg text-zinc-200 mb-2">{t.task}</div>
                       <div className="text-zinc-400 text-sm mb-4 leading-relaxed">{t.instruction}</div>
                       {t.snippet && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto">
                             <div className="text-indigo-400/50 mb-1">Patch Fragment:</div>
                             {t.snippet}
                          </div>
                       )}
                       <div className="mt-4 flex gap-3">
                          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition">Assign Task</button>
                          <button className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold transition">Trigger Auto-PR</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </motion.div>
      ) : (
      <>
      {/* OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6">
         <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-center shadow-xl relative overflow-hidden">
            <div className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-3">Security Score</div>
            <div className={`text-6xl font-black ${sec.overview.score > 80 ? 'text-green-400' : 'text-orange-400'} mb-2`}>{sec.overview.score}</div>
            <div className="text-sm font-medium text-zinc-500">Industry Avg: 68</div>
         </div>
         
         <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-zinc-700 transition">
            <div className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-3">Total</div>
            <div className="text-4xl font-black text-zinc-200">{sec.overview.total_findings}</div>
         </div>
         <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-red-500/40 transition">
            <div className="text-red-400 font-bold uppercase tracking-widest text-xs mb-3">Critical</div>
            <div className="text-4xl font-black text-red-500">{sec.overview.critical}</div>
         </div>
         <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-orange-500/40 transition">
            <div className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-3">High</div>
            <div className="text-4xl font-black text-orange-500">{sec.overview.high}</div>
         </div>
         <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-yellow-500/40 transition">
            <div className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-3">Medium</div>
            <div className="text-4xl font-black text-yellow-500">{sec.overview.medium}</div>
         </div>
         <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-blue-500/40 transition">
            <div className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3">Low</div>
            <div className="text-4xl font-black text-blue-500">{sec.overview.low}</div>
         </div>
         <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl hover:border-green-500/40 transition">
            <div className="text-green-400 font-bold uppercase tracking-widest text-xs mb-3">Resolved</div>
            <div className="text-4xl font-black text-green-500">{sec.overview.resolved}</div>
         </div>
      </div>

      {/* MID SECTION: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center">
           <h3 className="w-full text-lg font-bold text-zinc-100 mb-4">Risk Distribution</h3>
           <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={severityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px'}} itemStyle={{color: '#fff'}} />
                  </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col justify-center">
           <h3 className="w-full text-lg font-bold text-zinc-100 mb-6 flex justify-between items-center">
              <span>Risk Remediation Progress</span>
              <span className="text-sm font-medium text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">ETA: +5 hrs to fix Critical</span>
           </h3>
           <div className="space-y-4">
              {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                 let count = sec.overview[sev.toLowerCase()];
                 let total = sec.overview.total_findings;
                 let pct = Math.max(5, (count / total) * 100);
                 return (
                   <div key={sev} className="w-full">
                     <div className="flex justify-between text-sm font-bold text-zinc-400 mb-2">
                       <span>{sev} Risks</span>
                       <span>{count} Open</span>
                     </div>
                     <div className="w-full bg-zinc-800 rounded-full h-3">
                       <div className={`h-3 rounded-full ${getSeverityColor(sev).split(' ')[0].replace('text-', 'bg-')}`} style={{width: `${pct}%`}}></div>
                     </div>
                   </div>
                 )
              })}
           </div>
        </div>
      </div>

      {/* CORE ENGINES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SAST Output */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SAST VULNERABILITY CENTER (Engine 1) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-4">
                 <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20"><FileCode2 className="w-6 h-6 text-indigo-400"/></div>
                 <h2 className="text-2xl font-bold text-zinc-100">Vulnerability Findings Center</h2>
              </div>
              <div className="flex items-center gap-3">
                 <button className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"><Search className="w-5 h-5 text-zinc-300"/></button>
                 <button className="flex items-center gap-2 px-4 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition text-zinc-300 font-bold text-sm"><Filter className="w-4 h-4"/> Filter by Severity</button>
              </div>
            </div>

            <div className="space-y-4">
              {sec.sast_findings.map((finding, idx) => (
                <div key={idx} className="border border-zinc-800 bg-zinc-950/40 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                   <div 
                     className="p-6 cursor-pointer hover:bg-zinc-800/40 transition flex items-center justify-between"
                     onClick={() => setExpandedSast(expandedSast === idx ? null : idx)}
                   >
                     <div className="flex items-center gap-4">
                        <AlertTriangle className={`w-6 h-6 ${getSeverityIconColor(finding.severity)} shrink-0`} />
                        <div>
                           <div className="text-xl font-bold text-zinc-200 mb-1">{finding.title} <span className="text-sm font-medium text-zinc-500 ml-2 bg-zinc-900 border border-zinc-700 px-2 rounded-md">{finding.category}</span></div>
                           <div className="flex items-center gap-3 text-sm font-medium">
                              <span className={`px-3 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider ${getSeverityColor(finding.severity)}`}>{finding.severity}</span>
                              <span className="text-zinc-500 flex items-center gap-1 font-mono"><FileCode2 className="w-4 h-4"/> {finding.file}:{finding.line}</span>
                           </div>
                        </div>
                     </div>
                     <button className="text-zinc-500 bg-zinc-800/50 p-2 rounded-full hover:bg-zinc-700 hover:text-white transition">
                       {expandedSast === idx ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                     </button>
                   </div>
                   
                   <AnimatePresence>
                     {expandedSast === idx && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-zinc-900/50 border-t border-zinc-800">
                         <div className="p-6 md:p-8 space-y-6">
                            
                            {/* AI Remediation details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4"/> Why Detected</div>
                                  <div className="text-base text-zinc-300 leading-relaxed">{finding.why}</div>
                               </div>
                               <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10">
                                  <div className="text-xs font-bold text-red-500/80 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Exploit Risk & Impact</div>
                                  <div className="text-base text-red-100 leading-relaxed">{finding.impact}</div>
                               </div>
                            </div>

                            {/* Remediation Steps Action Plan */}
                            <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20 relative">
                               <div className="absolute top-6 right-6">
                                  <span className="bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase px-3 py-1 rounded-full border border-indigo-500/30">AI Remediation Plan</span>
                               </div>
                               <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Recommended Fix Action</div>
                               <div className="text-lg text-indigo-100 font-medium mb-4">{finding.fix}</div>
                               
                               <div className="flex gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium"><Clock className="w-4 h-4"/> ETA: {finding.eta || '30 mins'}</div>
                                  <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium"><Users className="w-4 h-4"/> Owner: {finding.owner || 'Backend Team'}</div>
                               </div>

                               {finding.code_snippet && (
                                 <pre className="bg-zinc-950 p-4 rounded-xl text-sm font-mono text-zinc-300 border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                                   <code className="text-indigo-200">{finding.code_snippet}</code>
                                 </pre>
                               )}
                            </div>

                            {/* Learning Resources */}
                            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                               <div className="flex flex-col gap-2">
                                 <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Security Learning Resources</div>
                                 <div className="flex flex-wrap gap-2">
                                   {finding.resources.map((res, i) => (
                                     <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 transition rounded-lg text-zinc-300 font-medium text-sm border border-zinc-700">
                                       <ExternalLink className="w-3.5 h-3.5 text-indigo-400"/> {res.title}
                                     </a>
                                   ))}
                                 </div>
                               </div>
                               
                               <div className="flex gap-3">
                                  <button className="px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition text-sm font-bold">Create Jira Ticket</button>
                                  <button className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 rounded-lg transition text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Mark Resolved</button>
                               </div>
                            </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          
          {/* COMPLIANCE ENGINE */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/80">
                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20"><Activity className="w-5 h-5 text-green-500"/></div>
                <h3 className="text-xl font-bold text-zinc-100">Compliance & Policies Engine</h3>
             </div>
             <div className="flex flex-wrap gap-4">
                {sec.compliance.map((comp, i) => (
                  <div key={i} className="flex-1 min-w-[250px] bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                     <div>
                        <div className="text-zinc-200 font-bold mb-1">{comp.standard}</div>
                        <div className="text-zinc-500 text-sm font-medium">{comp.finding}</div>
                     </div>
                     <span className="text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">Violation</span>
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Engines */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* SECRETS ENGINE (Engine 2) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-500/10 rounded-lg"><Key className="w-4 h-4 text-yellow-500"/></div>
                   <h3 className="text-lg font-bold text-zinc-100">Secrets Scanner</h3>
                </div>
                <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded font-bold">{sec.secrets.length} Leaks</span>
             </div>
             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {sec.secrets.map((secret, i) => (
                  <div key={i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-bold text-zinc-200 text-sm">{secret.type}</span>
                       <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${getSeverityColor(secret.severity)}`}>{secret.severity}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mb-2 font-mono truncate"><FileText className="w-3 h-3 inline mr-1"/>{secret.file}</div>
                    <div className="bg-zinc-900 border border-red-500/30 text-red-300/80 text-xs font-mono p-2 rounded-lg line-clamp-1 mb-2 blur-[2px] hover:blur-none transition-all">{secret.line}</div>
                    <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Action: {secret.fix}</div>
                  </div>
                ))}
             </div>
           </div>

           {/* DEPENDENCY & CVE ENGINE (Engine 3) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/80">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-4 h-4 text-blue-500"/></div>
                <h3 className="text-lg font-bold text-zinc-100">Dependency Risk</h3>
             </div>
             <div className="space-y-3">
                {sec.dependencies.map((dep, i) => (
                  <div key={i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-1.5">
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-200 text-sm font-mono truncate">{dep.package}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityColor(dep.severity)}`}>{dep.severity}</span>
                     </div>
                     <div className="text-red-400 font-bold text-xs">{dep.risk}</div>
                     <div className="text-xs text-zinc-500 font-mono bg-zinc-900 p-2 rounded-md border border-zinc-800 mt-1">Fix: {dep.fix}</div>
                  </div>
                ))}
             </div>
           </div>

           {/* API SECURITY ENGINE (Engine 4) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/80">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Server className="w-4 h-4 text-purple-500"/></div>
                <h3 className="text-lg font-bold text-zinc-100">API Posture</h3>
             </div>
             <div className="space-y-3">
                {sec.api_security.map((api, i) => (
                  <div key={i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-200 text-sm">{api.issue}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityColor(api.severity)}`}>{api.severity}</span>
                     </div>
                     <div className="text-xs text-zinc-400 font-mono">{api.endpoint}</div>
                     <div className="text-xs font-semibold text-indigo-400 mt-1">{api.fix}</div>
                  </div>
                ))}
             </div>
           </div>
           
           {/* CONFIG SECURITY ENGINE (Engine 5) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/80">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500"/></div>
                <h3 className="text-lg font-bold text-zinc-100">Config Security</h3>
             </div>
             <div className="space-y-3">
                {sec.config_security ? sec.config_security.map((cfg, i) => (
                  <div key={i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-200 text-sm">{cfg.issue}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityColor(cfg.severity)}`}>{cfg.severity}</span>
                     </div>
                     <div className="text-xs text-zinc-400 font-mono truncate flex items-center gap-1"><FileCode2 className="w-3 h-3"/> {cfg.file}</div>
                  </div>
                )) : <div className="text-sm text-zinc-500">No dangerous configs detected.</div>}
             </div>
           </div>

        </div>
      </div>
      </>
      )}
    </motion.div>
  );
}

const ExternalLink = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
