import React, { useState } from 'react';
import { FileCode2, AlertTriangle, Bug, Code2, Layers, CheckCircle2, AlertCircle, TrendingUp, Zap, Server, Database, Box, PlayCircle, GitMerge, FileText, ChevronRight, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AiCodeReviewDashboard({ data }) {
    const review = data?.code_review_platform || { files: [], overall_grade: 'N/A', total_issues: 0, summary: '', scores: {} };
    const [selectedFile, setSelectedFile] = useState(review.files?.[0] || null);
    const [selectedIssue, setSelectedIssue] = useState(null);

    const getGradeColor = (grade) => {
        if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-400 border-green-400/30 bg-green-500/10 shadow-[0_0_30px_rgba(74,222,128,0.2)]';
        if (['B+', 'B', 'B-'].includes(grade)) return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.2)]';
        if (['C+', 'C', 'C-'].includes(grade)) return 'text-orange-400 border-orange-400/30 bg-orange-500/10 shadow-[0_0_30px_rgba(251,146,60,0.2)]';
        return 'text-red-400 border-red-400/30 bg-red-500/10 shadow-[0_0_30px_rgba(248,113,113,0.2)]';
    };

    const getSeverityIcon = (sev) => {
        if (sev === 'Critical') return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (sev === 'High') return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        if (sev === 'Medium') return <Bug className="w-5 h-5 text-yellow-500" />;
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
    };

    const radarData = [
        { subject: 'Code Quality', A: review.scores['Code Quality'] || 80, fullMark: 100 },
        { subject: 'Security', A: review.scores['Security'] || 80, fullMark: 100 },
        { subject: 'Maintainability', A: review.scores['Maintainability'] || 80, fullMark: 100 },
        { subject: 'Performance', A: review.scores['Performance'] || 80, fullMark: 100 },
        { subject: 'Architecture', A: review.scores['Architecture'] || 80, fullMark: 100 },
        { subject: 'Testing', A: review.scores['Testing'] || 80, fullMark: 100 },
    ];

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-8 font-sans">
            {/* Header / Executive Summary */}
            <div className="flex flex-col xl:flex-row gap-6 bg-gradient-to-br from-zinc-900 to-[#0a0a0c] p-8 rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>
                
                <div className="flex-1 space-y-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><GitMerge className="w-8 h-8 text-indigo-400"/></div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Executive Code Review</h1>
                            <div className="flex gap-4 text-sm font-medium text-zinc-400 mt-1">
                                <span>{review.repository || 'Repository'}</span>
                                <span>•</span>
                                <span className="font-mono">{review.branch || 'main'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><FileCode2 className="w-4 h-4"/> {review.total_files} files scanned</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl">
                        {review.summary}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {['total_issues', 'critical_issues', 'code_smells', 'hotspot_files'].map(k => (
                           <div key={k} className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                               <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{k.replace('_', ' ')}</div>
                               <div className="text-3xl font-black text-zinc-200">{review.summary_cards?.[k] || 0}</div>
                           </div>
                        ))}
                    </div>
                </div>

                <div className="w-full xl:w-[350px] shrink-0 flex flex-col items-center justify-center bg-zinc-950/80 p-8 rounded-3xl border border-zinc-800 relative z-10">
                    <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Overall Grade</div>
                    <div className={`flex items-center justify-center w-32 h-32 rounded-full border-[4px] text-6xl font-black ${getGradeColor(review.grade)}`}>
                        {review.grade || 'N/A'}
                    </div>
                    <div className="mt-6 w-full space-y-3">
                        <div className="flex justify-between text-sm font-bold"><span className="text-zinc-400">Score</span><span className="text-white">{review.overall_score}/100</span></div>
                        <div className="flex justify-between text-sm font-bold"><span className="text-zinc-400">Risk Level</span><span className="text-red-400">{review.risk_level || 'Medium'}</span></div>
                        <div className="flex justify-between text-sm font-bold"><span className="text-zinc-400">Time</span><span className="text-indigo-400">{review.scan_duration || '0s'}</span></div>
                    </div>
                </div>
            </div>

            {/* Score Breakdown Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col items-center justify-center h-[400px]">
                    <h3 className="text-lg font-bold text-zinc-100 mb-2 w-full text-left">Quality Vector</h3>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#3f3f46" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.3} />
                            <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px'}} itemStyle={{color: '#fff'}} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-zinc-100 mb-6">Engine Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {Object.entries(review.scores || {}).map(([key, val]) => (
                            <div key={key} className="w-full">
                                <div className="flex justify-between text-sm font-bold text-zinc-400 mb-2">
                                    <span>{key}</span>
                                    <span className={val > 80 ? 'text-green-400' : val > 50 ? 'text-yellow-400' : 'text-red-400'}>{val}/100</span>
                                </div>
                                <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${val > 80 ? 'bg-green-500' : val > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${val}%`}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deep File Explorer & Annotations */}
            <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
                {/* Left: File Tree */}
                <div className="w-full lg:w-[400px] bg-zinc-900 border border-zinc-800 rounded-[2rem] flex flex-col overflow-hidden shadow-xl shrink-0">
                    <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-400" /> File Explorer
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {review.files?.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSelectedFile(file); setSelectedIssue(null); }}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedFile?.file_name === file.file_name ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-zinc-950/50 border-transparent hover:bg-zinc-800 hover:border-zinc-700'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm text-zinc-200 truncate pr-2 flex-1 flex items-center gap-2">
                                        <FileCode2 className="w-4 h-4 text-zinc-500"/>
                                        <span className="truncate">{file.file_name.split('/').pop()}</span>
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${file.score > 80 ? 'bg-green-500/20 text-green-400' : file.score > 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {file.score}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                                    <span>{file.issue_count} issues</span>
                                    <span>{file.loc} LOC</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Code Review Context */}
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] flex flex-col overflow-hidden shadow-xl relative">
                    {selectedFile ? (
                        <>
                            <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-100 font-mono flex items-center gap-2">
                                        {selectedFile.file_name}
                                    </h2>
                                    <div className="flex gap-3 mt-1 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                        <span>Maintainability: {selectedFile.maintainability_score}</span>
                                        <span>•</span>
                                        <span>Complexity: {selectedFile.complexity_score}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition text-sm">View Source</button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0d0d12]">
                                {selectedFile.issues?.length > 0 ? (
                                    selectedFile.issues.map((issue, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} 
                                            key={idx} 
                                            className={`bg-zinc-950 border rounded-2xl p-5 cursor-pointer transition-all ${selectedIssue === idx ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}
                                            onClick={() => setSelectedIssue(selectedIssue === idx ? null : idx)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                                                    <div>
                                                        <h4 className="text-md font-bold text-zinc-200">{issue.title}</h4>
                                                        <div className="text-sm text-zinc-400 mt-1">{issue.why}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">Line {issue.line}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">{issue.category}</span>
                                                </div>
                                            </div>
                                            
                                            <AnimatePresence>
                                                {selectedIssue === idx && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-zinc-800 space-y-4">
                                                        
                                                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4"/> AI Recommendation</div>
                                                            <div className="text-indigo-100 text-sm font-medium">{issue.suggestion || issue.fix}</div>
                                                        </div>

                                                        {issue.fix_patch && (
                                                            <div className="relative group">
                                                                <div className="absolute right-2 top-2 z-10">
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(issue.fix_patch); }} className="p-1.5 bg-zinc-800/80 hover:bg-indigo-500 rounded-md text-zinc-400 hover:text-white transition">
                                                                        <Copy className="w-4 h-4"/>
                                                                    </button>
                                                                </div>
                                                                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1 px-1">Suggested Auto-Fix:</div>
                                                                <SyntaxHighlighter language="python" style={vscDarkPlus} className="rounded-xl border border-zinc-800 text-sm" customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#09090b' }}>
                                                                    {issue.fix_patch}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        )}

                                                        {issue.code_snippet && !issue.fix_patch && (
                                                            <div>
                                                                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 px-1">Vulnerable Code:</div>
                                                                <SyntaxHighlighter language="python" style={vscDarkPlus} className="rounded-xl border border-red-500/20 text-sm" customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#2a0a0a' }}>
                                                                    {issue.code_snippet}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-3 pt-2">
                                                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">Apply Fix</button>
                                                            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition">Dismiss</button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                                        <div className="p-6 bg-green-500/5 rounded-full border border-green-500/10">
                                            <CheckCircle2 className="w-16 h-16 text-green-500/50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-zinc-300 mb-1">Code Quality Verified</p>
                                            <p className="text-sm">No significant issues detected in this module.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-xl font-bold">Select a file to begin review</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* AI Senior Engineer Mentorship Section */}
            {review.ai_mentorship?.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/30 rounded-[2rem] p-8 shadow-xl">
                    <h3 className="text-xl font-black text-indigo-300 mb-6 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
                        Senior Engineer Coaching
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {review.ai_mentorship.map((tip, i) => (
                            <div key={i} className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 text-zinc-300 text-sm leading-relaxed flex items-start gap-3">
                                <span className="text-indigo-400 font-black text-lg leading-none mt-0.5">{i+1}.</span>
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
