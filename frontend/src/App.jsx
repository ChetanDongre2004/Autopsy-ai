import { useState } from "react";
import RepoDashboard from "./components/RepoDashboard";
import Navbar from "./components/Navbar";
import { Github, ScanSearch, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function App() {
  const [form, setForm] = useState({
    url: "https://github.com/ChetanDongre2004/Autopsy-ai",
    branch: "main",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Analysis failed. Please check the backend.");
      const json = await res.json();
      setData(json);
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Header / Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-2">
            <Terminal className="w-4 h-4" /> v2 Intelligence Engine Live
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            GitHub Repository Intelligence
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Perform an instantaneous, senior-architect-level deep dive into any codebase. Detect architecture smells, technical debt, and deployment risks.
          </p>

          <div className="max-w-3xl mx-auto mt-8 flex flex-col md:flex-row items-stretch gap-3">
            <div className="flex-1 relative">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-zinc-200"
                placeholder="https://github.com/owner/repo"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="w-full md:w-1/4">
              <input
                className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-zinc-300"
                placeholder="Branch (e.g. main)"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-xl shadow-white/5"
            >
              <ScanSearch className="w-5 h-5" />
              {loading ? "Scanning..." : "Analyze Repo"}
            </button>
          </div>
          {error && <p className="text-red-400 mt-4 text-sm font-medium">{error}</p>}
        </motion.div>

        {/* Dashboard Rendering */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <RepoDashboard data={data} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
