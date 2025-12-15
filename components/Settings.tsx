import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Database, Trash2, Download, CheckCircle, AlertTriangle, UserCog, Users, Plus, X, LogIn, FileBadge } from 'lucide-react';
import { db } from '../services/dbService';
import { AppSettings, UserRole, UserProfile } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data' | 'team' | 'compliance'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [stats, setStats] = useState({ records: 0, policies: 0, logs: 0 });
  
  // User Management State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserProfile>>({ role: UserRole.Viewer });

  useEffect(() => {
    const init = async () => {
        const s = await db.getSettings();
        setSettings(s);
        const u = await db.getUser();
        setUser(u);
        const r = await db.getRecords();
        const p = await db.getPolicies();
        const l = await db.getLogs();
        setStats({
            records: r.length,
            policies: p.length,
            logs: l.length
        });

        // Load users if admin
        const users = await db.getAllUsers();
        setAllUsers(users);
    };
    init();
  }, []);

  if (!settings || !user) return null;

  const handleSave = async () => {
    await db.saveSettings(settings);
    // Update session user profile details (not role/id, just metadata)
    await db.updateUser(user);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    
    await db.addLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'UPDATE_CONFIGURATION',
        resource: 'System Settings',
        severity: 'Medium'
    });
  };

  const handleExport = async () => {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekama_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    await db.addLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'DATA_EXPORT',
        resource: 'All System Data',
        severity: 'Medium'
    });
  };

  // --- User Management Handlers ---

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    const userToAdd: UserProfile = {
        id: `usr_${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || UserRole.Viewer,
        avatar: newUser.name.substring(0,2).toUpperCase(),
        lastLogin: new Date().toISOString()
    };
    await db.addUser(userToAdd);
    setAllUsers(await db.getAllUsers());
    setShowAddUserModal(false);
    setNewUser({ role: UserRole.Viewer });
    await db.addLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'CREATE_USER',
        resource: userToAdd.email,
        severity: 'High'
    });
  };

  const handleDeleteUser = async (id: string) => {
      if (id === user.id) {
          alert("You cannot delete your own active account.");
          return;
      }
      if (confirm("Are you sure you want to remove this user?")) {
          await db.deleteUser(id);
          setAllUsers(await db.getAllUsers());
          await db.addLog({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.email,
            action: 'DELETE_USER',
            resource: id,
            severity: 'High'
          });
      }
  };

  const handleSwitchIdentity = async (targetId: string) => {
      if (targetId === user.id) return;
      if (confirm("Switch session to this user? The page will reload.")) {
          await db.switchUserSession(targetId);
          window.location.reload();
      }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Settings Sidebar */}
      <div className="w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-4 h-fit">
        <h2 className="text-white font-bold mb-4 px-2">System Settings</h2>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeTab === 'general' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            <User size={18} /> Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeTab === 'notifications' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            <Bell size={18} /> Notifications
          </button>
          {user.role === UserRole.Admin && (
            <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeTab === 'team' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
                <Users size={18} /> Team & Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeTab === 'data' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            <Database size={18} /> Data & Privacy
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeTab === 'compliance' ? 'bg-green-600/10 text-green-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            <FileBadge size={18} /> ISO Compliance
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-8 overflow-y-auto relative">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Your Profile</h3>
                <p className="text-slate-400 text-sm">Manage your personal details and session.</p>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                    {user.avatar || 'U'}
                </div>
                <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{user.name}</h4>
                    <p className="text-slate-400 mb-2">{user.email}</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.Admin ? 'bg-purple-500/20 text-purple-300' :
                        user.role === UserRole.Officer ? 'bg-blue-500/20 text-blue-300' :
                        'bg-slate-500/20 text-slate-300'
                    }`}>
                        <UserCog size={12} /> {user.role}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={user.name}
                        onChange={e => setUser({...user, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={user.email}
                        onChange={e => setUser({...user, email: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Organization Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name</label>
                        <input 
                            type="text" 
                            value={settings.organizationName}
                            onChange={e => setSettings({...settings, organizationName: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Team Tab (RBAC) */}
        {activeTab === 'team' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">User Management</h3>
                        <p className="text-slate-400 text-sm">Control access via Role-Based Access Control (RBAC).</p>
                    </div>
                    <button 
                        onClick={() => setShowAddUserModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Plus size={16} /> Add User
                    </button>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {allUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                            {u.avatar || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{u.name}</p>
                                            <p className="text-xs">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                            u.role === UserRole.Admin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            u.role === UserRole.Officer ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {u.id !== user.id ? (
                                            <>
                                                <button 
                                                    onClick={() => handleSwitchIdentity(u.id)}
                                                    className="p-1.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded transition-colors"
                                                    title="Switch Identity (Login as)"
                                                >
                                                    <LogIn size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-green-500 px-2 py-1 bg-green-900/20 rounded">Current Session</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Compliance Tab (New) */}
        {activeTab === 'compliance' && (
            <div className="space-y-6 max-w-3xl animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">ISO Standard Compliance</h3>
                    <p className="text-slate-400 text-sm">System configuration alignment with international standards.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-bold">ISO 15489</h4>
                            <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900/40">Implemented</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Records Management Concepts</p>
                        <ul className="text-xs text-slate-300 space-y-2">
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Classification Scheme</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Retention Schedules</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Secure Disposition</li>
                        </ul>
                    </div>
                    
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-bold">ISO 16175</h4>
                            <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900/40">Implemented</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Digital Records Integrity</p>
                        <ul className="text-xs text-slate-300 space-y-2">
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> SHA-256 Checksums</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Metadata Capturing</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Version Control</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-bold">ISO 30301</h4>
                            <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900/40">Implemented</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Management Systems</p>
                        <ul className="text-xs text-slate-300 space-y-2">
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Policy Enforcement</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Roles & Responsibilities (RBAC)</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Performance Evaluation</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-bold">ISO 27002</h4>
                            <span className="text-yellow-400 text-xs bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/40">Partial</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Information Security Controls</p>
                        <ul className="text-xs text-slate-300 space-y-2">
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Access Control (A.9)</li>
                            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-500"/> Logging (A.12.4)</li>
                            <li className="flex items-center gap-2"><AlertTriangle size={12} className="text-yellow-500"/> Cryptography (A.10) (Client-side only)</li>
                        </ul>
                    </div>
                </div>
            </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
             <div>
                <h3 className="text-xl font-bold text-white mb-1">Alerts & Automation</h3>
                <p className="text-slate-400 text-sm">Configure how Rekama communicates risks and automated actions.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div>
                        <p className="text-white font-medium">Auto-Scan New Uploads</p>
                        <p className="text-xs text-slate-400">Automatically run Risk Analysis when documents are uploaded.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.autoScan} onChange={e => setSettings({...settings, autoScan: e.target.checked})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div>
                        <p className="text-white font-medium">High Risk Email Alerts</p>
                        <p className="text-xs text-slate-400">Send an email to admin when a record with Risk Score &gt; 80 is detected.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.emailAlerts} onChange={e => setSettings({...settings, emailAlerts: e.target.checked})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Retention Period (Years)</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="number" 
                            min="1" max="100"
                            value={settings.retentionDefault}
                            onChange={e => setSettings({...settings, retentionDefault: parseInt(e.target.value) || 7})}
                            className="w-24 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 text-center"
                        />
                        <span className="text-sm text-slate-500">Years for generic document types.</span>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
             <div>
                <h3 className="text-xl font-bold text-white mb-1">Data Management</h3>
                <p className="text-slate-400 text-sm">Control your local data store and vector indices.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{stats.records}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Records</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{stats.policies}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Policies</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{stats.logs}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Logs</p>
                </div>
            </div>

            <div className="space-y-4">
                 <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-white flex items-center gap-2"><Download size={16} /> Export System Data</h4>
                        <p className="text-xs text-slate-400 mt-1">Download a full JSON dump of records, policies, logs, and settings.</p>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Export JSON
                    </button>
                 </div>

                 <div className="p-4 bg-red-900/10 rounded-lg border border-red-900/30 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-red-400 flex items-center gap-2"><Trash2 size={16} /> Factory Reset</h4>
                        <p className="text-xs text-red-400/70 mt-1">Permanently delete all local data, vectors, and logs. This cannot be undone.</p>
                    </div>
                    <button 
                        onClick={async () => { if(confirm('Are you sure you want to wipe all data?')) await db.factoryReset(); }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Reset System
                    </button>
                 </div>
            </div>

            <div className="pt-6 border-t border-slate-700 mt-6">
                <h3 className="text-sm font-bold text-white mb-2">Service Status</h3>
                <div className="flex items-center gap-2">
                    {process.env.API_KEY ? (
                         <span className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 px-3 py-1.5 rounded-full border border-green-900/40">
                             <CheckCircle size={14} /> Gemini API Connected
                         </span>
                    ) : (
                         <span className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-3 py-1.5 rounded-full border border-red-900/40">
                             <AlertTriangle size={14} /> API Key Missing
                         </span>
                    )}
                    <span className="flex items-center gap-2 text-blue-400 text-sm bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-900/40">
                         <Database size={14} /> Local DB Active
                    </span>
                </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="absolute bottom-8 right-8">
            <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 ${isSaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
                {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                {isSaved ? 'Saved & Reloading...' : 'Save Changes'}
            </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Add New User</h3>
                      <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                          <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                              value={newUser.name || ''}
                              onChange={e => setNewUser({...newUser, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                          <input 
                              type="email" 
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                              value={newUser.email || ''}
                              onChange={e => setNewUser({...newUser, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Role Permission</label>
                          <select 
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                              value={newUser.role}
                              onChange={(e: any) => setNewUser({...newUser, role: e.target.value})}
                          >
                              <option value={UserRole.Admin}>Admin (Full Control)</option>
                              <option value={UserRole.Officer}>Officer (Managed Access)</option>
                              <option value={UserRole.Viewer}>Viewer (Read Only)</option>
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                      <button onClick={handleAddUser} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">Create Account</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;