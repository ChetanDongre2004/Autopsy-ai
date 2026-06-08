import React, { useState, useEffect } from 'react';
import { PlayCircle, ShieldAlert, Activity, Bug, CheckCircle2, XCircle, AlertTriangle, Box, Fingerprint, Terminal, Zap, FileText, BarChart3, RotateCcw, Monitor, Smartphone, Globe, Settings, Network, History, Map as MapIcon, Database, HardDrive, Clock, Search, Filter, Server, Laptop, ChevronRight, Layers, Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart as RechartsPie, Pie, CartesianGrid, LineChart, Line } from 'recharts';

export default function QaAutomationDashboard({ data }) {
    const qa = data?.qa_platform || { overview: {}, test_runs: [], api_tests: [], e2e_tests: [], performance_tests: [], failures: [], coverage_engine: {}, flaky_intelligence: [], ci_cd_pipeline: {}, trends: [], recommendations: [] };
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedTest, setSelectedTest] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStep, setExecutionStep] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Schedules State
    const [schedules, setSchedules] = useState([]);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ name: '', type: 'Regression', environment: 'Staging', trigger: 'Time Based', time: '00:00' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/qa/schedules');
            if (res.ok) {
                setSchedules(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch schedules", e);
        }
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/qa/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSchedule)
            });
            if (res.ok) {
                await fetchSchedules();
                setIsScheduleModalOpen(false);
                setNewSchedule({ name: '', type: 'Regression', environment: 'Staging', trigger: 'Time Based', time: '00:00' });
            }
        } catch (err) {
            console.error("Failed to save schedule", err);
        }
        setIsSaving(false);
    };

    const toggleSchedule = async (id) => {
        try {
            await fetch(`http://127.0.0.1:8000/api/qa/schedules/${id}/toggle`, { method: 'POST' });
            await fetchSchedules();
        } catch (e) {}
    };

    const deleteSchedule = async (id) => {
        try {
            await fetch(`http://127.0.0.1:8000/api/qa/schedules/${id}`, { method: 'DELETE' });
            await fetchSchedules();
        } catch (e) {}
    };

    const runSchedule = async (id) => {
        setIsExecuting('schedule');
        try {
            await fetch(`http://127.0.0.1:8000/api/qa/schedules/${id}/run`, { method: 'POST' });
            setTimeout(() => setIsExecuting(false), 2000);
        } catch (e) {
            setIsExecuting(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'passed') return 'text-green-400 bg-green-500/10 border-green-500/30';
        if (status === 'failed') return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (status === 'flaky') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    };

    const getStatusIcon = (status) => {
        if (status === 'passed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
        if (status === 'flaky') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        return <PlayCircle className="w-5 h-5 text-zinc-500" />;
    };

    const runTests = async (type) => {
        setIsExecuting(type);
        if (type === 'all') {
            setExecutionStep(1);
            const steps = 7;
            for (let i = 1; i <= steps; i++) {
                setExecutionStep(i);
                await new Promise(r => setTimeout(r, 200 + Math.random() * 250));
            }
            setTimeout(() => {
                setIsExecuting(false);
                setExecutionStep(0);
            }, 300);
        } else {
            setTimeout(() => setIsExecuting(false), 600); // Suite level simulate
        }
    };

    const filteredRuns = qa.test_runs?.filter(t => t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.suite?.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl">
                            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400"/> Release Quality Trends</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <AreaChart data={qa.trends || []}>
                                        <defs>
                                            <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                        <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px'}} itemStyle={{color: '#fff'}} />
                                        <Area type="monotone" dataKey="passed" stroke="#4ade80" fillOpacity={1} fill="url(#colorPass)" />
                                        <Area type="monotone" dataKey="failed" stroke="#f87171" fillOpacity={1} fill="url(#colorFail)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
                            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400"/> Smart Recommendations</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                                {qa.recommendations?.map((rec, i) => (
                                    <div key={i} className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5"><Zap className="w-4 h-4 text-indigo-400"/></div>
                                            <p className="text-sm font-medium text-zinc-300 leading-relaxed">{rec}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'test_runs':
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                                <History className="w-6 h-6 text-indigo-400" /> Execution Evidence Registry
                            </h3>
                            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl w-full md:w-auto">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search test cases..." className="bg-transparent border-none focus:outline-none text-zinc-200 text-sm w-full md:w-64" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-zinc-950/30 uppercase font-bold text-xs tracking-wider text-zinc-500">
                                    <tr>
                                        <th className="px-6 py-4">Test Name</th>
                                        <th className="px-6 py-4">Suite</th>
                                        <th className="px-6 py-4">Priority</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Env / Browser</th>
                                        <th className="px-6 py-4">Evidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredRuns.map((test, i) => (
                                        <tr key={i} className="hover:bg-zinc-800/30 transition cursor-pointer group">
                                            <td className="px-6 py-4 font-bold text-zinc-200 group-hover:text-indigo-400 transition flex items-center gap-3">
                                                {getStatusIcon(test.status)} {test.name}
                                            </td>
                                            <td className="px-6 py-4">{test.suite}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${test.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{test.priority || 'P1'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>{test.status}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono">{test.duration}ms</td>
                                            <td className="px-6 py-4 text-xs font-bold"><span className="text-zinc-300">{test.env || 'Default'}</span> <span className="text-zinc-600 px-1">•</span> <span className="text-zinc-500">{test.browser || 'Auto'}</span></td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => { setActiveTab('failures'); setSelectedTest(test.status === 'failed' ? qa.failures.find(f => f.name === test.name) : null); }} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold text-xs"><Terminal className="w-3 h-3"/> View Logs</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredRuns.length === 0 && <div className="text-center p-12 text-zinc-500 font-medium">No tests match your search criteria.</div>}
                        </div>
                    </div>
                );
            case 'coverage':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-zinc-100 mb-8 flex items-center gap-3"><MapIcon className="w-6 h-6 text-indigo-400"/> Codebase Saturation</h3>
                            <div className="flex items-center justify-center relative mb-8">
                                <div className="w-48 h-48 rounded-full border-[10px] border-indigo-500/20 flex flex-col items-center justify-center">
                                    <div className="text-5xl font-black text-indigo-400">{qa.coverage_engine?.overall || 0}%</div>
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Coverage</div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'UI Flow Coverage', val: qa.coverage_engine?.ui_flow, color: 'bg-emerald-500' },
                                    { label: 'API Endpoint Coverage', val: qa.coverage_engine?.api_endpoints, color: 'bg-blue-500' },
                                    { label: 'Critical Path Coverage', val: qa.coverage_engine?.critical_path, color: 'bg-red-500' }
                                ].map((c, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm font-bold text-zinc-400 mb-2"><span>{c.label}</span><span className="text-zinc-200">{c.val}%</span></div>
                                        <div className="w-full bg-zinc-950 rounded-full h-2.5 border border-zinc-800 overflow-hidden">
                                            <div className={`h-full ${c.color}`} style={{width: `${c.val}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
                            <h3 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-3"><Fingerprint className="w-6 h-6 text-amber-400"/> Untested Risk Areas</h3>
                            <div className="flex-1 space-y-4">
                                {qa.coverage_engine?.untested_features?.length > 0 ? qa.coverage_engine.untested_features.map((feat, i) => (
                                    <div key={i} className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0"/>
                                        <div>
                                            <div className="text-red-200 font-bold mb-1">{feat}</div>
                                            <div className="text-red-400/70 text-xs">This feature has 0% automated test coverage. High risk of silent regressions in production.</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50" />
                                        <p>No critical untested areas detected.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'flaky':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {qa.flaky_intelligence?.length > 0 ? qa.flaky_intelligence.map((flake, i) => (
                            <div key={i} className="bg-zinc-900 border border-yellow-500/30 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(234,179,8,0.05)]">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <AlertTriangle className="w-6 h-6 text-yellow-500"/>
                                            <h3 className="text-2xl font-black text-zinc-100">{flake.name}</h3>
                                        </div>
                                        <div className="text-zinc-500 text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4"/> Suite: {flake.suite}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-4xl font-black text-yellow-400">{flake.flake_rate}</div>
                                        <div className="text-xs font-bold text-yellow-500/70 uppercase tracking-widest">Failure Rate</div>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">AI Root Cause Diagnostics</div>
                                        <p className="text-zinc-300 text-sm leading-relaxed">{flake.root_cause}</p>
                                    </div>
                                    <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
                                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Suggested Stabilization Fix</div>
                                        <code className="text-emerald-300 text-sm font-mono block bg-black/30 p-3 rounded-lg border border-emerald-500/20">{flake.suggested_fix}</code>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-zinc-800 pt-6">
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent Outcomes Timeline</div>
                                    <div className="flex items-center gap-2">
                                        {flake.history?.map((h, j) => (
                                            <div key={j} className={`flex-1 h-3 rounded-full ${h === 'passed' ? 'bg-green-500' : 'bg-red-500'}`} title={`Run -${flake.history.length-j}: ${h}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-16 text-center text-zinc-500 flex flex-col items-center justify-center">
                                <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-zinc-300 mb-2">No Flaky Tests Detected</h3>
                                <p>Your test suite execution patterns appear extremely stable across runs.</p>
                            </div>
                        )}
                    </div>
                );
            case 'failures':
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-[700px] animate-in fade-in duration-300">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                                <Bug className="w-6 h-6 text-red-400" /> Triage & Failure Intelligence
                            </h3>
                        </div>
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0d0d12] overflow-y-auto custom-scrollbar p-4 space-y-3">
                                {qa.failures?.length > 0 ? qa.failures.map((f, i) => (
                                    <button key={i} onClick={() => setSelectedTest(f)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTest?.name === f.name ? 'bg-red-500/10 border-red-500/30 shadow-lg' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-bold text-sm text-zinc-200 line-clamp-2">{f.name}</span>
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                                        </div>
                                        <div className="text-xs text-zinc-500 bg-zinc-950 p-2 rounded border border-zinc-800/80 font-mono truncate">{f.error_msg}</div>
                                    </button>
                                )) : (
                                    <div className="text-center text-zinc-500 p-8 font-medium">All tests passing! No failures to triage.</div>
                                )}
                            </div>
                            <div className="w-full md:w-2/3 p-6 overflow-y-auto custom-scrollbar bg-zinc-900">
                                {selectedTest ? (
                                    <motion.div initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} className="space-y-6">
                                        <div className="flex justify-between items-start flex-wrap gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-zinc-100 mb-2">{selectedTest.name}</h2>
                                                <div className="flex gap-3 text-xs font-bold uppercase tracking-wider">
                                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">{selectedTest.type}</span>
                                                    <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg border border-zinc-700">Owner: {selectedTest.owner || 'Unassigned'}</span>
                                                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg">{selectedTest.jira}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {selectedTest.trace && (
                                            <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                                                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Stack Trace Execution Error</div>
                                                <pre className="text-red-200 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{selectedTest.trace}</pre>
                                            </div>
                                        )}

                                        {selectedTest.network_log && (
                                            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Network className="w-4 h-4"/> Network Transport Log</div>
                                                <pre className="text-zinc-300 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{selectedTest.network_log}</pre>
                                            </div>
                                        )}

                                        {selectedTest.ai_hypothesis && (
                                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
                                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> AI Root Cause Hypothesis</div>
                                                <p className="text-indigo-100 text-base leading-relaxed font-medium">{selectedTest.ai_hypothesis}</p>
                                            </div>
                                        )}
                                        
                                        {selectedTest.suggested_fix && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                                                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Remediative Action Patch</div>
                                                <p className="text-emerald-100 text-base font-mono bg-black/40 p-4 rounded-xl border border-emerald-500/20">{selectedTest.suggested_fix}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                                        <Bug className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-xl font-bold">Select an execution failure to analyze</p>
                                        <p className="text-sm mt-2 font-medium">Deep stack traces, DOM snapshots, and AI root causes will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'ci_cd':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-zinc-100 mb-8 flex items-center gap-3"><Monitor className="w-6 h-6 text-blue-400"/> Pipeline Integrations</h3>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-1">System</div>
                                    <div className="text-xl font-bold text-zinc-200">{qa.ci_cd_pipeline?.system || 'Not Configured'}</div>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Last Pipeline Build</div>
                                    <div className={`text-xl font-bold ${qa.ci_cd_pipeline?.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>{qa.ci_cd_pipeline?.build || 'N/A'} - {qa.ci_cd_pipeline?.status}</div>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Triggered By</div>
                                    <div className="text-xl font-bold text-zinc-200">{qa.ci_cd_pipeline?.triggered_by || '-'}</div>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Execution Duration</div>
                                    <div className="text-xl font-bold text-zinc-200">{qa.ci_cd_pipeline?.duration || '-'}</div>
                                </div>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-xl flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-indigo-400">CI/CD Guardrails Active</div>
                                    <div className="text-sm text-indigo-200/70">Merge operations are currently blocked if Release Confidence Score falls below 80.</div>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
                            <h3 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-3"><Clock className="w-6 h-6 text-zinc-400"/> Automation Schedules</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {schedules.length > 0 ? schedules.map((sched, i) => (
                                    <div key={sched.id} className="group flex flex-col p-4 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                                    {sched.name}
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">{sched.type}</span>
                                                </div>
                                                <div className="text-xs font-mono text-zinc-500 mt-1 flex gap-2">
                                                    <span>{sched.trigger}</span> • <span>{sched.time}</span> • <span>{sched.environment}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toggleSchedule(sched.id)}
                                                className={`w-10 h-6 shrink-0 rounded-full p-1 transition-colors ${sched.active ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${sched.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/50 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => runSchedule(sched.id)} className="text-xs font-bold text-green-400 hover:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1"><PlayCircle className="w-3 h-3"/> Run Now</button>
                                            <button onClick={() => deleteSchedule(sched.id)} className="text-xs font-bold text-red-400 hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3"/> Delete</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-zinc-500 p-6 border border-zinc-800 border-dashed rounded-xl">No active schedules configured.</div>
                                )}
                            </div>
                            <button onClick={() => setIsScheduleModalOpen(true)} className="mt-6 w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg">
                                <Plus className="w-4 h-4"/> Configure New Schedule
                            </button>
                        </div>
                    </div>
                );
            case 'api':
            case 'e2e':
                const suiteData = qa[`${activeTab}_tests`] || qa.test_runs?.filter(t => t.suite?.toLowerCase().includes(activeTab)) || [];
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-100 capitalize">{activeTab === 'e2e' ? 'UI / End-to-End' : activeTab} Suite Execution</h3>
                            <button onClick={() => runTests(activeTab)} disabled={isExecuting} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-lg">
                                {isExecuting === activeTab ? <Activity className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4"/>} 
                                {isExecuting === activeTab ? 'Executing Cloud Runners...' : `Trigger ${activeTab.toUpperCase()} Runners`}
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {suiteData.map((test, i) => (
                                <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">{getStatusIcon(test.status)}</div>
                                        <div>
                                            <div className="font-bold text-zinc-200 text-base flex items-center gap-2">
                                                {test.name}
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${test.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{test.priority || 'P1'}</span>
                                            </div>
                                            <div className="text-sm text-zinc-500 mt-1">{test.description || test.suite}</div>
                                            {test.endpoint && <div className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block mt-2 border border-blue-400/20">{test.method || 'GET'} {test.endpoint}</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Environment</div>
                                            <div className="text-sm font-bold text-zinc-300">{test.env || 'Default'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Duration</div>
                                            <div className="text-sm font-mono text-zinc-300">{test.duration}ms</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>{test.status}</span>
                                    </div>
                                </div>
                            ))}
                            {suiteData.length === 0 && (
                                <div className="text-center text-zinc-500 p-16 font-medium bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                                    No tests populated in this suite yet. Check your integration mappings.
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'performance':
                const perfTests = qa.performance_tests || [];
                const perfIntel = qa.performance_intelligence || {};
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400"/> p95 Latency</div>
                                <div className="text-3xl font-black text-amber-400">{perfIntel.p95_latency || 'N/A'}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-red-400"/> p99 Latency</div>
                                <div className="text-3xl font-black text-red-400">{perfIntel.p99_latency || 'N/A'}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-green-400"/> Throughput</div>
                                <div className="text-2xl font-black text-green-400">{perfIntel.throughput || 'N/A'}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><HardDrive className="w-4 h-4 text-blue-400"/> Memory</div>
                                <div className="text-3xl font-black text-blue-400">{perfIntel.memory_consumption || 'N/A'}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Server className="w-4 h-4 text-purple-400"/> CPU Spikes</div>
                                <div className="text-2xl font-black text-purple-400">{perfIntel.cpu_spikes || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400"/> Performance Suite Execution</h3>
                                    <button onClick={() => runTests('performance')} disabled={isExecuting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-lg">
                                        {isExecuting === 'performance' ? <Activity className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4"/>} 
                                        {isExecuting === 'performance' ? 'Running Load...' : `Trigger Load Tests`}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {perfTests.map((test, i) => (
                                        <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">{getStatusIcon(test.status)}</div>
                                                <div>
                                                    <div className="font-bold text-zinc-200 text-base flex items-center gap-2">
                                                        {test.name}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400`}>{test.priority || 'P1'}</span>
                                                    </div>
                                                    {test.endpoint && <div className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded inline-block mt-2 border border-indigo-400/20">{test.endpoint}</div>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Duration</div>
                                                    <div className="text-sm font-mono text-zinc-300">{(test.duration/1000).toFixed(1)}s</div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>{test.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {perfTests.length === 0 && (
                                        <div className="text-center text-zinc-500 p-10 font-medium bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                                            No load tests executed.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col">
                                <h3 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400"/> AI Performance Insights</h3>
                                <div className="flex-1 space-y-4">
                                    {perfIntel.insights?.length > 0 ? perfIntel.insights.map((insight, i) => (
                                        <div key={i} className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5"/>
                                            <p className="text-sm text-yellow-100/90 leading-relaxed font-medium">{insight}</p>
                                        </div>
                                    )) : (
                                        <div className="text-center text-zinc-500 p-10 font-medium bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                                            System performance is optimal.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-16 text-center shadow-xl flex flex-col items-center">
                        <Settings className="w-16 h-16 text-zinc-600 mb-6 animate-spin-slow" />
                        <h3 className="text-2xl font-bold text-zinc-300 mb-3">Module Under Construction</h3>
                        <p className="text-zinc-500 max-w-md">This enterprise feature is currently being provisioned for your workspace.</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Modal for Scheduling */}
            <AnimatePresence>
                {isScheduleModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950/50">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Clock className="w-6 h-6 text-indigo-400"/> Configure New Schedule</h2>
                                <button onClick={() => setIsScheduleModalOpen(false)} className="text-zinc-500 hover:text-white transition"><X className="w-6 h-6"/></button>
                            </div>
                            
                            <form onSubmit={handleSaveSchedule} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Schedule Name <span className="text-red-500">*</span></label>
                                    <input required value={newSchedule.name} onChange={e => setNewSchedule({...newSchedule, name: e.target.value})} autoFocus placeholder="e.g. Nightly Core Regression" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Test Suite Type</label>
                                        <select value={newSchedule.type} onChange={e => setNewSchedule({...newSchedule, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
                                            <option>Smoke</option>
                                            <option>Regression</option>
                                            <option>API Tests</option>
                                            <option>UI / E2E</option>
                                            <option>Performance</option>
                                            <option>Security QA</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Environment</label>
                                        <select value={newSchedule.environment} onChange={e => setNewSchedule({...newSchedule, environment: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
                                            <option>Dev</option>
                                            <option>QA</option>
                                            <option>Staging</option>
                                            <option>Prod-Smoke</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Trigger Type</label>
                                        <select value={newSchedule.trigger} onChange={e => setNewSchedule({...newSchedule, trigger: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
                                            <option>Time Based</option>
                                            <option>On Pull Request</option>
                                            <option>On Deployment</option>
                                            <option>Cron Expression</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Execution Time / Value</label>
                                        <input required value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} placeholder="e.g. 02:00 AM or main branch" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Advanced Settings</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
                                            <span className="group-hover:text-white transition">Retry Failed Tests Only</span>
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
                                            <span className="group-hover:text-white transition">Capture Screenshots</span>
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
                                            <span className="group-hover:text-white transition">Generate PDF Report</span>
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
                                            <span className="group-hover:text-white transition">Block Release on Fail</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition">Cancel</button>
                                    <button type="submit" disabled={isSaving || !newSchedule.name} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                        {isSaving ? <Activity className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />} Save Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                
                {isExecuting === 'all' && executionStep > 0 && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-[0_0_100px_rgba(79,70,229,0.15)] w-full max-w-xl p-8 text-center"
                        >
                            <Activity className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                            <h2 className="text-3xl font-black text-white mb-8">Enterprise Test Orchestration</h2>
                            <div className="space-y-4 text-left">
                                {[
                                    { step: 1, label: "Repository Ingestion & KB Sync" },
                                    { step: 2, label: "Risk Analysis & Impact Mapping" },
                                    { step: 3, label: "Test Discovery & Structure Parse" },
                                    { step: 4, label: "AI Test Generation Engine Active" },
                                    { step: 5, label: "Executing Simulated Pipelines (E2E/API/Perf)" },
                                    { step: 6, label: "Analyzing Failures & Triaging Logs" },
                                    { step: 7, label: "Generating Release Recommendation" }
                                ].map(s => (
                                    <div key={s.step} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${executionStep > s.step ? 'bg-green-500/10 border-green-500/30' : executionStep === s.step ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-950 border-zinc-800/50'}`}>
                                        {executionStep > s.step ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : executionStep === s.step ? <Activity className="w-6 h-6 text-indigo-500 animate-pulse" /> : <div className="w-6 h-6 rounded-full border-2 border-zinc-700" />}
                                        <span className={`font-bold ${executionStep >= s.step ? 'text-white' : 'text-zinc-600'}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header & Main KPIs */}
            <div className="flex flex-col xl:flex-row gap-6 bg-gradient-to-br from-zinc-900 to-[#060608] p-8 rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="flex-1 space-y-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"><Terminal className="w-8 h-8 text-indigo-400"/></div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">QA Command Center</h1>
                                <div className="flex gap-4 text-sm font-bold text-zinc-500 mt-2 uppercase tracking-widest">
                                    <span>Enterprise CI/CD Guardrail</span> <span className="text-zinc-700">•</span> <span>AI-Driven Analysis</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => runTests('all')} disabled={isExecuting} className="px-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 text-sm md:text-base">
                            {isExecuting === 'all' ? <Activity className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 h-5"/>} Execute Full Platform Suite
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3"/> Total Tests</div>
                            <div className="text-3xl font-black text-white">{qa.overview.total_tests || 0}</div>
                        </div>
                        <div className="bg-gradient-to-b from-green-500/10 to-transparent p-4 rounded-2xl border border-green-500/20">
                            <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> Passed</div>
                            <div className="text-3xl font-black text-green-400">{qa.overview.passed_tests || 0}</div>
                        </div>
                        <div className="bg-gradient-to-b from-red-500/10 to-transparent p-4 rounded-2xl border border-red-500/20">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><XCircle className="w-3 h-3"/> Failed</div>
                            <div className="text-3xl font-black text-red-400">{qa.overview.failed_tests || 0}</div>
                        </div>
                        <div className="bg-gradient-to-b from-yellow-500/10 to-transparent p-4 rounded-2xl border border-yellow-500/20">
                            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3"/> Flaky</div>
                            <div className="text-3xl font-black text-yellow-400">{qa.overview.flaky_tests || 0}</div>
                        </div>
                        <div className="bg-gradient-to-b from-blue-500/10 to-transparent p-4 rounded-2xl border border-blue-500/20">
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapIcon className="w-3 h-3"/> Coverage</div>
                            <div className="text-3xl font-black text-blue-400">{qa.overview.coverage || '0%'}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full xl:w-[320px] shrink-0 flex flex-col justify-center bg-black/40 p-6 rounded-3xl border border-zinc-800/80 relative z-10 shadow-inner">
                    <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 text-center">Release Confidence Gate</div>
                    <div className="flex justify-center mb-6">
                        <div className={`flex items-center justify-center w-36 h-36 rounded-full border-[6px] text-6xl font-black tracking-tighter ${qa.overview.release_score > 80 ? 'text-green-400 border-green-500 shadow-[0_0_40px_rgba(74,222,128,0.2)]' : qa.overview.release_score > 60 ? 'text-yellow-400 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]' : 'text-red-500 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]'}`}>
                            {qa.overview.release_score || 0}
                        </div>
                    </div>
                    <div className={`w-full py-3 rounded-xl text-center font-black uppercase tracking-wider text-sm border ${qa.overview.release_score > 80 ? 'bg-green-500 text-black border-green-500' : 'bg-red-500 text-black border-red-500'}`}>
                        {qa.overview.release_decision || 'Analyzing...'}
                    </div>
                    {qa.overview.block_reasons?.length > 0 && (
                        <div className="mt-4 text-xs font-medium text-red-400/80 text-center">
                            Blocked by: {qa.overview.block_reasons.length} Critical Regressions
                        </div>
                    )}
                </div>
            </div>

            {/* Modular Navigation System */}
            <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl shadow-lg sticky top-4 z-50 overflow-x-auto custom-scrollbar">
                <div className="flex gap-1 min-w-max">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4"/> },
                        { id: 'test_runs', label: 'Test Runs', icon: <Database className="w-4 h-4"/> },
                        { id: 'api', label: 'API Tests', icon: <Server className="w-4 h-4"/> },
                        { id: 'e2e', label: 'UI / E2E', icon: <Monitor className="w-4 h-4"/> },
                        { id: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4"/> },
                        { id: 'coverage', label: 'Coverage', icon: <MapIcon className="w-4 h-4"/> },
                        { id: 'flaky', label: 'Flaky Intelligence', icon: <RotateCcw className="w-4 h-4"/> },
                        { id: 'failures', label: 'Failure Triage', icon: <Bug className="w-4 h-4"/> },
                        { id: 'ci_cd', label: 'CI/CD Pipelines', icon: <Layers className="w-4 h-4"/> },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {renderTabContent()}
            </div>
        </div>
    );
}
