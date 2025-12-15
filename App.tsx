import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, ShieldAlert, FileCode, Lock, Settings as SettingsIcon, Menu, X, ScrollText, UserCircle, Loader2, Cable } from 'lucide-react';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import RiskAnalyzer from './components/RiskAnalyzer';
import RecordsRegistry from './components/RecordsRegistry';
import PoliciesRules from './components/PoliciesRules';
import SecurityAudit from './components/SecurityAudit';
import Settings from './components/Settings';
import ConnectorsManager from './components/ConnectorsManager';
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

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUser = async () => {
        try {
            const u = await db.getUser();
            setUser(u);
        } catch (e) {
            console.error("Failed to load user profile", e);
        }
    };
    loadUser();
  }, []);

  if (!user) {
      return (
          <div className="flex h-screen w-full bg-slate-900 items-center justify-center flex-col gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-400">Initializing Secure Environment...</p>
          </div>
      );
  }

  // Define module permissions
  const MODULE_ACCESS: Record<string, UserRole[]> = {
    'dashboard': [UserRole.Admin, UserRole.Officer, UserRole.Viewer],
    'connectors': [UserRole.Admin, UserRole.Officer],
    'knowledge': [UserRole.Admin, UserRole.Officer, UserRole.Viewer],
    'risk': [UserRole.Admin, UserRole.Officer],
    'records': [UserRole.Admin, UserRole.Officer, UserRole.Viewer],
    'policies': [UserRole.Admin, UserRole.Officer, UserRole.Viewer],
    'audit': [UserRole.Admin],
    'settings': [UserRole.Admin, UserRole.Officer],
  };

  const hasAccess = (moduleId: string) => {
      return MODULE_ACCESS[moduleId].includes(user.role);
  };

  // Logical grouping for Information Architecture
  const menuGroups = [
    {
        label: 'Overview',
        items: [
            { id: 'dashboard', label: 'Data Sentinel', icon: LayoutDashboard },
        ]
    },
    {
        label: 'Discovery',
        items: [
            { id: 'connectors', label: 'Data Connectors', icon: Cable },
            { id: 'knowledge', label: 'Knowledge Base', icon: Database },
            { id: 'risk', label: 'Risk Analyzer', icon: ShieldAlert },
        ]
    },
    {
        label: 'Governance',
        items: [
            { id: 'records', label: 'Records Registry', icon: FileCode },
            { id: 'policies', label: 'Policies & Rules', icon: ScrollText },
        ]
    },
    {
        label: 'System',
        items: [
            { id: 'audit', label: 'Security & Audit', icon: Lock },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ]
    }
  ];

  const renderModule = () => {
    // Security check
    if (!hasAccess(activeModule)) {
       return (
           <div className="flex flex-col items-center justify-center h-full text-slate-500">
               <Lock className="w-16 h-16 mb-4 text-red-500/50" />
               <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
               <p>Your role ({user.role}) does not have permission to view this module.</p>
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

  // Find current label for header
  const currentModuleLabel = menuGroups
    .flatMap(g => g.items)
    .find(i => i.id === activeModule)?.label;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <RekamaLogo />
                <span className="text-xl font-bold tracking-tight text-white">Rekama</span>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
            </button>
        </div>
        
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuGroups.map((group, groupIdx) => {
              const visibleItems = group.items.filter(item => hasAccess(item.id));
              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIdx}>
                    <h3 className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</h3>
                    <div className="space-y-1">
                        {visibleItems.map(item => (
                            <button
                            key={item.id}
                            onClick={() => { setActiveModule(item.id); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                                activeModule === item.id 
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm shadow-blue-500/10' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
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

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-bold border border-slate-700 shadow-inner">
                    {user.avatar || 'U'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                        <UserCircle size={10} /> {user.role}
                    </p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <RekamaLogo />
                <span className="font-bold text-white">Rekama Systems</span>
             </div>
             <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300"><Menu /></button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{currentModuleLabel}</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {activeModule === 'dashboard' && 'System Overview & Threat Landscape'}
                            {activeModule === 'connectors' && 'Manage Data Source Connectivity'}
                            {activeModule === 'knowledge' && 'RAG Powered Data Retrieval'}
                            {activeModule === 'risk' && 'Instant Compliance Analysis'}
                            {activeModule === 'records' && 'Master Inventory & Lifecycle Management'}
                            {activeModule === 'policies' && 'AI Policy Drafting & Comparison'}
                            {activeModule === 'audit' && 'Forensic Logging & Anomaly Detection'}
                            {activeModule === 'settings' && 'System Configuration & Data Management'}
                        </p>
                    </div>
                    {process.env.API_KEY ? 
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.2)]">Gemini Connected</span>
                        :
                        <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">No API Key</span>
                    }
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