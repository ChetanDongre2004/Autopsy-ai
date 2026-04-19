import { motion } from "framer-motion";
import ScoreGauge from "./ScoreGauge";
import RecommendationCard from "./RecommendationCard";
import { FolderGit2, Star, GitFork, Clock, Activity, ShieldAlert, GitBranch, Share2, Download, FileJson, FileText, Zap, Layers, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

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
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-10 pb-32 mt-8">
      
      {/* 1. REPOSITORY HEADER & EXPORT CENTER */}
      <motion.div variants={itemVars} className="flex flex-col xl:flex-row items-center justify-between gap-8 bg-zinc-900/60 p-8 md:p-10 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <FolderGit2 className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-heading text-zinc-100">{data.repository_overview.name}</h1>
            <p className="text-zinc-400 text-lg mb-4 mt-2 font-medium">by {data.repository_overview.owner}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-zinc-400 font-semibold">
              <span className="flex items-center gap-1.5 text-yellow-500"><Star className="w-4 h-4"/> {data.repository_overview.stars}</span>
              <span className="flex items-center gap-1.5"><GitFork className="w-4 h-4"/> {data.repository_overview.forks}</span>
              <span className="flex items-center gap-1.5"><GitBranch className="w-4 h-4"/> {data.repository_overview.branch}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> Last Commit: {data.repository_overview.last_updated.split('T')[0]}</span>
              <span>•</span>
              <span className={`px-3 py-1 rounded text-xs md:text-sm uppercase tracking-widest font-bold border ${data.repository_overview.status === 'Healthy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{data.repository_overview.status}</span>
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded text-xs md:text-sm uppercase tracking-widest font-bold border border-zinc-700">{data.repository_overview.visibility}</span>
              <span className="text-zinc-500 text-xs md:text-sm ml-2">Scan: {data.repository_overview.scan_duration}</span>
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
      <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5">
        {[
          { label: "Files Scanned", v: data.kpis.files_scanned, c: "text-blue-400" },
          { label: "Critical Risks", v: data.kpis.critical_risks, c: "text-red-500" },
          { label: "Medium Risks", v: data.kpis.medium_risks, c: "text-orange-400" },
          { label: "Unused Files", v: data.kpis.unused_files, c: "text-zinc-400" },
          { label: "Duplicate Code", v: data.kpis.duplicate_code, c: "text-yellow-500" },
          { label: "Coverage", v: data.kpis.test_coverage, c: "text-green-400" },
          { label: "Priority Tasks", v: data.kpis.open_recommendations, c: "text-indigo-400" }
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/60 p-6 min-h-[130px] rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 transition-transform">
             <div className="text-xs md:text-sm text-zinc-400 font-bold uppercase tracking-widest mb-3">{kpi.label}</div>
             <div className={`text-3xl lg:text-4xl font-black ${kpi.c}`}>{kpi.v}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. SYSTEMS HEALTH MAP */}
        <motion.div variants={itemVars} className="lg:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />
          <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-4">Systems Health Map</h2>
          <div className="h-[280px] w-full relative z-10 -ml-4">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#d4d4d8', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize:'14px' }} itemStyle={{color:'#818cf8'}} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
          </div>
          <div className="flex flex-col items-center justify-center mt-4 relative z-10 group overflow-visible">
             <ScoreGauge score={data.scores.overall} label="Command Score" />
             <div className="text-sm text-zinc-400 mt-4 text-center max-w-[280px] leading-relaxed">
               Comprehensive health index aggregating architecture, maintainability, and risk vectors.
             </div>
          </div>
        </motion.div>

        {/* 4. AI EXECUTIVE SUMMARY */}
        <motion.div variants={itemVars} className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 to-zinc-900/80 border border-indigo-500/30 rounded-3xl p-8 lg:p-12 relative overflow-hidden flex flex-col justify-center shadow-xl">
           <Zap className="absolute top-4 right-4 w-64 h-64 text-indigo-500/5 rotate-12 pointer-events-none" />
           <div className="relative z-10">
               <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-sm md:text-base mb-6 flex items-center gap-3"><Zap className="w-5 h-5"/> AI Executive Consultant Summary</h2>
               <div className="bg-zinc-950/50 border border-indigo-500/10 p-6 md:p-8 rounded-2xl shadow-inner">
                  <p className="text-zinc-200 text-base md:text-lg lg:text-xl leading-relaxed tracking-wide font-medium">{data.summary.text}</p>
               </div>
           </div>
        </motion.div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 5. CODE ARCHITECTURE */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-12 flex flex-col shadow-xl">
           <h2 className="text-base md:text-xl uppercase tracking-widest text-zinc-400 font-bold mb-8 flex items-center gap-3"><Layers className="w-6 h-6 text-purple-400"/> Architecture Intelligence</h2>
           
           <div className="flex gap-6 mb-6 bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/30">
              <div className="flex-1">
                 <div className="text-xs md:text-sm text-zinc-400 uppercase font-bold mb-2">Detected Pattern</div>
                 <div className="text-2xl md:text-3xl font-black text-purple-400">{data.architecture.type}</div>
              </div>
              <div className="w-px bg-zinc-700"></div>
              <div className="flex-1">
                 <div className="text-xs md:text-sm text-zinc-400 uppercase font-bold mb-2">Architecture Score</div>
                 <div className="text-2xl md:text-3xl font-black text-white">{data.architecture.score}/100</div>
              </div>
           </div>

           <div className="bg-zinc-950/40 border border-zinc-800/50 p-6 rounded-2xl mb-6">
              <p className="text-base md:text-lg text-zinc-300 leading-relaxed font-medium">{data.architecture.explanation}</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="space-y-3">
                 <h3 className="text-xs md:text-sm font-bold text-green-500 uppercase tracking-wider mb-4">Platform Strengths</h3>
                 {data.architecture.strengths?.map((s,i) => <div key={i} className="text-sm md:text-base text-zinc-300 flex gap-3 items-start"><ShieldCheck className="w-5 h-5 text-green-500/80 shrink-0 mt-0.5"/> <span>{s}</span></div>)}
              </div>
              <div className="space-y-3">
                 <h3 className="text-xs md:text-sm font-bold text-red-500 uppercase tracking-wider mb-4">Structural Weaknesses</h3>
                 {data.architecture.issues?.map((w,i) => <div key={i} className="text-sm md:text-base text-zinc-300 flex gap-3 items-start"><AlertTriangle className="w-5 h-5 text-red-500/80 shrink-0 mt-0.5"/> <span>{w}</span></div>)}
              </div>
           </div>
        </motion.div>

        {/* 6. RECOMMENDATIONS ENGINE */}
        <motion.div variants={itemVars} className="bg-transparent border-none">
           <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6 flex items-center gap-2">Consultant Action Roadmap</h2>
           <div className="space-y-6">
             {data.recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} />
             ))}
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 7. CRITICAL TARGET FILES */}
        <motion.div variants={itemVars} className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 shadow-xl">
           <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6 flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-orange-400"/> Critical Target Files</h2>
           <div className="text-base text-zinc-400 mb-6 leading-relaxed font-medium">
              These specific files have been flagged by the AI for rigorous code review due to their structural role in maintaining system safety, deployment flow, or access governance.
           </div>
           <div className="space-y-4">
             {data.critical_files?.map((cf, i) => (
                <div key={i} className="border-l-4 border-orange-500 bg-zinc-800/40 p-5 rounded-r-2xl group hover:bg-zinc-800/60 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                     <div className="text-sm md:text-base font-mono font-bold text-orange-300 truncate" title={cf.file}>{cf.file}</div>
                     <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${cf.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>{cf.severity}</span>
                  </div>
                  <div className="text-sm text-zinc-300 mb-3 leading-relaxed">{cf.reason} <span className="block mt-2 text-zinc-500 italic">Expected Fix: {cf.fix}</span></div>
                  <div className="flex justify-between items-center text-xs uppercase font-bold text-zinc-500">
                     <span>Owner: {cf.owner}</span>
                  </div>
                </div>
             ))}
           </div>
        </motion.div>

        {/* 10. SECURITY INSIGHTS & 11. TESTING */}
        <motion.div variants={itemVars} className="flex flex-col gap-8">
           <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 flex-1 border-t-4 border-t-red-500 shadow-xl">
              <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6">Security Insights</h2>
              <div className="space-y-5">
                 {data.security_insights?.map((sec, i)=>(
                    <div key={i} className="flex flex-col gap-3 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
                      <div className="flex items-start gap-4">
                         <span className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${sec.severity==='Critical'?'bg-red-500' : 'bg-orange-500'} shadow-[0_0_8px_rgba(239,68,68,0.5)]`}></span>
                         <div>
                            <span className="text-sm md:text-base font-bold text-zinc-200 block mb-2">{sec.issue}</span>
                            <span className="text-sm text-zinc-400 leading-relaxed block font-medium">{sec.impact}</span>
                         </div>
                      </div>
                    </div>
                 ))}
                 {data.security_insights?.length === 0 && <div className="text-sm text-zinc-500 italic">No heuristic security concerns detected in target boundaries.</div>}
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 flex-1 border-t-4 border-t-green-500 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold">Testing Posture</h2>
                 <span className="text-sm md:text-base font-black bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20">{data.testing_health.coverage}</span>
              </div>
              <p className="text-sm md:text-base text-zinc-400 mb-6 leading-relaxed font-medium">{data.testing_health.explanation}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-zinc-800/40 p-4 rounded-2xl text-center border border-zinc-700/30">
                    <div className="text-xs uppercase text-zinc-500 font-bold md:text-sm">Test Suites</div>
                    <div className="text-2xl font-black text-zinc-200 mt-1">{data.testing_health.test_files}</div>
                 </div>
                 <div className="bg-zinc-800/40 p-4 rounded-2xl text-center border border-zinc-700/30">
                    <div className="text-xs uppercase text-zinc-500 font-bold md:text-sm">Missing Mocks</div>
                    <div className="text-2xl font-black text-red-400 mt-1">{data.testing_health.missing_tests.length}</div>
                 </div>
              </div>
              <div>
                 <div className="text-xs md:text-sm uppercase tracking-widest text-zinc-500 font-bold mb-3 flex items-center gap-1">Critical Untested Flows</div>
                 <div className="flex flex-wrap gap-2">
                   {data.testing_health.critical_untested?.map((un,i)=><div key={i} className="text-xs md:text-sm text-red-300 bg-red-500/10 px-3 py-1.5 inline-block rounded-lg border border-red-500/20 font-medium">{un}</div>)}
                 </div>
              </div>
           </div>
        </motion.div>

        {/* 13. TECHNICAL DEBT & 9. CLEANUP */}
        <motion.div variants={itemVars} className="flex flex-col gap-8">
           <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 flex-1 border-t-4 border-t-yellow-500 shadow-xl">
              <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6">Technical Debt</h2>
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/50 mb-6">
                 <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium">{data.technical_debt.explanation}</p>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm md:text-base pb-3 border-b border-zinc-800/80"><span className="text-zinc-400 font-medium">Aggregated Debt Level</span><span className="font-bold text-yellow-500 px-3 py-1 bg-yellow-500/10 rounded-lg">{data.technical_debt.level}</span></div>
                 <div className="flex justify-between items-center text-sm md:text-base pb-3 border-b border-zinc-800/80"><span className="text-zinc-400 font-medium">Detected Duplications</span><span className="font-bold text-zinc-200">{data.technical_debt.duplications}</span></div>
                 <div className="flex justify-between items-center text-sm md:text-base pb-3 border-b border-zinc-800/80"><span className="text-zinc-400 font-medium">Flow Complexity</span><span className="font-bold text-zinc-200">{data.technical_debt.complexity}</span></div>
                 <div className="flex justify-between items-center text-sm md:text-base pb-3 border-b border-zinc-800/80"><span className="text-zinc-400 font-medium">Legacy Marker Load</span><span className="font-bold text-zinc-200">{data.technical_debt.legacy_code}</span></div>
                 <div className="mt-6 flex justify-between items-center pt-2">
                    <span className="text-xs md:text-sm uppercase text-zinc-500 font-bold">Est. Stabilization Time</span>
                    <span className="text-base md:text-lg font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg">{data.technical_debt.estimated_time}</span>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 flex-1 border-t-4 border-t-zinc-500 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold">Artifact Cleanup Center</h2>
                 <span className="text-xs md:text-sm font-bold tracking-wider text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">{data.cleanup.estimated_reduction} Savings</span>
              </div>
              <div className="space-y-4">
                 <div className="text-sm md:text-base flex justify-between items-center bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50"><span className="text-zinc-400 font-medium">Unused Source Files</span><span className="text-zinc-300 font-bold bg-zinc-800 px-3 py-1 rounded-lg">{data.cleanup.unused_files?.length || 0}</span></div>
                 <div className="text-sm md:text-base flex justify-between items-center bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50"><span className="text-zinc-400 font-medium">Dead Library Imports</span><span className="text-zinc-300 font-bold bg-zinc-800 px-3 py-1 rounded-lg">{data.cleanup.unused_imports}</span></div>
                 <div className="text-sm md:text-base flex justify-between items-center bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50"><span className="text-zinc-400 font-medium">Duplicate Util Functions</span><span className="text-zinc-300 font-bold bg-zinc-800 px-3 py-1 rounded-lg">{data.cleanup.duplicate_utils?.length || 0}</span></div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* BOTTOM WIDE PANELS (12. IMPACT, 8. DEPENDENCY, 14. TIMELINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

         {/* Change Impact & Timeline */}
         <motion.div variants={itemVars} className="lg:col-span-1 space-y-8">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 shadow-xl">
               <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6">Branch Impact Analysis</h2>
               
               <p className="text-sm md:text-base text-zinc-400 leading-relaxed mb-6 font-medium">{data.change_impact.explanation}</p>
               
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-zinc-800/40 p-5 rounded-2xl flex flex-col justify-center items-center border border-zinc-700/30">
                     <div className="text-3xl font-black text-blue-400">{data.change_impact.changed_files}</div>
                     <div className="text-xs uppercase text-zinc-500 font-bold text-center mt-2">Files Mutated</div>
                  </div>
                  <div className="bg-red-500/5 p-5 rounded-2xl flex flex-col justify-center items-center border border-red-500/10">
                     <div className="text-3xl font-black text-red-500">{data.change_impact.high_risk_files}</div>
                     <div className="text-xs uppercase text-red-500/70 font-bold text-center mt-2">High Risk</div>
                  </div>
               </div>
               <div className="text-xs uppercase font-bold text-zinc-500 mb-3 tracking-wider">Business Flows Affected</div>
               <div className="flex flex-wrap gap-2">
                  {data.change_impact.business_flows_affected?.map((f,i)=><span key={i} className="text-xs md:text-sm bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 font-semibold">{f}</span>)}
               </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIvPjwvc3ZnPg==')] shadow-xl">
               <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-6">Execution Registry</h2>
               <div className="flex flex-col gap-6 relative before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-zinc-700/80">
                  {data.timeline?.map((step, i) => (
                     <div key={i} className="flex gap-4 relative z-10 items-center">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400 flex shrink-0" />
                        <div className="text-sm md:text-base text-zinc-300 font-medium">{step.step}</div>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>

         {/* Dependency Graph Visualization */}
         <motion.div variants={itemVars} className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden flex flex-col shadow-xl">
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
             <h2 className="text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold mb-4">Module Dependency Mapping</h2>
             <p className="text-base text-zinc-400 mb-6 max-w-2xl font-medium">
               Live topology scan mapping structural constraints and logical dependencies between detected active internal modules.
             </p>
             
             <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-8 flex flex-col justify-center gap-8 custom-scrollbar overflow-x-auto min-h-[250px]">
                 {data.relationships.dependency_map?.map((rel, i) => (
                    <div key={i} className="flex items-center gap-4 min-w-max mx-auto">
                       <div className="bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-sm font-mono px-5 py-3 rounded-xl shadow-lg">{rel.from}</div>
                       <div className="flex items-center">
                          <div className="h-px w-12 bg-indigo-500/50 relative"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"></div>
                          <div className="h-px w-12 bg-indigo-500/50 relative"></div>
                       </div>
                       <div className="bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-sm font-mono px-5 py-3 rounded-xl shadow-lg">{rel.to}</div>
                    </div>
                 ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                 <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl">
                    <div className="text-xs md:text-sm uppercase font-bold text-red-500 mb-4 tracking-wider">Circular Dependencies</div>
                    {data.relationships.circular_dependencies?.length > 0 
                      ? data.relationships.circular_dependencies.map((c, i)=><div key={i} className="text-sm font-mono text-red-400 mb-2">{c}</div>)
                      : <div className="text-sm text-green-500/80 flex items-center gap-2"><Check className="w-5 h-5 text-green-500"/> No Circular Logic Detected</div>}
                 </div>
                 <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl">
                    <div className="text-xs md:text-sm uppercase font-bold text-orange-400 mb-4 tracking-wider">Shared Risky Utilities</div>
                    {data.relationships.risky_utilities?.map((ru, i)=><div key={i} className="text-sm font-mono text-orange-300 mb-2">{ru}</div>)}
                    {data.relationships.risky_utilities?.length === 0 && <div className="text-sm text-zinc-500 italic">No risky external utilities detected in core flow.</div>}
                 </div>
             </div>
         </motion.div>

      </div>

    </motion.div>
  );
}
