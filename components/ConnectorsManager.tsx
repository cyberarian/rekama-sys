import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Connector, UserRole, UserProfile } from '../types';
import { Cable, RefreshCw, CheckCircle, AlertCircle, Plus, Server, Database, Cloud, X, ArrowRight, ShieldCheck, Trash2, Pause, Play, Edit2, Loader2, ExternalLink } from 'lucide-react';

const ConnectorsManager: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connName, setConnName] = useState('');
  const [connType, setConnType] = useState<Connector['type']>('SharePoint');
  const [connUrl, setConnUrl] = useState('');

  useEffect(() => {
    const init = async () => {
        const u = await db.getUser();
        setUser(u);
        await refreshConnectors();
    };
    init();
  }, []);

  const refreshConnectors = async () => {
      const c = await db.getConnectors();
      setConnectors(c);
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    await db.syncConnector(id);
    await db.addLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user?.email || 'system',
        action: 'SYNC_CONNECTOR',
        resource: id,
        severity: 'Low'
    });
    // Artificial delay to show spinning state
    setTimeout(async () => {
        await refreshConnectors();
        setSyncingId(null);
    }, 1500);
  };

  const openAddModal = () => {
      setEditingId(null);
      setConnName('');
      setConnType('SharePoint');
      setConnUrl('');
      setShowModal(true);
  };

  const openEditModal = (conn: Connector) => {
      setEditingId(conn.id);
      setConnName(conn.name);
      setConnType(conn.type);
      setConnUrl(conn.targetUrl || '');
      setShowModal(true);
  };

  const handleSaveConnector = async () => {
      if (!connName || !user) return;
      
      if (editingId) {
          // Edit Mode
          await db.updateConnector(editingId, { name: connName, type: connType, targetUrl: connUrl });
          await db.addLog({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.email,
            action: 'UPDATE_CONNECTOR',
            resource: connName,
            severity: 'Medium'
          });
      } else {
          // Add Mode
          const newConnector: Connector = {
              id: `conn_${Date.now()}`,
              name: connName,
              type: connType,
              status: 'Syncing', // Start in syncing state to simulate initial crawl
              itemsIndexed: 0,
              lastSync: new Date().toISOString(),
              targetUrl: connUrl
          };

          await db.addConnector(newConnector);
          await db.addLog({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.email,
            action: 'ADD_CONNECTOR',
            resource: connName,
            severity: 'High'
          });

          // Simulate the completion of the first sync after 2 seconds
          setTimeout(async () => {
              await db.syncConnector(newConnector.id);
              await refreshConnectors();
          }, 2000);
      }
      
      await refreshConnectors();
      setShowModal(false);
  };

  const handleDelete = async (conn: Connector) => {
      if (!user) return;
      if (confirm(`Are you sure you want to disconnect ${conn.name}? This will stop all future indexing and compliance checks.`)) {
          await db.deleteConnector(conn.id);
          await db.addLog({
              id: `log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: user.email,
              action: 'DELETE_CONNECTOR',
              resource: conn.name,
              severity: 'High'
          });
          await refreshConnectors();
      }
  };

  const handleToggleStatus = async (conn: Connector) => {
      if (!user) return;
      const newStatus = conn.status === 'Paused' ? 'Active' : 'Paused';
      await db.updateConnector(conn.id, { status: newStatus });
      await db.addLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: newStatus === 'Paused' ? 'PAUSE_CONNECTOR' : 'RESUME_CONNECTOR',
        resource: conn.name,
        severity: 'Medium'
      });
      await refreshConnectors();
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'SharePoint': case 'OneDrive': return <Cloud className="text-blue-400" />;
          case 'S3': case 'GoogleDrive': return <Database className="text-orange-400" />;
          case 'Exchange': case 'Slack': return <Server className="text-purple-400" />;
          default: return <Server className="text-slate-400" />;
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'bg-green-500/10 text-green-400 border-green-500/20';
          case 'Syncing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          case 'Error': return 'bg-red-500/10 text-red-400 border-red-500/20';
          case 'Paused': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
          default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      }
  };

  if (!user) return null;
  const canEdit = user.role === UserRole.Admin;

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in relative">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Cable className="text-blue-400" /> Connection Manager
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Manage integrations with external data sources. Rekama indexes content in-place without moving it.
                </p>
            </div>
            {canEdit && (
                <button 
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Add Connector
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map(conn => (
                <div key={conn.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden group hover:border-blue-500/50 transition-colors flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                                {getTypeIcon(conn.type)}
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(conn.status)} flex items-center gap-1`}>
                                    {conn.status === 'Active' && <CheckCircle size={10} />}
                                    {conn.status === 'Error' && <AlertCircle size={10} />}
                                    {conn.status === 'Syncing' && <RefreshCw size={10} className="animate-spin" />}
                                    {conn.status === 'Paused' && <AlertCircle size={10} />}
                                    {conn.status}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate" title={conn.name}>{conn.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{conn.type} Integration</p>
                        
                        {conn.targetUrl && (
                            <a 
                                href={conn.targetUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block mb-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                            >
                                <ExternalLink size={10} /> {conn.targetUrl}
                            </a>
                        )}

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Items Indexed</span>
                                <span className="text-white font-mono">{conn.itemsIndexed.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Last Sync</span>
                                <span className="text-slate-300 text-xs flex items-center">{new Date(conn.lastSync).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 border-t border-slate-700 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1">
                             {canEdit && (
                                <>
                                    <button onClick={() => openEditModal(conn)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Edit Configuration">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleToggleStatus(conn)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title={conn.status === 'Paused' ? 'Resume Sync' : 'Pause Sync'}>
                                        {conn.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
                                    </button>
                                    <button onClick={() => handleDelete(conn)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors" title="Remove Connector">
                                        <Trash2 size={14} />
                                    </button>
                                </>
                             )}
                        </div>
                        <button 
                            onClick={() => handleSync(conn.id)}
                            disabled={syncingId === conn.id || conn.status === 'Paused'}
                            className="text-sm text-blue-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={syncingId === conn.id ? 'animate-spin' : ''} />
                            {syncingId === conn.id ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>
            ))}
            
            {/* Promo Card for Castlepoint-style simulation */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:border-slate-600 transition-colors min-h-[200px]">
                <Database size={48} className="mb-4 opacity-50" />
                <h3 className="font-semibold text-slate-300">Connect More Sources</h3>
                <p className="text-sm mt-2 max-w-xs">
                    Support for Salesforce, Teams, and Network Drives coming in v2.0.
                </p>
            </div>
        </div>

        {/* Add/Edit Connector Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Configuration' : 'Add Data Connector'}</h3>
                        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Connector Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                                placeholder="e.g. Finance SharePoint Site"
                                value={connName}
                                onChange={e => setConnName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Source Type</label>
                            <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                value={connType}
                                onChange={(e: any) => setConnType(e.target.value)}
                            >
                                <option value="SharePoint">SharePoint</option>
                                <option value="OneDrive">OneDrive</option>
                                <option value="Exchange">Exchange</option>
                                <option value="S3">AWS S3 Bucket</option>
                                <option value="GoogleDrive">Google Drive</option>
                                <option value="Slack">Slack Enterprise</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Target URL / Folder Link</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                                placeholder="https://drive.google.com/drive/folders/..."
                                value={connUrl}
                                onChange={e => setConnUrl(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">Paste the full public or shared link to the target resource.</p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-xs text-blue-300">
                            <strong>Note:</strong> Rekama connects read-only. We do not modify source data during crawling.
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button 
                            onClick={handleSaveConnector}
                            disabled={!connName}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {editingId ? 'Save Changes' : 'Connect'} <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ConnectorsManager;