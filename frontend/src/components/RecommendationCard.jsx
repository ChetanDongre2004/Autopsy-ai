import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, ShieldAlert, BookOpen, Clock, Activity, Zap, PlayCircle, FileText, Video, Github, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getTypeIcon = (type) => {
  switch (type) {
    case "Video": return <Video className="w-4 h-4 text-pink-400" />;
    case "Documentation": return <FileText className="w-4 h-4 text-blue-400" />;
    case "Community": return <Github className="w-4 h-4 text-zinc-400" />;
    case "Article": return <BookOpen className="w-4 h-4 text-green-400" />;
    default: return <ExternalLink className="w-4 h-4 text-indigo-400" />;
  }
};

export default function RecommendationCard({ rec, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden font-sans"
    >
      <div 
        className="p-6 md:p-8 lg:p-10 cursor-pointer flex flex-col gap-6 relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all duration-500"></div>
        
        {/* Top: Title, Priority badge, Owner badge */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-2xl md:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-4">
            <span className="bg-indigo-500/10 text-indigo-400 w-10 h-10 rounded-xl flex shrink-0 items-center justify-center text-base md:text-lg font-black border border-indigo-500/20 shadow-inner">
              {index + 1}
            </span>
            <span className="leading-tight">{rec.title}</span>
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest border shadow-sm ${
              rec.priority === 'High' 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {rec.priority} Priority
            </span>
          </div>
        </div>

        {/* Middle: Why this matters & Recommended Fix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <div className="bg-zinc-950/40 p-6 border border-zinc-800/80 rounded-2xl group-hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-red-400/90 font-bold uppercase tracking-widest text-xs md:text-sm">
              <ShieldAlert className="w-5 h-5" /> Why This Matters
            </div>
            <p className="text-zinc-300 leading-relaxed text-base md:text-lg font-medium">{rec.why_this_matters || rec.benefit}</p>
          </div>
          
          <div className="bg-indigo-950/20 p-6 border border-indigo-500/10 rounded-2xl group-hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-indigo-400/90 font-bold uppercase tracking-widest text-xs md:text-sm">
              <Lightbulb className="w-5 h-5" /> Recommended Fix
            </div>
            <p className="text-zinc-300 leading-relaxed text-base md:text-lg font-medium">{rec.fix}</p>
          </div>
        </div>

        {/* Bottom: Effort, Impact, ETA, Owner */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-4 pt-6 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 text-zinc-400 text-base md:text-lg font-semibold">
            <Zap className="w-5 h-5 text-amber-400" /> Effort: <span className="text-zinc-100 font-bold">{rec.effort}</span>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden md:block"></div>
          <div className="flex items-center gap-2 text-zinc-400 text-base md:text-lg font-semibold">
            <Activity className="w-5 h-5 text-green-400" /> Impact: <span className="text-zinc-100 font-bold">{rec.impact}</span>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden md:block"></div>
          <div className="flex items-center gap-2 text-zinc-400 text-base md:text-lg font-semibold">
            <Clock className="w-5 h-5 text-blue-400" /> ETA: <span className="text-zinc-100 font-bold">{rec.eta}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-base font-bold border border-zinc-700">
            {rec.owner}
          </div>
          
          <button className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-zinc-300 transition-colors shrink-0 outline-none">
            {isExpanded ? <ChevronUp className="w-6 h-6 border-none" /> : <ChevronDown className="w-6 h-6 border-none" />}
          </button>
        </div>
      </div>

      {/* Expandable Section: Learning Resources */}
      <AnimatePresence>
        {isExpanded && rec.learn_more && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-950/80 border-t border-zinc-800/80"
          >
            <div className="p-6 md:p-8 lg:p-10">
              <h4 className="text-xl md:text-2xl font-heading font-bold text-zinc-200 mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-400" /> Learn More Resources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {rec.learn_more.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col justify-center p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition group/link relative"
                  >
                    <ExternalLink className="absolute top-5 right-5 w-5 h-5 text-zinc-600 group-hover/link:text-indigo-400 transition transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    <div className="flex flex-col items-start gap-3 mt-1">
                      <div className="p-2.5 bg-zinc-800 rounded-xl group-hover/link:bg-zinc-950 transition-colors">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="pr-6">
                        <div className="text-base md:text-lg font-bold text-zinc-200 group-hover/link:text-indigo-300 transition-colors leading-snug">
                          {resource.title}
                        </div>
                        <div className="text-sm text-zinc-400 mt-1 font-medium tracking-wide">
                          {resource.type || "Resource"}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
