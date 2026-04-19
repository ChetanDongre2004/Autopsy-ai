import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, Code2, ShieldAlert, HeartPulse, Zap, Target, UserCircle, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const products = [
    { name: "GitHub Repository Intelligence", path: "/products/github", icon: <Terminal className="w-8 h-8 text-blue-400"/>, desc: "Analyze architecture, health, and onboarding automatically." },
    { name: "Security Intelligence Platform", path: "/products/security", icon: <ShieldAlert className="w-8 h-8 text-red-400"/>, desc: "Detect vulnerabilities, secrets, and runtime security risks." },
    { name: "AI Code Review Platform", path: "/products/review", icon: <Code2 className="w-8 h-8 text-indigo-400"/>, desc: "Senior-level multi-language code review with insights." },
    { name: "Code Quality Platform", path: "/products/quality", icon: <HeartPulse className="w-8 h-8 text-green-400"/>, desc: "Metrics, maintainability, duplication, and technical debt." },
    { name: "QA Automation Platform", path: "/products/qa", icon: <Zap className="w-8 h-8 text-amber-400"/>, desc: "Detect missing tests and generate robust unit tests." },
    { name: "Pentesting Platform", path: "/products/pentest", icon: <Target className="w-8 h-8 text-orange-400"/>, desc: "Safe simulated attack checks, fuzzing, and API risks." },
    { name: "Developer 360", path: "/products/developer360", icon: <UserCircle className="w-8 h-8 text-cyan-400"/>, desc: "Ownership, hotspots, and team productivity analytics." },
    { name: "Reports Center", path: "/products/reports", icon: <FileText className="w-8 h-8 text-zinc-400"/>, desc: "Export enterprise reports, trends, and compliance." }
  ];

  const stats = [
    { label: "Faster Code Reviews", value: "70%" },
    { label: "Reduced QA Effort", value: "60%" },
    { label: "Faster Repo Onboarding", value: "90%" },
    { label: "Enterprise Security", value: "100%" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#060608]">
      
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 overflow-hidden px-6 lg:px-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="container max-w-[1200px] mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-zinc-300 font-bold mb-6">
               <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
               Autopsy AI Platform v2.0
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-[84px] font-black font-heading tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-[1.1] mb-8">
              The Engineering Intelligence Platform.
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
              Transform your codebase into a living dashboard. Autopsy AI powers code review, security auditing, multi-product QA automation, and developer productivity scaling natively.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/products/github" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2">
                 Start Free Scan <ArrowRight className="w-5 h-5"/>
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                 Explore Products
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 border-y border-zinc-800/60 bg-zinc-950/50">
        <div className="container max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {stats.map((stat, i) => (
                <div key={i} className="text-center">
                   <div className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">{stat.value}</div>
                   <div className="text-base md:text-lg text-zinc-400 font-bold uppercase tracking-widest">{stat.label}</div>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      <section className="py-32 container max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Multiple Products. One Platform.</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">Replace sprawling toolchains with a highly integrated intelligence engine designed natively for engineering speed.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
           {products.map((p, i) => (
             <Link key={i} to={p.path} className="bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/50 p-8 rounded-3xl transition-all duration-300 group shadow-xl">
               <div className="bg-zinc-950/80 p-4 border border-zinc-800 group-hover:border-indigo-500/30 rounded-2xl inline-block mb-6 transition-colors">
                  {p.icon}
               </div>
               <h3 className="text-2xl font-bold text-zinc-100 mb-3 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
               <p className="text-zinc-400 text-lg mb-6 leading-relaxed bg-black/0">{p.desc}</p>
               <div className="text-indigo-400 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                  Open Product <ArrowRight className="w-5 h-5"/>
               </div>
             </Link>
           ))}
        </div>
      </section>

      {/* VALUE PROP */}
      <section className="py-32 bg-gradient-to-b from-[#060608] to-zinc-950 border-t border-zinc-800/50">
        <div className="container max-w-[1200px] mx-auto px-6 text-center">
           <h2 className="text-4xl md:text-5xl font-black text-white mb-16">Why AUTOPSY AI?</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
              <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition">
                 <CheckCircle2 className="w-10 h-10 text-indigo-400 mb-6"/>
                 <h3 className="text-2xl font-bold text-white mb-4">Eliminate Tool Sprawl</h3>
                 <p className="text-zinc-400 text-lg leading-relaxed">Combine SAST, Secrets, Quality, and Architecture into a single cohesive UI instead of paying for 5 disjointed SaaS products.</p>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition">
                 <CheckCircle2 className="w-10 h-10 text-green-400 mb-6"/>
                 <h3 className="text-2xl font-bold text-white mb-4">Immediate Remediation</h3>
                 <p className="text-zinc-400 text-lg leading-relaxed">Don't just detect issues. Generate senior-level architectural refactors, auto-fix snippets, and immediate dependency patches.</p>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition">
                 <CheckCircle2 className="w-10 h-10 text-amber-400 mb-6"/>
                 <h3 className="text-2xl font-bold text-white mb-4">Executive Readiness</h3>
                 <p className="text-zinc-400 text-lg leading-relaxed">Deliver boardroom-ready PDF audits, compliance mappings, and visual dependency charts automatically generated at scale.</p>
              </div>
           </div>
        </div>
      </section>

    </div>
  );
}
