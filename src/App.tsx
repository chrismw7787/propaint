
import React, { useState, useEffect, useRef } from 'react';
import { PaintGrade, Project, Room, ItemInstance, SurfaceCategory, PaintSheen, Client, ItemTemplate, MaterialLine, MeasureType, ProjectSettings, BrandingSettings, FileSystemFileHandle } from './types';
import { calculateQuantity, calculateItemCost, calculateProjectTotals, calculateRoomTotal } from './services/calculationEngine';
import { db } from './services/db';
import { parseRoomDescription, suggestColors } from './services/geminiService';
import { DEFAULT_SETTINGS } from './constants';

// --- Icons ---
const Icon = ({ name, className }: { name: string, className?: string }) => {
    const icons: Record<string, React.ReactNode> = {
        plus: <path d="M5 12h14M12 5v14" />,
        trash: <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />,
        home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        settings: <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />,
        chevronLeft: <path d="M15 18l-6-6 6-6" />,
        chevronRight: <path d="M9 18l6-6-6-6" />,
        chevronDown: <path d="M6 9l6 6 6-6" />,
        wand: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
        users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
        briefcase: <path d="M20 7h-3a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />,
        camera: <g><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></g>,
        download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
        upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
        database: <g><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></g>,
        cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
        check: <polyline points="20 6 9 17 4 12" />,
        refresh: <path d="M23 4v6h-6M1 20v-6h6" />,
        alert: <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    };
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            {icons[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

// --- Contexts for Global Data ---
interface AppData {
    projects: Project[];
    clients: Client[];
    templates: ItemTemplate[];
    materials: MaterialLine[];
    globalSettings: ProjectSettings;
    roomNames: string[];
    branding: BrandingSettings;
    refresh: () => Promise<void>;
}

// --- Components ---

const BottomNav = ({ current, onChange }: { current: string, onChange: (v: any) => void }) => {
    const navItems = [
        { id: 'projects', label: 'Estimates', icon: 'home' },
        { id: 'clients', label: 'Clients', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    return (
        <div className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 flex justify-around py-2 pb-safe z-20 print:hidden">
            {navItems.map(item => (
                <button 
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className={`flex flex-col items-center p-2 w-full ${current === item.id ? 'text-secondary' : 'text-slate-400'}`}
                >
                    <Icon name={item.icon} className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

// --- Shared Forms ---

const ClientForm = ({ initialData, onSave, onCancel }: { initialData: Partial<Client>, onSave: (data: Partial<Client>) => Promise<void>, onCancel: () => void }) => {
    const [data, setData] = useState(initialData);

    return (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in duration-200">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <h2 className="font-bold text-lg">{data.id ? 'Edit Client' : 'New Client'}</h2>
                 <button onClick={onCancel} className="text-slate-500">Cancel</button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                    <input className="w-full border p-3 rounded bg-white" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Client Name" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                    <input className="w-full border p-3 rounded bg-white" value={data.phone || ''} onChange={e => setData({...data, phone: e.target.value})} placeholder="(555) 555-5555" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input className="w-full border p-3 rounded bg-white" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} placeholder="client@example.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                    <input className="w-full border p-3 rounded bg-white" value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} placeholder="123 Main St, City, State" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                    <textarea className="w-full border p-3 rounded bg-white" rows={4} value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} placeholder="Gate codes, preferences, etc." />
                </div>
            </div>
            <div className="p-4 border-t bg-white pb-safe">
                <button onClick={() => onSave(data)} className="w-full bg-secondary text-white py-3 rounded-lg font-bold">Save Client</button>
            </div>
        </div>
    );
};

// --- Project List & Create ---

const ClientSelectorModal = ({ clients, onSelect, onCreateNew, onCancel }: { clients: Client[], onSelect: (c: Client) => void, onCreateNew: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-lg">Select Client</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
                <button onClick={onCreateNew} className="w-full text-left p-3 flex items-center gap-3 hover:bg-blue-50 rounded-lg text-secondary font-semibold">
                    <div className="bg-blue-100 p-2 rounded-full"><Icon name="plus" className="w-4 h-4" /></div>
                    Create New Client
                </button>
                <div className="border-t my-2"></div>
                {clients.map(c => (
                    <button key={c.id} onClick={() => onSelect(c)} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.address}</div>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const SyncBanner = ({ handleName, onSync, onUnlink, state }: { handleName: string, onSync: () => void, onUnlink: () => void, state: string }) => (
    <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-3">
             <div className="bg-blue-200 p-1.5 rounded-full text-blue-700"><Icon name="cloud" className="w-4 h-4" /></div>
             <div>
                 <div className="text-xs font-bold text-blue-800 uppercase">Cloud Sync Paused</div>
                 <div className="text-xs text-blue-600">Reconnect to <span className="font-bold">{handleName}</span> to save/load data.</div>
             </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onUnlink} className="text-xs text-blue-400 font-semibold hover:text-blue-600 px-2">Unlink</button>
            <button onClick={onSync} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-colors">
                {state === 'pending' ? 'Connecting...' : 'Resume Sync'}
            </button>
        </div>
    </div>
);

const ProjectList = ({ projects, clients, onSelect, onCreate, onSync, syncState, syncHandle, onUnlinkSync }: { projects: Project[], clients: Client[], onSelect: (p: Project) => void, onCreate: (clientId: string) => void, onSync: () => void, syncState: 'none' | 'synced' | 'error' | 'pending' | 'disconnected', syncHandle?: FileSystemFileHandle, onUnlinkSync: () => void }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const handleClientSelect = (client: Client) => {
      onCreate(client.id);
      setShowClientModal(false);
  };

  const handleQuickCreateClient = async () => {
      if(!newClientName.trim()) return;
      const newClient: Client = {
          id: Date.now().toString(),
          name: newClientName,
          email: '', phone: '', address: '', notes: ''
      };
      await db.clients.put(newClient);
      onCreate(newClient.id);
      setNewClientName('');
      setIsCreatingClient(false);
      setShowClientModal(false);
  };

  return (
    <div className="pb-24">
      {/* Global Sync Banner if disconnected but handle exists */}
      {syncState === 'disconnected' && syncHandle && (
          <SyncBanner handleName={syncHandle.name} onSync={onSync} onUnlink={onUnlinkSync} state={syncState} />
      )}

      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
            <h1 className="text-3xl font-bold text-slate-900">Estimates</h1>
            <p className="text-slate-500 flex items-center gap-2">
                Manage your painting projects
                {syncState !== 'none' && syncState !== 'disconnected' && (
                    <button onClick={onSync} className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors" title="Click to Force Sync">
                        {syncState === 'synced' && <Icon name="check" className="w-3 h-3 text-green-500"/>}
                        {syncState === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
                        {syncState === 'error' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {syncState === 'synced' ? 'Synced' : syncState === 'pending' ? 'Syncing...' : 'Sync Error'}
                    </button>
                )}
            </p>
            </div>
            <button 
            onClick={() => setShowClientModal(true)}
            className="bg-secondary hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
            <Icon name="plus" className="w-5 h-5" /> New
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
            <div 
                key={p.id} 
                onClick={() => onSelect(p)}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-secondary cursor-pointer transition-all relative"
            >
                <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{p.name || 'Untitled Estimate'}</h3>
                    <div className="text-xs text-slate-500 font-medium">{p.clientName || 'Unknown Client'}</div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.status.toUpperCase()}
                </span>
                </div>
                <p className="text-sm text-slate-500 mb-4 truncate">{p.address || 'No address'}</p>
                <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xl font-bold text-slate-900">
                    ${p.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                </div>
            </div>
            ))}
        </div>

        {showClientModal && (
            <ClientSelectorModal 
                clients={clients} 
                onSelect={handleClientSelect}
                onCreateNew={() => setIsCreatingClient(true)}
                onCancel={() => {setShowClientModal(false); setIsCreatingClient(false);}}
            />
        )}
        
        {isCreatingClient && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xs rounded-xl p-4">
                    <h3 className="font-bold mb-2">Quick Add Client</h3>
                    <input 
                        autoFocus
                        placeholder="Client Name"
                        className="w-full border p-2 rounded mb-3"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreatingClient(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button>
                        <button onClick={handleQuickCreateClient} className="flex-1 py-2 bg-secondary text-white rounded">Create</button>
                    </div>
                </div>
            </div>
        )}
        </div>
    </div>
  );
};

// --- Client Management ---

const ClientList = ({ clients, onSelect, onRefresh }: { clients: Client[], onSelect: (c: Client) => void, onRefresh: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client>>({});

    const handleSave = async (data: Partial<Client>) => {
        if (!data.name) return;
        await db.clients.put({
            id: data.id || Date.now().toString(),
            name: data.name,
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            notes: data.notes || ''
        });
        setIsEditing(false);
        onRefresh();
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
                <button 
                    onClick={() => { setEditingClient({}); setIsEditing(true); }}
                    className="bg-secondary text-white px-3 py-2 rounded-lg shadow-sm"
                >
                    <Icon name="plus" className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                {clients.map(c => (
                    <div key={c.id} onClick={() => onSelect(c)} className="bg-white p-4 rounded-lg shadow-sm border hover:border-secondary cursor-pointer">
                        <div className="font-bold text-lg">{c.name}</div>
                        <div className="text-sm text-slate-500">{c.phone} • {c.email}</div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <ClientForm 
                    initialData={editingClient} 
                    onSave={handleSave} 
                    onCancel={() => setIsEditing(false)} 
                />
            )}
        </div>
    );
};

const ClientDetail = ({ client, projects, onBack, onUpdate, onCreateEstimate, onSelectEstimate }: { 
    client: Client, projects: Project[], onBack: () => void, onUpdate: (c: Client) => Promise<void>, onCreateEstimate: (cid: string) => void, onSelectEstimate: (p: Project) => void 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const clientProjects = projects.filter(p => p.clientId === client.id);

    return (
        <div className="flex flex-col h-full bg-slate-50">
             <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6 text-slate-600" /></button>
                <h1 className="flex-1 font-bold text-lg">{client.name}</h1>
                <button onClick={() => setIsEditing(true)} className="text-secondary font-medium">Edit</button>
             </header>
             <div className="p-6 flex-1 overflow-y-auto">
                 <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                     <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">Contact Info</div>
                     <div className="space-y-1">
                         {client.phone && <div className="text-slate-800">{client.phone}</div>}
                         {client.email && <div className="text-slate-800">{client.email}</div>}
                         {client.address && <div className="text-slate-600">{client.address}</div>}
                         {!client.phone && !client.email && !client.address && <div className="text-slate-400 italic">No details added.</div>}
                     </div>
                     {client.notes && (
                        <div className="mt-4 border-t pt-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Notes</div>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{client.notes}</p>
                        </div>
                     )}
                 </div>

                 <div className="flex justify-between items-end mb-3">
                    <h3 className="font-bold text-slate-800">Estimates</h3>
                    <button onClick={() => onCreateEstimate(client.id)} className="text-sm text-secondary font-bold">+ New Estimate</button>
                 </div>
                 <div className="space-y-3">
                     {clientProjects.map(p => (
                         <div key={p.id} onClick={() => onSelectEstimate(p)} className="bg-white p-3 rounded border hover:border-secondary cursor-pointer flex justify-between items-center">
                             <div>
                                 <div className="font-bold text-slate-800">{p.name || 'Untitled Estimate'}</div>
                                 <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()} • {p.status}</div>
                             </div>
                             <div className="font-bold">${p.totalPrice.toFixed(0)}</div>
                         </div>
                     ))}
                     {clientProjects.length === 0 && <div className="text-center text-slate-400 py-4">No estimates yet.</div>}
                 </div>
             </div>

             {isEditing && (
                <ClientForm 
                    initialData={client} 
                    onSave={async (data) => {
                        const updated = { ...client, ...data } as Client;
                        await onUpdate(updated);
                        setIsEditing(false);
                    }} 
                    onCancel={() => setIsEditing(false)} 
                />
             )}
        </div>
    );
};

// --- Settings Pages ---

const SettingsMenu = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <div className="p-6 pb-24">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>
        <div className="space-y-2">
            {[
                { id: 'branding', label: 'Branding', desc: 'Logos, business info, QR codes' },
                { id: 'templates', label: 'Item Templates', desc: 'Manage wall, ceiling, trim definitions' },
                { id: 'materials', label: 'Material Price Book', desc: 'Paint prices, coverage, and grades' },
                { id: 'labor', label: 'Labor & Pricing', desc: 'Hourly rates, taxes, and profit margins' },
                { id: 'roomNames', label: 'Room Names', desc: 'Manage preset room names' },
                { id: 'data', label: 'Data Management', desc: 'Backup, Restore, and Cloud Sync' },
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary flex justify-between items-center"
                >
                    <div>
                        <div className="font-bold text-slate-800">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                    <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
                </button>
            ))}
        </div>
    </div>
);

const DataManagement = ({ onBack, onRefresh, onSyncChange, syncState }: { onBack: () => void, onRefresh: () => void, onSyncChange: () => void, syncState: 'none' | 'synced' | 'error' | 'pending' | 'disconnected' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [linkedHandleName, setLinkedHandleName] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // Check if File System Access API is supported
        if (!('showSaveFilePicker' in window)) {
            setIsSupported(false);
        }
        
        db.sync.getHandle().then(h => {
            if (h) setLinkedHandleName(h.name);
        });
    }, []);

    const handleExport = async () => {
        const json = await db.backup.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `propaint_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const json = ev.target?.result as string;
                await db.backup.import(json);
                alert("Data restored successfully!");
                onRefresh();
            } catch (err) {
                alert("Failed to restore data. Invalid file.");
            }
        };
        reader.readAsText(file);
    };

    // New File (Write Mode)
    const handleCreateSyncFile = async () => {
        if (!isSupported) {
            alert("Your browser does not support saving directly to files. Please use Manual Backup.");
            return;
        }
        try {
            // @ts-ignore - Experimental API
            const handle = await window.showSaveFilePicker({
                suggestedName: 'propaint_db.json',
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            if (handle) {
                await db.sync.saveHandle(handle);
                setLinkedHandleName(handle.name);
                // Write current data to new file
                await db.sync.toFile(handle);
                onSyncChange();
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Existing File (Read -> Write Mode)
    const handleLinkExistingFile = async () => {
        if (!isSupported) {
            alert("Your browser does not support opening local files directly. Please use Manual Restore.");
            return;
        }
        try {
             // @ts-ignore - Experimental API
             const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] },
                }],
                multiple: false
            });
            if (handle) {
                await db.sync.saveHandle(handle);
                setLinkedHandleName(handle.name);
                
                // Read from file (Restore)
                await db.sync.fromFile(handle);
                alert("Successfully restored data from file!");
                onSyncChange();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to link file. Ensure you have permission.");
        }
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Data Management</h1>
            </header>
            <div className="p-6 space-y-6">
                
                 {/* Cloud Sync Section */}
                 <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl">DIRECT SYNC</div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-100 p-3 rounded-full text-secondary">
                            <Icon name="cloud" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Google Drive / Cloud Sync</h3>
                            <p className="text-sm text-slate-500">Sync across devices by saving directly to a file in your Drive folder.</p>
                        </div>
                    </div>
                    
                    {!isSupported && (
                         <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
                            Browser not supported. Please use Chrome, Edge or Opera for File System Sync.
                         </div>
                    )}

                    {linkedHandleName ? (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-800 flex items-center gap-2">
                            <Icon name="check" className="w-4 h-4" />
                            Active: <strong>{linkedHandleName}</strong>
                        </div>
                    ) : (
                        <div className={`bg-slate-50 border border-slate-200 rounded p-3 mb-4 text-sm text-slate-600 ${!isSupported ? 'opacity-50 pointer-events-none' : ''}`}>
                             <p className="mb-2 font-bold">Select an option:</p>
                             <div className="flex flex-col gap-2">
                                <button 
                                    onClick={handleCreateSyncFile} 
                                    className="w-full py-3 bg-secondary text-white font-bold rounded-lg shadow-sm hover:bg-blue-600"
                                >
                                    Create New Sync File
                                </button>
                                <p className="text-xs text-slate-400 text-center">Use this to backup your CURRENT data to a new file.</p>
                                
                                <div className="border-t my-1"></div>

                                <button 
                                    onClick={handleLinkExistingFile} 
                                    className="w-full py-3 bg-white border-2 border-secondary text-secondary font-bold rounded-lg hover:bg-blue-50"
                                >
                                    Link Existing File
                                </button>
                                <p className="text-xs text-slate-400 text-center">Use this to RESTORE data from another computer.</p>
                             </div>
                        </div>
                    )}

                    {linkedHandleName && (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setLinkedHandleName(null)} 
                                className="flex-1 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded hover:bg-slate-200"
                            >
                                Change / Unlink
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-600">
                            <Icon name="download" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Manual Backup</h3>
                            <p className="text-sm text-slate-500">Download a snapshot of your data.</p>
                        </div>
                    </div>
                    <button onClick={handleExport} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg">Download .JSON</button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Icon name="upload" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Restore Data</h3>
                            <p className="text-sm text-slate-500">Load a previously saved backup file.</p>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 border border-slate-300">Select Backup File</button>
                </div>

            </div>
        </div>
    );
};

const BrandingEditor = ({ branding, onSave, onBack }: { branding: BrandingSettings, onSave: (b: BrandingSettings) => void, onBack: () => void }) => {
    const [local, setLocal] = useState(branding);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof BrandingSettings) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800;
                    if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
                    else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    setLocal(prev => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.8) }));
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Branding</h1>
            </header>
            <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-24">
                
                <div className="bg-white p-4 rounded border">
                    <h3 className="font-bold mb-3">Business Info</h3>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Business Name</label>
                    <input className="w-full p-2 border rounded mb-3" value={local.businessName} onChange={e => setLocal({...local, businessName: e.target.value})} />
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Contact Info (Address, Phone, Email)</label>
                    <textarea className="w-full p-2 border rounded" rows={4} value={local.contactInfo} onChange={e => setLocal({...local, contactInfo: e.target.value})} />
                </div>

                <div className="bg-white p-4 rounded border">
                    <h3 className="font-bold mb-3">Logos</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Square (1:1)</label>
                            <label className="block aspect-square bg-slate-100 border-dashed border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-slate-200 relative overflow-hidden">
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'squareLogo')} />
                                {local.squareLogo ? <img src={local.squareLogo} className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">Upload</span>}
                                {local.squareLogo && <div className="absolute inset-0 hover:bg-black/20 flex items-center justify-center"><span className="bg-white/80 px-2 py-1 rounded text-xs shadow opacity-0 hover:opacity-100">Change</span></div>}
                            </label>
                            {local.squareLogo && <button onClick={() => setLocal({...local, squareLogo: undefined})} className="text-red-500 text-xs mt-1">Remove</button>}
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Horizontal</label>
                            <label className="block aspect-video bg-slate-100 border-dashed border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-slate-200 relative overflow-hidden">
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'horizontalLogo')} />
                                {local.horizontalLogo ? <img src={local.horizontalLogo} className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">Upload</span>}
                            </label>
                            {local.horizontalLogo && <button onClick={() => setLocal({...local, horizontalLogo: undefined})} className="text-red-500 text-xs mt-1">Remove</button>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border">
                    <h3 className="font-bold mb-3">Marketing / Reviews</h3>
                    <div className="flex gap-4 items-start">
                         <div className="w-1/3">
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">QR Code</label>
                            <label className="block aspect-square bg-slate-100 border-dashed border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-slate-200 overflow-hidden">
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'qrCode')} />
                                {local.qrCode ? <img src={local.qrCode} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">Upload</span>}
                            </label>
                            {local.qrCode && <button onClick={() => setLocal({...local, qrCode: undefined})} className="text-red-500 text-xs mt-1">Remove</button>}
                         </div>
                         <div className="flex-1">
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Review Blurb / Key Features</label>
                            <textarea className="w-full p-2 border rounded text-sm" rows={5} value={local.reviewBlurb} onChange={e => setLocal({...local, reviewBlurb: e.target.value})} placeholder="Check out what your neighbors are saying about us..." />
                         </div>
                    </div>
                </div>

                <button onClick={() => { onSave(local); onBack(); }} className="w-full bg-secondary text-white py-3 rounded font-bold text-lg">Save Branding</button>
            </div>
        </div>
    );
};

// --- Detail & Edit Components ---

const RoomEditor = ({ room, projectSettings, templates, materials, onSave, onBack }: { room: Room, projectSettings: ProjectSettings, templates: ItemTemplate[], materials: MaterialLine[], onSave: (r: Room) => void, onBack: () => void }) => {
    const [currentRoom, setCurrentRoom] = useState<Room>(room);
    const [isScanning, setIsScanning] = useState(false);
    const [prompt, setPrompt] = useState('');

    // Recalculate whenever items change
    const updateRoom = (updates: Partial<Room>) => {
        const updated = { ...currentRoom, ...updates };
        // Recalculate automatic quantities if dimensions change
        if (updates.length || updates.width || updates.height || updates.doors || updates.windows) {
            updated.items = updated.items.map(item => {
                const template = templates.find(t => t.id === item.templateId);
                if (!template) return item;
                const newQty = calculateQuantity(updated, template);
                const newItem = { ...item, quantity: newQty };
                return calculateItemCost(newItem, template, projectSettings, materials);
            });
        }
        setCurrentRoom(updated);
    };

    const handleGeminiScan = async () => {
        setIsScanning(true);
        try {
            const data = await parseRoomDescription(prompt);
            updateRoom({
                length: data.length || currentRoom.length,
                width: data.width || currentRoom.width,
                height: data.height || currentRoom.height,
                doors: data.doors || currentRoom.doors,
                windows: data.windows || currentRoom.windows
            });
            setPrompt('');
        } catch (e) {
            alert("Failed to parse description");
        } finally {
            setIsScanning(false);
        }
    };

    const addItem = (tpl: ItemTemplate) => {
        const qty = calculateQuantity(currentRoom, tpl);
        const rawItem: ItemInstance = {
            id: Date.now().toString(),
            templateId: tpl.id,
            name: tpl.name,
            category: tpl.category,
            quantity: qty,
            grade: tpl.defaultGrade,
            sheen: PaintSheen.Satin, // default
            color: 'White',
            coats: tpl.defaultCoats,
            laborMinutes: 0, laborCost: 0, materialCost: 0, totalPrice: 0
        };
        const costedItem = calculateItemCost(rawItem, tpl, projectSettings, materials);
        updateRoom({ items: [...currentRoom.items, costedItem] });
    };
    
    const updateItem = (itemId: string, changes: Partial<ItemInstance>) => {
        const updatedItems = currentRoom.items.map(item => {
            if (item.id !== itemId) return item;
            const template = templates.find(t => t.id === item.templateId);
            if (!template) return item;
            const merged = { ...item, ...changes };
            return calculateItemCost(merged, template, projectSettings, materials);
        });
        updateRoom({ items: updatedItems });
    };

    const deleteItem = (itemId: string) => {
        updateRoom({ items: currentRoom.items.filter(i => i.id !== itemId) });
    };

    const total = calculateRoomTotal(currentRoom);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                    <input 
                        className="font-bold text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-secondary focus:outline-none" 
                        value={currentRoom.name} 
                        onChange={e => updateRoom({ name: e.target.value })} 
                    />
                </div>
                <div className="text-lg font-bold text-slate-900">${total.toFixed(0)}</div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Dimensions Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Dimensions</h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold">Length (ft)</label>
                            <input type="number" className="w-full border rounded p-2 font-bold" value={currentRoom.length} onChange={e => updateRoom({ length: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold">Width (ft)</label>
                            <input type="number" className="w-full border rounded p-2 font-bold" value={currentRoom.width} onChange={e => updateRoom({ width: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold">Height (ft)</label>
                            <input type="number" className="w-full border rounded p-2 font-bold" value={currentRoom.height} onChange={e => updateRoom({ height: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-[10px] text-slate-400 font-bold">Doors</label>
                            <input type="number" className="w-full border rounded p-2 font-bold" value={currentRoom.doors} onChange={e => updateRoom({ doors: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold">Windows</label>
                            <input type="number" className="w-full border rounded p-2 font-bold" value={currentRoom.windows} onChange={e => updateRoom({ windows: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    
                    {/* AI Assist */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                         <div className="flex gap-2">
                             <input 
                                className="flex-1 border rounded p-2 text-sm" 
                                placeholder="Paste room description (e.g. 12x14 bedroom with 2 doors)..." 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                             />
                             <button onClick={handleGeminiScan} disabled={isScanning} className="bg-indigo-50 text-indigo-600 p-2 rounded flex items-center gap-2 text-sm font-bold border border-indigo-100">
                                <Icon name="wand" className="w-4 h-4" /> {isScanning ? '...' : 'Scan'}
                             </button>
                         </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Scope of Work</h3>
                    {currentRoom.items.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                                    <div className="text-xs text-slate-500">{item.grade} • {item.sheen}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">${item.totalPrice.toFixed(0)}</div>
                                    <button onClick={() => deleteItem(item.id)} className="text-red-400 text-xs mt-1">Remove</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold">Quantity</label>
                                    <div className="flex items-center border rounded bg-slate-50">
                                        <input type="number" className="w-full p-2 bg-transparent" value={item.quantity.toFixed(1)} onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) })} />
                                        <span className="text-xs text-slate-400 pr-2">
                                           {item.category === SurfaceCategory.Walls ? 'sqft' : item.category === SurfaceCategory.Trim ? 'lf' : 'count'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold">Color</label>
                                    <input className="w-full border rounded p-2" value={item.color} onChange={e => updateItem(item.id, { color: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Item Buttons */}
                <div className="grid grid-cols-2 gap-2 pb-24">
                    {templates.map(t => (
                         <button key={t.id} onClick={() => addItem(t)} className="bg-white border border-slate-200 hover:border-secondary p-3 rounded-lg text-sm font-bold text-slate-600 text-left">
                            + {t.name}
                         </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-white border-t pb-safe">
                 <button onClick={() => onSave(currentRoom)} className="w-full bg-secondary text-white py-3 rounded-lg font-bold text-lg">Save Room</button>
            </div>
        </div>
    );
};

const ProjectDetail = ({ project, client, templates, roomNames, branding, onBack, onUpdate, onSelectRoom }: { project: Project, client?: Client, templates: ItemTemplate[], roomNames: string[], branding: BrandingSettings, onBack: () => void, onUpdate: (p: Project) => void, onSelectRoom: (r: Room) => void }) => {
    
    const handleAddRoom = (name: string) => {
        const newRoom: Room = {
            id: Date.now().toString(),
            name,
            length: 12, width: 12, height: 9, doors: 1, windows: 1,
            defaultWallGrade: PaintGrade.Standard,
            defaultTrimGrade: PaintGrade.Premium,
            defaultCeilingGrade: PaintGrade.Contractor,
            items: [],
            included: true,
            notes: ''
        };
        const updated = { ...project, rooms: [...project.rooms, newRoom] };
        onUpdate(calculateProjectTotals(updated));
        onSelectRoom(newRoom);
    };
    
    const handleRemoveRoom = (roomId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this room?")) {
            const updated = { ...project, rooms: project.rooms.filter(r => r.id !== roomId) };
            onUpdate(calculateProjectTotals(updated));
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
             <header className="bg-white p-4 border-b flex items-center gap-4 sticky top-0 z-10 print:hidden">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <div className="flex-1">
                    <h1 className="font-bold text-lg leading-tight">{project.name}</h1>
                    <div className="text-xs text-slate-500">{client?.name}</div>
                </div>
                <button onClick={() => window.print()} className="text-slate-600"><Icon name="download" className="w-5 h-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 print:p-0">
                {/* Proposal View for Print */}
                <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-8 mb-8">
                        <div>
                            {branding.horizontalLogo ? (
                                <img src={branding.horizontalLogo} className="h-16 object-contain mb-2" />
                            ) : (
                                <h1 className="text-2xl font-bold text-primary mb-2">{branding.businessName}</h1>
                            )}
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{branding.contactInfo}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">Estimate</h2>
                            <div className="text-slate-600 font-bold">#{project.id.slice(-6)}</div>
                            <div className="text-sm text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Prepared For</h3>
                        <div className="font-bold text-lg">{client?.name}</div>
                        <div className="text-slate-600">{project.address}</div>
                        <div className="text-slate-600">{client?.email}</div>
                    </div>

                    {/* Rooms */}
                    <div className="space-y-8 mb-8">
                        {project.rooms.map(room => (
                            <div key={room.id} className="break-inside-avoid cursor-pointer group relative" onClick={() => onSelectRoom(room)}>
                                <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-3">
                                    <h3 className="font-bold text-lg group-hover:text-secondary">{room.name}</h3>
                                    <div className="text-right">
                                        <div className="font-bold">${calculateRoomTotal(room).toFixed(0)}</div>
                                        <button onClick={(e) => handleRemoveRoom(room.id, e)} className="text-red-400 text-xs hover:underline print:hidden">Remove</button>
                                    </div>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {room.items.map(item => (
                                            <tr key={item.id} className="border-b border-slate-50 last:border-0">
                                                <td className="py-2 pl-2 text-slate-700">{item.name} - <span className="text-slate-500">{item.color}</span></td>
                                                <td className="py-2 text-right font-medium">${item.totalPrice.toFixed(0)}</td>
                                            </tr>
                                        ))}
                                        {room.items.length === 0 && (
                                            <tr><td className="py-2 text-slate-400 italic">No items added. Click to edit.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t-2 border-slate-900 pt-4 flex justify-end">
                         <div className="w-48">
                             <div className="flex justify-between py-1">
                                 <span className="text-slate-600">Subtotal</span>
                                 <span className="font-bold">${(project.totalPrice / (1 + project.settings.taxRate)).toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between py-1">
                                 <span className="text-slate-600">Tax ({(project.settings.taxRate * 100).toFixed(1)}%)</span>
                                 <span className="font-bold">${(project.totalPrice - (project.totalPrice / (1 + project.settings.taxRate))).toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between py-2 border-t border-slate-200 mt-2 text-xl font-bold text-slate-900">
                                 <span>Total</span>
                                 <span>${project.totalPrice.toFixed(2)}</span>
                             </div>
                         </div>
                    </div>
                    
                    {/* Footer / Terms */}
                    <div className="mt-12 pt-8 border-t text-sm text-slate-500 text-center">
                        <p>{branding.reviewBlurb}</p>
                        {branding.qrCode && (
                            <img src={branding.qrCode} className="w-24 h-24 mx-auto mt-4" />
                        )}
                    </div>
                </div>

                {/* Add Room Actions */}
                <div className="mt-8 max-w-3xl mx-auto print:hidden">
                    <h3 className="font-bold text-slate-400 text-xs uppercase mb-3">Add Room</h3>
                    <div className="flex flex-wrap gap-2">
                        {roomNames.map(name => (
                            <button key={name} onClick={() => handleAddRoom(name)} className="px-4 py-2 bg-white border rounded-full hover:border-secondary hover:text-secondary text-sm font-medium transition-colors">
                                + {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LaborSettings = ({ settings, onSave, onBack }: { settings: ProjectSettings, onSave: (s: ProjectSettings) => Promise<void>, onBack: () => void }) => {
    const [local, setLocal] = useState(settings);
    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Labor & Pricing</h1>
            </header>
            <div className="p-6 space-y-4">
                <div className="bg-white p-4 rounded border">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Labor Rate ($/hr)</label>
                    <input type="number" className="w-full border p-3 rounded" value={local.laborRatePerHour} onChange={e => setLocal({...local, laborRatePerHour: parseFloat(e.target.value)})} />
                </div>
                <div className="bg-white p-4 rounded border">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Overhead % (0.10 = 10%)</label>
                    <input type="number" step="0.01" className="w-full border p-3 rounded" value={local.overheadPct} onChange={e => setLocal({...local, overheadPct: parseFloat(e.target.value)})} />
                </div>
                <div className="bg-white p-4 rounded border">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profit % (0.20 = 20%)</label>
                    <input type="number" step="0.01" className="w-full border p-3 rounded" value={local.profitPct} onChange={e => setLocal({...local, profitPct: parseFloat(e.target.value)})} />
                </div>
                <div className="bg-white p-4 rounded border">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax Rate % (0.08 = 8%)</label>
                    <input type="number" step="0.01" className="w-full border p-3 rounded" value={local.taxRate} onChange={e => setLocal({...local, taxRate: parseFloat(e.target.value)})} />
                </div>
                <button onClick={() => onSave(local)} className="w-full bg-secondary text-white py-3 rounded font-bold">Save Settings</button>
            </div>
        </div>
    );
};

const RoomNamesEditor = ({ roomNames, onUpdate, onBack }: { roomNames: string[], onUpdate: () => Promise<void>, onBack: () => void }) => {
    const [newName, setNewName] = useState("");

    const handleAdd = async () => {
        if (newName) {
            await db.roomNames.put(newName);
            setNewName("");
            onUpdate();
        }
    };

    const handleDelete = async (name: string) => {
        await db.roomNames.delete(name);
        onUpdate();
    };

    return (
         <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Room Names</h1>
            </header>
            <div className="p-4">
                <div className="flex gap-2 mb-4">
                    <input className="flex-1 border p-2 rounded" placeholder="New Room Name" value={newName} onChange={e => setNewName(e.target.value)} />
                    <button onClick={handleAdd} className="bg-secondary text-white px-4 rounded font-bold">Add</button>
                </div>
                <div className="bg-white rounded border divide-y">
                    {roomNames.map(name => (
                        <div key={name} className="p-3 flex justify-between items-center">
                            <span>{name}</span>
                            <button onClick={() => handleDelete(name)} className="text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TemplatesEditor = ({ templates, onUpdate, onBack }: { templates: ItemTemplate[], onUpdate: () => Promise<void>, onBack: () => void }) => {
    // Simplified read-only list for now
    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Templates</h1>
            </header>
            <div className="p-4 overflow-y-auto">
                <p className="text-sm text-slate-500 mb-4">Editing templates is disabled in this version. Default templates loaded.</p>
                <div className="space-y-2">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-3 rounded border">
                            <div className="font-bold">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MaterialsEditor = ({ materials, onUpdate, onBack }: { materials: MaterialLine[], onUpdate: () => Promise<void>, onBack: () => void }) => {
    // Simplified read-only list
     return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Materials</h1>
            </header>
            <div className="p-4 overflow-y-auto">
                 <p className="text-sm text-slate-500 mb-4">Editing materials is disabled in this version.</p>
                <div className="space-y-2">
                    {materials.map(m => (
                        <div key={m.id} className="bg-white p-3 rounded border flex justify-between">
                            <div>
                                <div className="font-bold">{m.brand} {m.line}</div>
                                <div className="text-xs text-slate-500">{m.grade} - {m.surfaceCategory}</div>
                            </div>
                            <div className="font-bold">${m.pricePerGallon}/gal</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Updated App Component to handle sync status ---

const App = () => {
  const [view, setView] = useState<'projects' | 'clients' | 'settings'>('projects');
  const [subView, setSubView] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [roomNames, setRoomNames] = useState<string[]>([]);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  // Sync State
  const [syncState, setSyncState] = useState<'none' | 'synced' | 'error' | 'pending' | 'disconnected'>('none');
  const [syncHandle, setSyncHandle] = useState<FileSystemFileHandle | undefined>(undefined);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const refresh = async () => {
    try {
        const [p, c, t, m, s, r, b, h] = await Promise.all([
          db.projects.toArray(),
          db.clients.toArray(),
          db.templates.toArray(),
          db.materials.toArray(),
          db.settings.get(),
          db.roomNames.toArray(),
          db.branding.get(),
          db.sync.getHandle().catch(() => undefined) // Safe handle retrieval in case store missing
        ]);
        setProjects(p.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setClients(c.sort((a, b) => a.name.localeCompare(b.name)));
        setTemplates(t);
        setMaterials(m);
        setSettings(s);
        setRoomNames(r);
        setBranding(b);
        
        setSyncHandle(h);
        
        // On startup, if handle exists but we haven't "connected", set to disconnected to prompt user
        if (h && syncState === 'none') {
            setSyncState('disconnected');
        }
    } catch (error) {
        console.error("Failed to load data, falling back to defaults", error);
        // Use defaults so the UI still renders even if IndexedDB fails
        setSettings(DEFAULT_SETTINGS);
        setBranding({ 
          businessName: 'ProPaint Contractors', 
          contactInfo: '123 Painter Lane\nCity, ST 12345\n(555) 555-5555',
          reviewBlurb: 'See what your neighbors are saying about us! Scan to read our 5-star reviews.'
      });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const triggerSync = async () => {
      if (!syncHandle) return;
      setSyncState('pending');
      try {
          await db.sync.toFile(syncHandle);
          setSyncState('synced');
      } catch (e) {
          console.error("Sync failed", e);
          setSyncState('error');
      }
  };

  const resumeSync = async () => {
    if (!syncHandle) return;
    setSyncState('pending');
    try {
        // READ from file first (import latest cloud data)
        await db.sync.fromFile(syncHandle);
        await refresh(); // Update UI with new data
        setSyncState('synced');
    } catch (e) {
        console.error("Resume failed", e);
        setSyncState('error');
    }
  };
  
  const handleUnlinkSync = async () => {
      // Ideally delete from DB store, for now just clear state
      await db.sync.saveHandle(undefined as any);
      setSyncHandle(undefined);
      setSyncState('none');
  };

  const handleCreateProject = async (clientId: string) => {
      if (!settings) return;
      const client = clients.find(c => c.id === clientId);
      const newProject: Project = {
          id: Date.now().toString(),
          clientId,
          name: 'New Estimate',
          clientName: client ? client.name : 'Unknown',
          address: client ? client.address : '',
          createdAt: new Date().toISOString(),
          status: 'draft',
          settings: settings,
          rooms: [],
          totalCost: 0,
          totalPrice: 0
      };
      await db.projects.put(newProject);
      await refresh();
      setSelectedProject(newProject);
      triggerSync();
  };

  const handleUpdateProject = async (p: Project) => {
      await db.projects.put(p);
      setSelectedProject(p);
      await refresh();
      // Debounced sync could go here, but for now trigger immediately or on exit
      triggerSync();
  };
  
  const handleUpdateClient = async (c: Client) => {
      await db.clients.put(c);
      
      const linkedProjects = projects.filter(p => p.clientId === c.id);
      if (linkedProjects.length > 0) {
          for (const p of linkedProjects) {
              await db.projects.put({
                  ...p,
                  clientName: c.name,
                  address: c.address
              });
          }
      }

      await refresh();
      setSelectedClient(c);
      triggerSync();
  };

  const handleSaveRoom = async (updatedRoom: Room) => {
      if (!selectedProject) return;
      const updatedRooms = selectedProject.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
      const updatedProject = calculateProjectTotals({ ...selectedProject, rooms: updatedRooms });
      await handleUpdateProject(updatedProject);
      setSelectedRoom(null);
  };

  if (!settings || !branding) return <div className="flex h-screen items-center justify-center text-slate-400 animate-pulse">Loading ProPaint...</div>;

  if (selectedRoom && selectedProject) {
      return (
          <RoomEditor 
            room={selectedRoom}
            projectSettings={selectedProject.settings}
            templates={templates}
            materials={materials}
            onSave={handleSaveRoom}
            onBack={() => setSelectedRoom(null)}
          />
      );
  }

  if (selectedProject) {
      const activeClient = clients.find(c => c.id === selectedProject.clientId);
      return (
          <ProjectDetail 
             project={selectedProject}
             client={activeClient}
             templates={templates}
             roomNames={roomNames}
             branding={branding}
             onBack={() => setSelectedProject(null)}
             onUpdate={handleUpdateProject}
             onSelectRoom={setSelectedRoom}
          />
      );
  }

  if (selectedClient) {
      return (
          <ClientDetail 
              client={selectedClient}
              projects={projects}
              onBack={() => setSelectedClient(null)}
              onUpdate={handleUpdateClient}
              onCreateEstimate={(cid) => {
                  setSelectedClient(null);
                  handleCreateProject(cid);
              }}
              onSelectEstimate={(p) => {
                  setSelectedClient(null);
                  setSelectedProject(p);
              }}
          />
      );
  }

  if (view === 'settings' && subView) {
      if (subView === 'templates') return <TemplatesEditor templates={templates} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'materials') return <MaterialsEditor materials={materials} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'labor') return <LaborSettings settings={settings} onSave={async (s) => { await db.settings.save(s); refresh(); triggerSync(); }} onBack={() => setSubView(null)} />;
      if (subView === 'roomNames') return <RoomNamesEditor roomNames={roomNames} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'branding') return <BrandingEditor branding={branding} onSave={async (b) => { await db.branding.save(b); refresh(); triggerSync(); }} onBack={() => setSubView(null)} />;
      if (subView === 'data') return <DataManagement onRefresh={refresh} onSyncChange={() => { refresh(); resumeSync(); }} syncState={syncState} onBack={() => setSubView(null)} />;
  }

  return (
      <div className="h-full bg-slate-50">
          {view === 'projects' && (
              <ProjectList 
                  projects={projects}
                  clients={clients}
                  onSelect={setSelectedProject}
                  onCreate={handleCreateProject}
                  onSync={triggerSync}
                  syncState={syncState}
                  syncHandle={syncHandle}
                  onUnlinkSync={handleUnlinkSync}
              />
          )}

          {view === 'clients' && (
              <ClientList 
                  clients={clients}
                  onSelect={setSelectedClient}
                  onRefresh={refresh}
              />
          )}

          {view === 'settings' && (
              <SettingsMenu onNavigate={setSubView} />
          )}

          <BottomNav current={view} onChange={setView} />
      </div>
  );
};

export default App;
