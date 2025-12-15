import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { GeminiService } from '../services/geminiService';
import { AuditLog, UserRole, UserProfile } from '../types';
import { Lock, Search, AlertOctagon, User, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

const SecurityAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const init = async () => {
        const u = await db.getUser();
        setUser(u);
        if (u.role === UserRole.Admin) {
             const l = await db.getLogs();
             setLogs(l);
        }
    };
    init();

    // Poll for logs
    const interval = setInterval(async () => {
        if (user && user.role === UserRole.Admin) {
            const l = await db.getLogs();
            setLogs(l);
        }
    }, 5000);
    return () => clearInterval(interval);
  }, []); // Dependence on user/role handled within loop if user state was stable, but for initial load OK

  if (!user) return null;

  const isAdmin = user.role === UserRole.Admin;

  if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Lock className="w-16 h-16 mb-4 text-red-500/50" />
              <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
              <p>Security Audit logs are restricted to Administrators only.</p>
          </div>
      );
  }

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Analyze top 50 logs
    const logText = logs.slice(0, 50).map(l => `[${l.timestamp}] ${l.user} performed ${l.action} on ${l.resource} (Severity: ${l.severity})`).join('\n');
    const result = await GeminiService.analyzeLogs(logText);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Analysis Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col md:flex-row gap-6">
        <div className="flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <ShieldCheck className="text-green-400" /> AI Anomaly Detection
            </h2>
            <p className="text-slate-400 text-sm mb-4">
                The AI sentinel continuously reviews logs for suspicious patterns such as mass exports, failed authentication spikes, or off-hours access.
            </p>
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <AlertOctagon size={18}/>}
                {isAnalyzing ? 'Scanning Logs...' : 'Run Forensic Analysis'}
            </button>
        </div>
        <div className="flex-[2] bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-y-auto max-h-40 relative">
            {analysis ? (
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                    {analysis}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                    No active threat analysis report. Run analysis to detect anomalies.
                </div>
            )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Immutable Audit Trail</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                />
            </div>
        </div>
        <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900 text-slate-200 uppercase font-medium sticky top-0">
                    <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Resource</th>
                        <th className="px-6 py-3 text-right">Severity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-700/30">
                            <td className="px-6 py-3 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-3 flex items-center gap-2">
                                <User size={14} /> {log.user}
                            </td>
                            <td className="px-6 py-3">
                                <span className="bg-slate-700/50 px-2 py-0.5 rounded text-white">{log.action}</span>
                            </td>
                            <td className="px-6 py-3 text-slate-300">{log.resource}</td>
                            <td className="px-6 py-3 text-right">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.severity === 'Critical' ? 'text-red-500 bg-red-500/10' :
                                    log.severity === 'High' ? 'text-orange-500 bg-orange-500/10' :
                                    log.severity === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' :
                                    'text-green-500 bg-green-500/10'
                                }`}>
                                    {log.severity}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                No logs matching search criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;