import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, ChevronDown, ShieldAlert, Code2, HeartPulse, Target, UserCircle, FileText, Blocks, Zap, Menu, X, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [productOpen, setProductOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const products = [
    { name: "GitHub Repository Intelligence", path: "/products/github", icon: <Blocks className="w-5 h-5 text-blue-400"/>, desc: "Analyze architecture, health, and onboarding." },
    { name: "Security Intelligence Platform", path: "/products/security", icon: <ShieldAlert className="w-5 h-5 text-red-400"/>, desc: "Detect vulnerabilities, secrets, and CVEs." },
    { name: "AI Code Review Platform", path: "/products/review", icon: <Code2 className="w-5 h-5 text-indigo-400"/>, desc: "Senior-level multi-language code review." },
    { name: "Code Quality Platform", path: "/products/quality", icon: <HeartPulse className="w-5 h-5 text-green-400"/>, desc: "Maintainability, duplication, and complexity." },
    { name: "QA Automation Platform", path: "/products/qa", icon: <Zap className="w-5 h-5 text-amber-400"/>, desc: "Auto-generate tests and edge cases." },
    { name: "Pentesting Platform", path: "/products/pentest", icon: <Target className="w-5 h-5 text-orange-400"/>, desc: "API hitting, fuzzing, and auth abuse." },
    { name: "Developer 360", path: "/products/developer360", icon: <UserCircle className="w-5 h-5 text-cyan-400"/>, desc: "Ownership, hotspots, and team analytics." },
    { name: "Reports Center", path: "/products/reports", icon: <FileText className="w-5 h-5 text-zinc-400"/>, desc: "Export PDFs, JSON trends, and compliance." },
    { name: "AMD AI Acceleration Hub", path: "/products/amd-ai-hub", icon: <Cpu className="w-5 h-5 text-orange-400"/>, desc: "Local RAG Code Chat & Telemetry benchmarks." },
  ];

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14 py-4 md:py-5 flex justify-between items-center w-full">
        <Link to="/" className="font-heading font-extrabold text-2xl tracking-wide flex items-center gap-3 text-zinc-100 hover:opacity-80 transition">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <Rocket className="w-6 h-6 text-indigo-400" />
          </div>
          Autopsy<span className="text-indigo-400">.ai</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-base font-semibold text-zinc-300">
          
          <div 
            className="relative"
            onMouseEnter={() => setProductOpen(true)}
            onMouseLeave={() => setProductOpen(false)}
          >
            <button className="flex items-center gap-1.5 hover:text-indigo-400 transition py-2">
               Product <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {productOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[700px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-4 z-50"
                >
                  {products.map(p => (
                    <Link key={p.name} to={p.path} className="flex gap-4 p-3 rounded-xl hover:bg-zinc-900 transition items-start group">
                       <div className="mt-1 p-2 bg-zinc-900 border border-zinc-800 rounded-lg group-hover:border-indigo-500/30 transition">{p.icon}</div>
                       <div>
                         <div className="text-zinc-100 font-bold group-hover:text-indigo-400 transition">{p.name}</div>
                         <div className="text-sm text-zinc-500 mt-1 font-medium leading-snug">{p.desc}</div>
                       </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/resources" className="hover:text-indigo-400 transition flex items-center gap-1.5">Resources <ChevronDown className="w-4 h-4"/></Link>
          <Link to="/pricing" className="hover:text-indigo-400 transition">Pricing</Link>
          <Link to="/docs" className="hover:text-indigo-400 transition">Docs</Link>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/login" className="text-base font-bold text-zinc-300 hover:text-white transition">Log in</Link>
          <Link to="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] transition">
            Start Free Trial
          </Link>
        </div>

        <button className="lg:hidden text-zinc-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="lg:hidden overflow-hidden bg-zinc-950 border-t border-zinc-800">
             <div className="p-6 flex flex-col gap-6">
                <div className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Products</div>
                <div className="flex flex-col gap-4">
                  {products.map(p => (
                     <Link key={p.name} to={p.path} className="text-zinc-300 text-lg font-bold flex gap-3 items-center" onClick={()=>setMobileMenuOpen(false)}>
                        {p.icon} {p.name}
                     </Link>
                  ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
