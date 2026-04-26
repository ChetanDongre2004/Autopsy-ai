import { motion } from "framer-motion";
import ScoreGauge from "./ScoreGauge";
import { FolderGit2, Star, GitFork, Clock, Activity, ShieldAlert, GitBranch, Share2, Download, FileJson, FileText, Zap, Layers, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import RecommendationCard from "./RecommendationCard";

export default function RepoDashboard({ data }) {
  if (!data || !data.scores) return null;

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  const radarData = [
    { subject: 'Arch', score: data.scores.architecture },
    { subject: 'Maint', score: data.scores.maintainability },
    { subject: 'Deps', score: data.scores.dependencies },
    { subject: 'Mod', score: data.scores.modularity },
    { subject: 'Scale', score: data.scores.scalability },
    { subject: 'Sec', score: data.scores.security },
    { subject: 'Test', score: data.scores.testing },
    { subject: 'Perf', score: data.scores.performance },
  ];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL copied to clipboard!");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.repository_overview.name}-audit.json`;
    a.click();
  };

  const handleExportCSV = () => {
    let csv = "Metric,Value\n";
    csv += `Repository,${data.repository_overview.name}\n`;
    csv += `Files Scanned,${data.kpis.files_scanned}\n`;
    csv += `Overall Health,${data.scores.overall}\n`;
    csv += `Architecture,${data.scores.architecture}\n`;
    csv += `Security,${data.scores.security}\n`;
    csv += `Technical Debt Level,${data.technical_debt.level}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.repository_overview.name}-audit.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 pb-20 mt-4">
      
      {/* 1. REPOSITORY HEADER & EXPORT CENTER */}
      <motion.div variants={itemVars} className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <FolderGit2 className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100">{data.repository_overview.name}</h1>
            <p className="text-zinc-400 text-sm mb-2">by {data.repository_overview.owner}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1 text-yellow-500/90"><Star className="w-3.5 h-3.5"/> {data.repository_overview.stars}</span>
              <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5"/> {data.repository_overview.forks}</span>
              <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5"/> {data.repository_overview.branch}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Last Commit: {data.repository_overview.last_updated.split('T')[0]}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-bold border ${data.repository_overview.status === 'Healthy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{data.repository_overview.status}</span>
              <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-bold border border-zinc-700">{data.repository_overview.visibility}</span>
              <span className="text-zinc-500 text-[10px] ml-2">Scan: {data.repository_overview.scan_duration}</span>
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
          { label: "Files Scanned", v: data.kpis.files_scanned, c: "text-blue-400" },
          { label: "Critical Risks", v: data.kpis.critical_risks, c: "text-red-500" },
          { label: "Medium Risks", v: data.kpis.medium_risks, c: "text-orange-400" },
          { label: "Unused Files", v: data.kpis.unused_files, c: "text-zinc-400" },
          { label: "Duplicate Code", v: data.kpis.duplicate_code, c: "text-yellow-500" },
          { label: "Coverage", v: data.kpis.test_coverage, c: "text-green-400" },
          { label: "Priority Tasks", v: data.kpis.open_recommendations, c: "text-indigo-400" }
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
             <ScoreGauge score={data.scores.overall} label="Command Score" />
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
                  <p className="text-zinc-300 text-sm leading-loose tracking-wide">{data.summary.text}</p>
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
                 <div className="text-lg font-black text-purple-400">{data.architecture.type}</div>
              </div>
              <div className="w-px bg-zinc-700"></div>
              <div className="flex-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Architecture Score</div>
                 <div className="text-lg font-black text-white">{data.architecture.score}/100</div>
              </div>
           </div>

           <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl mb-4">
              <p className="text-xs text-zinc-400 leading-relaxed">{data.architecture.explanation}</p>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="space-y-2">
                 <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-2">Platform Strengths</h3>
                 {data.architecture.strengths?.map((s,i) => <div key={i} className="text-[11px] text-zinc-300 flex gap-1.5"><ShieldCheck className="w-3 h-3 text-green-500/50 shrink-0 mt-0.5"/> <span>{s}</span></div>)}
              </div>
              <div className="space-y-2">
                 <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Structural Weaknesses</h3>
                 {data.architecture.issues?.map((w,i) => <div key={i} className="text-[11px] text-zinc-300 flex gap-1.5"><AlertTriangle className="w-3 h-3 text-red-500/50 shrink-0 mt-0.5"/> <span>{w}</span></div>)}
              </div>
           </div>
        </motion.div>

        {/* 6. RECOMMENDATIONS ENGINE */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
           <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Consultant Action Roadmap</h2>
           <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
             {data.recommendations?.map((rec, i) => (
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
             {data.critical_files?.map((cf, i) => (
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
                 {data.security_insights?.map((sec, i)=>(
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
                 {data.security_insights?.length === 0 && <div className="text-xs text-zinc-500 italic">No heuristic security concerns detected in target boundaries.</div>}
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-green-500">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Testing Posture</h2>
                 <span className="text-xs font-black bg-green-500/10 text-green-400 px-2 py-1 rounded">{data.testing_health.coverage}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">{data.testing_health.explanation}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-zinc-800/40 p-2 rounded-lg text-center border border-zinc-700/30">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Test Suites</div>
                    <div className="text-lg font-bold text-zinc-200">{data.testing_health.test_files}</div>
                 </div>
                 <div className="bg-zinc-800/40 p-2 rounded-lg text-center border border-zinc-700/30">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Missing Mocks</div>
                    <div className="text-lg font-bold text-red-400">{data.testing_health.missing_tests.length}</div>
                 </div>
              </div>
              <div>
                 <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 flex items-center gap-1">Critical Untested Flows</div>
                 {data.testing_health.critical_untested?.map((un,i)=><div key={i} className="text-[10px] text-red-300 bg-red-500/10 px-2 py-1 inline-block rounded border border-red-500/20">{un}</div>)}
              </div>
           </div>
        </motion.div>

        {/* 13. TECHNICAL DEBT & 9. CLEANUP */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-yellow-500">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Technical Debt</h2>
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/50 mb-4">
                 <p className="text-[11px] text-zinc-400 leading-relaxed">{data.technical_debt.explanation}</p>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Aggregated Debt Level</span><span className="font-bold text-yellow-500 px-2 py-0.5 bg-yellow-500/10 rounded">{data.technical_debt.level}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Detected Duplications</span><span className="font-bold text-zinc-200">{data.technical_debt.duplications}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Flow Complexity</span><span className="font-bold text-zinc-200">{data.technical_debt.complexity}</span></div>
                 <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/50"><span className="text-zinc-500">Legacy Marker Load</span><span className="font-bold text-zinc-200">{data.technical_debt.legacy_code}</span></div>
                 <div className="mt-4 flex justify-between items-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Est. Stabilization Time</span>
                    <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{data.technical_debt.estimated_time}</span>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex-1 border-t-4 border-t-zinc-500">
              <div className="flex justify-between items-start mb-4">
                 <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Artifact Cleanup Center</h2>
                 <span className="text-[10px] font-black tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">{data.cleanup.estimated_reduction} Savings</span>
              </div>
              <div className="space-y-2">
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Unused Source Files</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{data.cleanup.unused_files?.length || 0}</span></div>
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Dead Library Imports</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{data.cleanup.unused_imports}</span></div>
                 <div className="text-xs flex justify-between items-center bg-zinc-800/30 p-2 rounded border border-zinc-800/50"><span className="text-zinc-500">Duplicate Util Functions</span><span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">{data.cleanup.duplicate_utils?.length || 0}</span></div>
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
               
               <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{data.change_impact.explanation}</p>
               
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800/40 p-3 rounded-lg flex flex-col justify-center items-center border border-zinc-700/30">
                     <div className="text-2xl font-black text-blue-400">{data.change_impact.changed_files}</div>
                     <div className="text-[9px] uppercase text-zinc-500 font-bold text-center mt-1">Files Mutated</div>
                  </div>
                  <div className="bg-red-500/5 p-3 rounded-lg flex flex-col justify-center items-center border border-red-500/10">
                     <div className="text-2xl font-black text-red-500">{data.change_impact.high_risk_files}</div>
                     <div className="text-[9px] uppercase text-red-500/70 font-bold text-center mt-1">High Risk Intersects</div>
                  </div>
               </div>
               <div className="text-[9px] uppercase font-bold text-zinc-500 mb-2 tracking-wider">Business Flows Affected</div>
               <div className="flex flex-wrap gap-2">
                  {data.change_impact.business_flows_affected?.map((f,i)=><span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{f}</span>)}
               </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIvPjwvc3ZnPg==')]">
               <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-5">Execution Registry</h2>
               <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-zinc-800/80">
                  {data.timeline?.map((step, i) => (
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
                 {data.relationships.dependency_map?.map((rel, i) => (
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
                    {data.relationships.circular_dependencies?.length > 0 
                      ? data.relationships.circular_dependencies.map((c, i)=><div key={i} className="text-xs font-mono text-red-400">{c}</div>)
                      : <div className="text-xs text-green-500/80 flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> No Circular Logic Detected</div>}
                 </div>
                 <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-orange-400 mb-2 tracking-wider">Shared Risky Utilities</div>
                    {data.relationships.risky_utilities?.map((ru, i)=><div key={i} className="text-[11px] font-mono text-orange-300">{ru}</div>)}
                    {data.relationships.risky_utilities?.length === 0 && <div className="text-[11px] text-zinc-500 italic">No risky external utilities detected in core flow.</div>}
                 </div>
             </div>
         </motion.div>

      </div>

    </motion.div>
  );
}
