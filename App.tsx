
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Database, ShieldAlert, FileCode, Lock, Settings as SettingsIcon, Menu, X, ScrollText, UserCircle, Loader2, Cable, LogOut, Clock, DatabaseZap, WifiOff, CloudAlert, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import RiskAnalyzer from './components/RiskAnalyzer';
import RecordsRegistry from './components/RecordsRegistry';
import PoliciesRules from './components/PoliciesRules';
import SecurityAudit from './components/SecurityAudit';
import Settings from './components/Settings';
import ConnectorsManager from './components/ConnectorsManager';
import Login from './components/Login';
import { db } from './services/dbService';
import { UserRole, UserProfile } from './types';

// Brand Logo Component
const RekamaLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 9V23L16 30L28 23V9L16 2Z" fill="url(#paint0_linear)" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 30V16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16L4 9" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16L28 9" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="16" r="3" fill="#10B981"/>
    <defs>
      <linearGradient id="paint0_linear" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E293B"/>
        <stop offset="1" stopColor="#0F172A"/>
      </linearGradient>
    </defs>
  </svg>
);

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Database Setup State
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async (reason?: string) => {
      if (user) {
        await db.logout();
        setUser(null);
      }
  }, [user]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
        handleLogout('TIMEOUT');
    }, INACTIVITY_LIMIT_MS);
  }, [handleLogout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetIdleTimer();
    return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  useEffect(() => {
    const init = async () => {
        try {
            const u = await db.getUser();
            setUser(u);
            setIsDbConnected(db.isConfigured);
            setShowDbSetup(!db.isConfigured);
        } catch (e) {
            console.error("Initialization failure", e);
        } finally {
            setInitializing(false);
        }
    };
    init();
  }, []);

  const handleDbSetup = async (e: React.FormEvent) => {
      e.preventDefault();
      setSetupLoading(true);
      setSetupError('');
      
      const success = await db.configure(setupUrl, setupKey);
      if (success) {
          setIsDbConnected(true);
          setShowDbSetup(false);
      } else {
          setSetupError('Handshake failed. Verify the URL and Anon Key are correct and that your Supabase tables are initialized.');
      }
      setSetupLoading(false);
  };

  if (initializing) {
      return (
          <div className="flex h-screen w-full bg-slate-900 items-center justify-center flex-col gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium tracking-wide">Rekama | Initializing Governance Engine...</p>
          </div>
      );
  }

  // If DB is not connected, show the Setup screen (Production requirement)
  if (showDbSetup) {
      return (
        <div className="flex h-screen w-full bg-slate-950 items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                        <LinkIcon size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Connect Infrastructure</h1>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-sm">
                        Rekama requires a persistent <strong>PostgreSQL</strong> backend via Supabase to ensure immutable audit trails and enterprise-grade records management.
                    </p>
                </div>

                <form onSubmit={handleDbSetup} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Supabase Project URL</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all"
                            placeholder="https://your-project.supabase.co"
                            value={setupUrl}
                            onChange={e => setSetupUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Supabase Anon Key</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={setupKey}
                            onChange={e => setSetupKey(e.target.value)}
                        />
                    </div>

                    {setupError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-xs text-red-400 font-medium animate-shake">
                            <CloudAlert size={18} /> {setupError}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={setupLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {setupLoading ? <Loader2 className="animate-spin" size={20} /> : <><DatabaseZap size={20}/> INITIALIZE HANDSHAKE</>}
                    </button>
                </form>

                <div className="mt-8 p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
                    <ShieldCheck className="text-blue-500 shrink-0" size={16} />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Credentials are stored in your browser's secure context. For production environments, use the <code>.env</code> file configuration as described in the platform README.
                    </p>
                </div>
            </div>
        </div>
      );
  }

  if (!user) {
      return <Login onLogin={setUser} />;
  }

  const MODULE_ACCESS: Record<string, UserRole[]> = {
    'dashboard': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.RecordsOfficer, UserRole.LegalAnalyst, UserRole.Auditor],
    'connectors': [UserRole.SysAdmin, UserRole.ComplianceManager],
    'knowledge': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.RecordsOfficer, UserRole.LegalAnalyst],
    'risk': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.RecordsOfficer],
    'records': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.RecordsOfficer, UserRole.LegalAnalyst, UserRole.Auditor],
    'policies': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.RecordsOfficer, UserRole.LegalAnalyst, UserRole.Auditor],
    'audit': [UserRole.SysAdmin, UserRole.ComplianceManager, UserRole.Auditor],
    'settings': [UserRole.SysAdmin, UserRole.ComplianceManager],
  };

  const hasAccess = (moduleId: string) => MODULE_ACCESS[moduleId].includes(user.role);

  const menuGroups = [
    { label: 'Overview', items: [{ id: 'dashboard', label: 'Data Sentinel', icon: LayoutDashboard }] },
    { label: 'Discovery', items: [
        { id: 'connectors', label: 'Data Connectors', icon: Cable },
        { id: 'knowledge', label: 'Knowledge Base', icon: Database },
        { id: 'risk', label: 'Risk Analyzer', icon: ShieldAlert },
    ]},
    { label: 'Governance', items: [
        { id: 'records', label: 'Records Registry', icon: FileCode },
        { id: 'policies', label: 'Policies & Rules', icon: ScrollText },
    ]},
    { label: 'System', items: [
        { id: 'audit', label: 'Security & Audit', icon: Lock },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ]}
  ];

  const renderModule = () => {
    if (!hasAccess(activeModule)) {
       return (
           <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
               <Lock className="w-16 h-16 mb-4 text-red-500/50" />
               <h2 className="text-xl font-bold text-white mb-2">Unauthorized Resource</h2>
               <p>Your persona ({user.role}) lacks sufficient clearance for this module.</p>
           </div>
       );
    }
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'connectors': return <ConnectorsManager />;
      case 'knowledge': return <KnowledgeBase />;
      case 'risk': return <RiskAnalyzer />;
      case 'records': return <RecordsRegistry />;
      case 'policies': return <PoliciesRules />;
      case 'audit': return <SecurityAudit />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const currentModuleLabel = menuGroups.flatMap(g => g.items).find(i => i.id === activeModule)?.label;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <RekamaLogo />
                <span className="text-xl font-bold tracking-tight text-white uppercase">Rekama</span>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
            </button>
        </div>
        
        <nav className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuGroups.map((group, groupIdx) => {
              const visibleItems = group.items.filter(item => hasAccess(item.id));
              if (visibleItems.length === 0) return null;
              return (
                <div key={groupIdx}>
                    <h3 className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">{group.label}</h3>
                    <div className="space-y-1">
                        {visibleItems.map(item => (
                            <button
                            key={item.id}
                            onClick={() => { setActiveModule(item.id); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                                activeModule === item.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-500' 
                                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300 border border-transparent'
                            }`}
                            >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
              );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                        {user.avatar || user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate w-24">{user.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter truncate">
                            {user.role}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleLogout()}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="lg:hidden p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <RekamaLogo />
                <span className="font-bold text-white">Rekama Systems</span>
             </div>
             <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300"><Menu /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                          <ShieldAlert size={12} /> Enterprise Governance Node
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">{currentModuleLabel}</h1>
                        <p className="text-slate-400 text-sm mt-2 font-medium max-w-xl">
                            {activeModule === 'dashboard' && 'Holistic visualization of enterprise data risk, compliance metrics, and discovery velocity.'}
                            {activeModule === 'connectors' && 'Map and index external storage environments in-place without data migration.'}
                            {activeModule === 'knowledge' && 'AI-augmented retrieval of corporate intelligence across indexed nodes.'}
                            {activeModule === 'risk' && 'Deep scanning of unstructured data for PII and regulatory compliance gaps.'}
                            {activeModule === 'records' && 'Defensible lifecycle management and legal hold orchestration.'}
                            {activeModule === 'policies' && 'Dynamic drafting and gap analysis of governance frameworks.'}
                            {activeModule === 'audit' && 'Forensic auditing of all system interactions and data mutations.'}
                            {activeModule === 'settings' && 'Core platform configuration and identity management.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDbConnected ? (
                            <span className="text-[10px] px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-2 font-bold shadow-sm">
                                <DatabaseZap size={14} className="animate-pulse" /> CLOUD POSTGRES ACTIVE
                            </span>
                        ) : (
                            <span className="text-[10px] px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center gap-2 font-bold shadow-sm">
                                <CloudAlert size={14} /> DATABASE ERROR
                            </span>
                        )}
                        {process.env.API_KEY ? 
                            <span className="text-[10px] px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold shadow-sm">AI SENTINEL ONLINE</span>
                            :
                            <span className="text-[10px] px-3 py-1.5 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full font-bold">AI OFFLINE</span>
                        }
                    </div>
                </header>
                <div className="flex-1">
                    {renderModule()}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
