import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { GeminiService } from '../services/geminiService';
import { Policy, UserRole, UserProfile, RetentionSchedule } from '../types';
import { FilePlus, Scale, Book, Save, Loader2, ArrowRight, Lock, Calendar, Trash2 } from 'lucide-react';

const PoliciesRules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'schedules' | 'drafter' | 'compare'>('library');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [schedules, setSchedules] = useState<RetentionSchedule[]>([]);
  
  // Drafter State
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftResult, setDraftResult] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  // Compare State
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [comparisonResult, setComparisonResult] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const init = async () => {
        const u = await db.getUser();
        setUser(u);
        const p = await db.getPolicies();
        setPolicies(p);
        const s = await db.getSchedules();
        setSchedules(s);
    };
    init();
  }, []);

  if(!user) return null;

  const canEdit = user.role === UserRole.Admin || user.role === UserRole.Officer;
  const canDelete = user.role === UserRole.Admin;

  const refreshData = async () => {
      setPolicies(await db.getPolicies());
      setSchedules(await db.getSchedules());
  };

  // ... (Draft/Compare handlers same as before) ...
  const handleDraft = async () => {
    if(!draftPrompt) return;
    setIsDrafting(true);
    const result = await GeminiService.draftPolicy(draftPrompt);
    setDraftResult(result);
    try {
        const json = JSON.parse(result);
        if(json.policy_name) setDraftTitle(json.policy_name);
    } catch (e) {
        setDraftTitle("New Policy");
    }
    setIsDrafting(false);
  };

  const handleSavePolicy = async () => {
    if(!draftResult) return;
    const newPolicy: Policy = {
        id: `pol_${Date.now()}`,
        name: draftTitle || "Untitled Policy",
        description: "AI Generated Policy",
        content: draftResult,
        createdAt: new Date().toISOString()
    };
    await db.addPolicy(newPolicy);
    refreshData();
    setActiveTab('library');
    setDraftPrompt('');
    setDraftResult('');
    setDraftTitle('');
  };

  const handleCompare = async () => {
    if(!compareA || !compareB || compareA === compareB) return;
    setIsComparing(true);
    const polA = policies.find(p => p.id === compareA);
    const polB = policies.find(p => p.id === compareB);
    if(polA && polB) {
        const result = await GeminiService.comparePolicies(JSON.stringify(polA.content), JSON.stringify(polB.content));
        setComparisonResult(result);
    }
    setIsComparing(false);
  };

  return (
    <div className="h-full flex flex-col gap-6">
       <div className="flex border-b border-slate-700 mb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('library')} className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'library' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
             <Book size={16} /> Policy Library
          </button>
          <button onClick={() => setActiveTab('schedules')} className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'schedules' ? 'border-green-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
             <Calendar size={16} /> Retention Schedules
          </button>
          <button onClick={() => setActiveTab('drafter')} className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafter' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
             <FilePlus size={16} /> AI Drafter
          </button>
          <button onClick={() => setActiveTab('compare')} className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'compare' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
             <Scale size={16} /> Comparator
          </button>
       </div>

       <div className="flex-1 overflow-hidden">
         {/* Library Tab */}
         {activeTab === 'library' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-full pb-4">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors shadow-lg flex flex-col">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{policy.name}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-3">{policy.description}</p>
                            <div className="bg-slate-900 p-3 rounded text-xs font-mono text-slate-500 h-32 overflow-hidden relative">
                                {policy.content}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
                             <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
                             {canDelete && (
                                <button onClick={async () => { await db.deletePolicy(policy.id); refreshData(); }} className="text-red-400 hover:text-red-300">Delete</button>
                             )}
                        </div>
                    </div>
                ))}
            </div>
         )}

         {/* Retention Schedules Tab (New) */}
         {activeTab === 'schedules' && (
             <div className="h-full flex flex-col">
                 <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 flex flex-col">
                     <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                         <div>
                             <h3 className="text-white font-bold">Records Authority</h3>
                             <p className="text-xs text-slate-400">Map classifications to specific disposal triggers.</p>
                         </div>
                     </div>
                     <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-200 uppercase font-medium sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Retention Period</th>
                                    <th className="px-6 py-4">Trigger Event</th>
                                    {canDelete && <th className="px-6 py-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {schedules.map(sch => (
                                    <tr key={sch.id} className="hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-mono text-blue-400 font-bold">{sch.code}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{sch.name}</p>
                                            <p className="text-xs">{sch.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white">{sch.retentionYears} Years</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                                                {sch.trigger}
                                            </span>
                                        </td>
                                        {canDelete && (
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={async () => { await db.deleteSchedule(sch.id); refreshData(); }} className="hover:text-red-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
             </div>
         )}

         {/* Drafter Tab */}
         {activeTab === 'drafter' && (
             !canEdit ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                    <Lock className="w-12 h-12 mb-2 opacity-50" />
                    <p>Policy drafting is restricted to Officers and Admins.</p>
                </div>
             ) : (
             <div className="flex h-full gap-6">
                 <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
                     <h3 className="text-white font-bold mb-4">Describe Requirements</h3>
                     <textarea 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-mono text-sm"
                        placeholder="e.g., Draft a remote work security policy..."
                        value={draftPrompt}
                        onChange={e => setDraftPrompt(e.target.value)}
                     />
                     <button 
                        onClick={handleDraft}
                        disabled={isDrafting || !draftPrompt}
                        className="mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isDrafting ? <Loader2 className="animate-spin" /> : <FilePlus size={18} />}
                        {isDrafting ? 'Generating Policy...' : 'Generate Policy Structure'}
                     </button>
                 </div>
                 <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">Generated JSON</h3>
                        {draftResult && (
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={draftTitle} 
                                    onChange={e => setDraftTitle(e.target.value)}
                                    placeholder="Policy Name"
                                    className="bg-slate-900 border border-slate-700 rounded px-2 text-sm text-white"
                                />
                                <button onClick={handleSavePolicy} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                    <Save size={14} /> Save
                                </button>
                            </div>
                        )}
                     </div>
                     <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto whitespace-pre-wrap">
                        {draftResult || "// AI Output will appear here..."}
                     </div>
                 </div>
             </div>
             )
         )}

         {/* Compare Tab */}
         {activeTab === 'compare' && (
            <div className="h-full flex flex-col">
                <div className="grid grid-cols-2 gap-6 mb-6">
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                         <label className="block text-sm text-slate-400 mb-2">Policy A</label>
                         <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={compareA} onChange={e => setCompareA(e.target.value)}>
                             <option value="">Select Policy...</option>
                             {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                     </div>
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                         <label className="block text-sm text-slate-400 mb-2">Policy B</label>
                         <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={compareB} onChange={e => setCompareB(e.target.value)}>
                             <option value="">Select Policy...</option>
                             {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                     </div>
                </div>
                
                <div className="flex justify-center mb-6">
                    <button 
                        onClick={handleCompare}
                        disabled={isComparing || !compareA || !compareB || compareA === compareB}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                         {isComparing ? <Loader2 className="animate-spin" /> : <Scale size={18} />}
                         Run Comparison Analysis
                    </button>
                </div>

                <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 overflow-hidden flex flex-col">
                    <h3 className="text-white font-bold mb-4">Analysis Report</h3>
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-6 overflow-y-auto">
                        {comparisonResult ? (
                            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                                {comparisonResult}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">
                                Select two policies to view conflict analysis.
                            </div>
                        )}
                    </div>
                </div>
            </div>
         )}
       </div>
    </div>
  );
};

export default PoliciesRules;