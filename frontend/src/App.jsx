import React, { useState } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import RepoDashboard from "./components/RepoDashboard";
import CodeSecurityDashboard from "./components/CodeSecurityDashboard";
import AiCodeReviewDashboard from "./components/AiCodeReviewDashboard";
import QaAutomationDashboard from "./components/QaAutomationDashboard";
import PentestDashboard from "./components/PentestDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import { Github, ScanSearch, Terminal, ShieldAlert, Code2, HeartPulse, UserCircle, Target, Blocks, Zap, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [form, setForm] = useState({
    url: "",
    branch: "main",
    rawCode: "",
    targetApi: ""
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing Core Engine...");
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState("github");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rawCode, setRawCode] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const location = useLocation();

  const mockTabContent = (name, Icon, description) => (
    <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 border border-zinc-800 rounded-3xl min-h-[500px] mt-10">
       <div className="text-zinc-500 mb-6 p-4 bg-zinc-900 rounded-2xl border border-zinc-800/80"><Icon className="w-12 h-12"/></div>
       <h2 className="text-3xl font-bold text-zinc-300 mb-4">{name}</h2>
       <p className="text-xl text-zinc-500 text-center max-w-lg mb-6">{description}</p>
       <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition">Contact Sales to Unlock Beta</button>
    </div>
  );

  const getProductHero = () => {
    switch (location.pathname) {
      case "/products/github":
        return { title: "GitHub Repository Intelligence", desc: "Perform an instantaneous, senior-architect-level deep dive into any codebase. Detect architecture smells, technical debt, and deployment risks.", icon: <Blocks className="w-5 h-5 text-blue-400" /> };
      case "/products/security":
        return { title: "Security Intelligence Platform", desc: "Detect vulnerabilities, exposed secrets, dependency risks (CVEs), and evaluate runtime API posture effortlessly.", icon: <ShieldAlert className="w-5 h-5 text-red-400" /> };
      case "/products/review":
        return { title: "AI Code Review Platform", desc: "Review source code like a senior engineer. Gain deep insights into algorithmic complexity and specific refactoring opportunities.", icon: <Code2 className="w-5 h-5 text-indigo-400" /> };
      case "/products/qa":
        return { title: "QA Automation Platform", desc: "Detect missing tests and heavily boost your coverage by auto-generating robust edge case simulations.", icon: <Zap className="w-5 h-5 text-amber-400" /> };
      case "/products/pentest":
        return { title: "Enterprise Pentesting Platform", desc: "Run aggressive DAST scanning, unearth hidden API vulnerabilities, map attack paths, and remediate exploits.", icon: <Target className="w-5 h-5 text-red-500" /> };
      default:
        return { title: "Enterprise Platform", desc: "Analyze any codebase instantly.", icon: <Terminal className="w-5 h-5" /> };
    }
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      if (inputMode === "github") {
         const urlStr = form.url.trim().replace(/['"]/g, '');
         if (urlStr && (!urlStr.includes("github.com") || urlStr.includes("\n") || urlStr.includes(" "))) {
             throw new Error("Invalid GitHub URL. Must contain github.com and not have spaces.");
         }
      }

      let res;
      if (inputMode === "file" || inputMode === "zip" || inputMode === "raw") {
         const formData = new FormData();
         formData.append("type", inputMode);
         
         if (inputMode === "raw") {
            if (!rawCode.trim()) throw new Error("Please paste source code to analyze.");
            formData.append("raw_code", rawCode);
         } else {
            if (selectedFiles.length === 0) throw new Error("Please select files or a .zip archive first.");
            selectedFiles.forEach(file => formData.append("files", file));
         }
         
         res = await fetch(`${BASE_URL}/api/v1/analyze/upload`, {
            method: "POST",
            body: formData,
         });
      } else {
         res = await fetch(`${BASE_URL}/api/v1/scan/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
         });
      }

      if (!res.ok) {
         const d = await res.json().catch(()=>({}));
         let errMessage = d.detail;
         if (Array.isArray(d.detail) && d.detail.length > 0) {
             errMessage = d.detail[0].msg.includes("Value error,") ? d.detail[0].msg.split("Value error,")[1].trim() : d.detail[0].msg;
         }
         throw new Error(errMessage || "Analysis failed. Please check the backend.");
      }
      
      const { job_id } = await res.json();
      
      // Live Polling Loop
      let retries = 0;
      while (true) {
         await new Promise(r => setTimeout(r, 1000));
         let statRes;
         try {
             statRes = await fetch(`${BASE_URL}/api/v1/scan/status/${job_id}`);
         } catch (e) {
             // Handle ERR_CONNECTION_RESET or transient network drops by retrying
             retries++;
             if (retries > 5) throw new Error("Connection to backend lost completely. Please check your network or restart the server.");
             continue; // Skip this iteration and try polling again
         }
         
         // Reset retries on successful connection
         retries = 0;

         if (!statRes.ok) {
             if (statRes.status === 404) throw new Error("Job expired or not found in system. Please rescan.");
             throw new Error("Job polling blocked by server.");
         }
         
         const stat = await statRes.json();
         setLoadingText(`${stat.stage} (${stat.progress}%)`);
         
         if (stat.status === "failed") throw new Error(stat.error || "Execution terminated unexpectedly.");
         if (stat.status === "success") break;
      }
      
      // Robust fetch for the final result
      let finalRes;
      let resultRetries = 0;
      while (resultRetries < 3) {
          try {
              finalRes = await fetch(`${BASE_URL}/api/v1/scan/result/${job_id}`);
              break;
          } catch (e) {
              resultRetries++;
              if (resultRetries === 3) throw new Error("Failed to retrieve final results after multiple attempts.");
              await new Promise(r => setTimeout(r, 1000));
          }
      }
      
      if (!finalRes.ok) throw new Error("Failed to compile final results.");
      setData(await finalRes.json());
      
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      if (inputMode === "zip" && !files[0].name.endsWith(".zip")) return setError("Only .zip files are allowed for Archive mode.");
      setSelectedFiles(files);
      setError("");
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      if (inputMode === "zip" && !files[0].name.endsWith(".zip")) return setError("Only .zip files are allowed for Archive mode.");
      setSelectedFiles(files);
      setError("");
    }
  };

  const isHome = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen bg-[#060608] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      {/* LANDING PAGE ROUTE */}
      {isHome && <LandingPage />}

      {/* PRODUCTS LAYOUT */}
      {!isHome && (
        <main className="flex-grow container max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14 py-12 md:py-16">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-14 text-center space-y-4 pt-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full font-medium mb-3 shadow-lg">
                {getProductHero().icon} <span className="text-zinc-300 tracking-wide text-sm">{getProductHero().title} Module</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent leading-tight mt-6 max-w-5xl mx-auto">
                {getProductHero().title}
              </h1>
              <p className="text-zinc-400 max-w-3xl mx-auto text-xl mt-6 leading-relaxed font-medium">
                {getProductHero().desc}
              </p>

              {/* MULTI-MODE INPUT SYSTEM conditionally rendered based on path */}
              {location.pathname === "/products/security" || location.pathname === "/products/review" ? (
                <div className="max-w-4xl mx-auto mt-12 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl text-left">
                   <div className="flex overflow-x-auto gap-2 mb-6 pb-2 border-b border-zinc-800/80 custom-scrollbar">
                     {[{id: "github", label: "GitHub Repo"}, {id: "raw", label: "Raw Code"}, {id: "file", label: "File Upload"}, {id: "zip", label: "ZIP Archive"}, {id: "api", label: "API Target"}].map(mode => (
                        <button 
                          key={mode.id} 
                          onClick={() => setInputMode(mode.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${inputMode === mode.id ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                        >
                           {mode.label}
                        </button>
                     ))}
                   </div>
                   
                   {inputMode === "github" && (
                     <div className="flex flex-col md:flex-row gap-4">
                        <input className="flex-[2] py-4 px-5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-medium" placeholder="https://github.com/owner/repo" value={form.url} onChange={(e) => setForm({...form, url: e.target.value})} />
                        <input className="flex-1 py-4 px-5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono" placeholder="Branch (main)" value={form.branch} onChange={(e) => setForm({...form, branch: e.target.value})} />
                     </div>
                   )}
                   
                   {inputMode === "raw" && (
                      <textarea 
                         className="w-full h-[200px] p-5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 font-mono focus:outline-none focus:border-indigo-500 custom-scrollbar" 
                         placeholder="Paste source code or configuration directly here..."
                         value={rawCode}
                         onChange={(e) => setRawCode(e.target.value)}
                      ></textarea>
                   )}

                   {(inputMode === "file" || inputMode === "zip") && (
                      <div className="flex flex-col gap-4">
                        <div 
                           className={`w-full h-[150px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500 hover:border-indigo-500 hover:text-indigo-400'}`}
                           onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                           onClick={() => fileInputRef.current?.click()}
                        >
                           <input ref={fileInputRef} type="file" multiple={inputMode === "file"} accept={inputMode === "zip" ? ".zip" : undefined} onChange={handleChange} className="hidden" />
                           <div className="font-bold mb-2">Drag and drop your {inputMode === 'zip' ? '.zip archive' : 'file(s)'} here</div>
                           <div className="text-sm">or click to browse local files</div>
                        </div>
                        {selectedFiles.length > 0 && (
                           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                             <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Selected Files ({selectedFiles.length})</div>
                             <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                               {selectedFiles.map((f, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm font-medium text-zinc-300">
                                   <span className="truncate">{f.name}</span>
                                   <span className="text-zinc-600 shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                        )}
                      </div>
                   )}

                   {inputMode === "api" && (
                     <input className="w-full py-4 px-5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-medium" placeholder="https://api.example.com/v1" value={form.targetApi} onChange={(e) => setForm({...form, targetApi: e.target.value})} />
                   )}

                   <div className="mt-6 flex justify-end">
                      <button onClick={submit} disabled={loading} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.3)] w-full md:w-auto">
                        {loading ? <HeartPulse className="w-5 h-5 animate-pulse" /> : <ScanSearch className="w-5 h-5" />}
                        {loading ? loadingText : "Execute Deep Scan"}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto mt-12 flex flex-col md:flex-row items-stretch gap-4">
                  <div className="flex-[2] relative">
                    <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                    <input
                      className="w-full pl-16 pr-6 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-zinc-100 text-lg md:text-xl font-medium placeholder-zinc-600 shadow-xl"
                      placeholder="https://github.com/owner/repo"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full px-6 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-zinc-300 text-lg md:text-xl placeholder-zinc-600 shadow-xl"
                      placeholder="Branch (main)"
                      value={form.branch}
                      onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="px-8 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 whitespace-nowrap shadow-[0_0_20px_rgba(79,70,229,0.3)] text-lg md:text-xl shrink-0"
                  >
                    {loading ? <HeartPulse className="w-6 h-6 animate-pulse" /> : <ScanSearch className="w-6 h-6" />}
                    {loading ? loadingText : "Execute Scan"}
                  </button>
                </div>
              )}
              {error && <p className="text-red-400 mt-4 text-sm font-bold">{error}</p>}
            </motion.div>
          </AnimatePresence>

          {/* SKELETON LOADER */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 mt-16">
               <div className="flex justify-between items-center bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800/50 animate-pulse">
                  <div className="flex gap-6 items-center">
                     <div className="w-16 h-16 rounded-xl bg-zinc-800/80"></div>
                     <div className="space-y-3">
                        <div className="h-8 w-64 bg-zinc-800/80 rounded-lg"></div>
                        <div className="h-4 w-96 bg-zinc-800/50 rounded-lg"></div>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                  <div className="bg-zinc-900/40 rounded-3xl h-[400px] border border-zinc-800/50"></div>
                  <div className="bg-zinc-900/40 rounded-3xl h-[400px] border border-zinc-800/50"></div>
               </div>
            </motion.div>
          )}

          {/* DASHBOARD ROUTING */}
          {data && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-12">
               <Routes>
                  <Route path="/products/github" element={<RepoDashboard data={data} />} />
                  <Route path="/products/security" element={<CodeSecurityDashboard data={data} />} />
                  <Route path="/products/review" element={<AiCodeReviewDashboard data={data} />} />
                  <Route path="/products/qa" element={<QaAutomationDashboard data={data} />} />
                  <Route path="/products/quality" element={mockTabContent("Code Quality Intelligence", HeartPulse, "Monitor technical debt, duplicate code segments, and measure exact team maintainability scores.")} />
                  <Route path="/products/pentest" element={<PentestDashboard data={data} />} />
                  <Route path="/products/developer360" element={mockTabContent("Developer 360", UserCircle, "Evaluate engineering productivity, pinpoint architecture knowledge silos, and reward top maintainers.")} />
                  <Route path="/products/reports" element={mockTabContent("Enterprise Reports Center", FileText, "Export raw audit CSVs or gorgeous Executive Summary PDFs detailing your absolute threat vectors.")} />
                  <Route path="*" element={<Navigate to="/products/github" replace />} />
               </Routes>
            </motion.div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
