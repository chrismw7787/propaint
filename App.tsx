import React, { useState, useEffect, useRef } from 'react';
import { PaintGrade, Project, Room, ItemInstance, SurfaceCategory, PaintSheen, Client, ItemTemplate, MaterialLine, MeasureType, ProjectSettings, BrandingSettings } from './types';
import { calculateQuantity, calculateItemCost, calculateProjectTotals, calculateRoomTotal } from './services/calculationEngine';
import { db } from './services/db';
import { parseRoomDescription, suggestColors } from './services/geminiService';

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
        tag: <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />,
        layers: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
        tool: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
        dollar: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
        image: <g><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></g>
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

const ProjectList = ({ projects, clients, onSelect, onCreate }: { projects: Project[], clients: Client[], onSelect: (p: Project) => void, onCreate: (clientId: string) => void }) => {
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
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Estimates</h1>
          <p className="text-slate-500">Manage your painting projects</p>
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
        <div className="space-y-3">
            
            {/* Data Management */}
            <button 
                onClick={() => onNavigate('data')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Data Management</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

            {/* Branding */}
            <button 
                onClick={() => onNavigate('branding')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Branding</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

            {/* Templates */}
            <button 
                onClick={() => onNavigate('templates')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Item Templates</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

            {/* Materials */}
            <button 
                onClick={() => onNavigate('materials')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Material Price Book</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

            {/* Labor */}
            <button 
                onClick={() => onNavigate('labor')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Labor & Pricing</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

            {/* Room Names */}
            <button 
                onClick={() => onNavigate('roomNames')}
                className="w-full text-left p-4 bg-white border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center group"
            >
                <div className="font-bold text-slate-800 text-lg">Room Names</div>
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-secondary" />
            </button>

        </div>
    </div>
);

const DataManagement = ({ onBack, onRefresh }: { onBack: () => void, onRefresh: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Data Management</h1>
            </header>
            <div className="p-6 space-y-6">
                
                 <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-100 p-3 rounded-full text-secondary">
                            <Icon name="database" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Local Storage</h3>
                            <p className="text-sm text-slate-500">Your data is automatically saved to this tablet.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-600">
                            <Icon name="download" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Backup Data</h3>
                            <p className="text-sm text-slate-500">Download a snapshot of your data to a file.</p>
                        </div>
                    </div>
                    <button onClick={handleExport} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg">Download Backup (.json)</button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Icon name="upload" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Restore Data</h3>
                            <p className="text-sm text-slate-500">Load a previously saved backup file. This will overwrite current data.</p>
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

const TemplatesEditor = ({ templates, onUpdate, onBack }: { templates: ItemTemplate[], onUpdate: () => void, onBack: () => void }) => {
    const [editingItem, setEditingItem] = useState<Partial<ItemTemplate> | null>(null);

    const handleSave = async () => {
        if(!editingItem || !editingItem.name) return;
        await db.templates.put({
            ...editingItem,
            id: editingItem.id || `tpl_${Date.now()}`,
            category: editingItem.category || SurfaceCategory.Other,
            measureType: editingItem.measureType || MeasureType.Count,
            defaultCoats: editingItem.defaultCoats || 2,
            defaultWastePct: editingItem.defaultWastePct || 0.1,
            productivityMinutesPerUnit: editingItem.productivityMinutesPerUnit || 10,
            defaultGrade: editingItem.defaultGrade || PaintGrade.Standard,
            description: editingItem.description || ''
        } as ItemTemplate);
        setEditingItem(null);
        onUpdate();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Item Templates</h1>
                <button onClick={() => setEditingItem({})} className="ml-auto text-secondary font-bold">Add</button>
            </header>
            
            {editingItem ? (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                        <input className="w-full p-2 border rounded bg-white" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as SurfaceCategory})}>
                                {(Object.values(SurfaceCategory) as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Measure Type</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingItem.measureType} onChange={e => setEditingItem({...editingItem, measureType: e.target.value as MeasureType})}>
                                {(Object.values(MeasureType) as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Prod (min/unit)</label>
                            <input type="number" className="w-full p-2 border rounded bg-white" value={editingItem.productivityMinutesPerUnit} onChange={e => setEditingItem({...editingItem, productivityMinutesPerUnit: parseFloat(e.target.value)})} />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Default Coats</label>
                            <input type="number" className="w-full p-2 border rounded bg-white" value={editingItem.defaultCoats} onChange={e => setEditingItem({...editingItem, defaultCoats: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Service Description (Scope of Work)</label>
                        <textarea 
                            className="w-full p-2 border rounded bg-white text-sm" 
                            rows={3}
                            value={editingItem.description || ''} 
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                            placeholder="e.g. Scrape, patch, sand, spot prime, and apply 2 coats."
                        />
                    </div>
                    <button onClick={handleSave} className="w-full py-3 bg-secondary text-white rounded font-bold mt-4">Save Template</button>
                </div>
            ) : (
                <div className="p-4 grid gap-3 overflow-y-auto">
                    {templates.map(t => (
                        <div key={t.id} onClick={() => setEditingItem(t)} className="bg-white p-3 rounded border shadow-sm cursor-pointer hover:border-secondary">
                            <div className="font-bold">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.category} • {t.measureType}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MaterialsEditor = ({ materials, onUpdate, onBack }: { materials: MaterialLine[], onUpdate: () => void, onBack: () => void }) => {
    const [editing, setEditing] = useState<Partial<MaterialLine> | null>(null);

    const handleSave = async () => {
        if(!editing || !editing.line) return;
        await db.materials.put({
            ...editing,
            id: editing.id || `mat_${Date.now()}`,
            brand: editing.brand || 'Generic',
            grade: editing.grade || PaintGrade.Standard,
            // sheen: editing.sheen || PaintSheen.Satin, // REMOVED
            surfaceCategory: editing.surfaceCategory || SurfaceCategory.Walls,
            coverageSqft: editing.coverageSqft || 350,
            pricePerGallon: editing.pricePerGallon || 45
        } as MaterialLine);
        setEditing(null);
        onUpdate();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Materials</h1>
                <button onClick={() => setEditing({})} className="ml-auto text-secondary font-bold">Add</button>
            </header>

            {editing ? (
                 <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <input placeholder="Brand" className="w-full p-2 border rounded" value={editing.brand || ''} onChange={e => setEditing({...editing, brand: e.target.value})} />
                    <input placeholder="Product Line" className="w-full p-2 border rounded" value={editing.line || ''} onChange={e => setEditing({...editing, line: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <select className="w-full p-2 border rounded" value={editing.grade} onChange={e => setEditing({...editing, grade: e.target.value as PaintGrade})}>
                             {(Object.values(PaintGrade) as string[]).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select className="w-full p-2 border rounded" value={editing.surfaceCategory} onChange={e => setEditing({...editing, surfaceCategory: e.target.value as SurfaceCategory})}>
                             {(Object.values(SurfaceCategory) as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     {/* Removed Sheen select from here */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500">$/Gallon</label>
                            <input type="number" className="w-full p-2 border rounded" value={editing.pricePerGallon} onChange={e => setEditing({...editing, pricePerGallon: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">SqFt/Gal</label>
                            <input type="number" className="w-full p-2 border rounded" value={editing.coverageSqft} onChange={e => setEditing({...editing, coverageSqft: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full py-3 bg-secondary text-white rounded font-bold mt-4">Save Material</button>
                 </div>
            ) : (
                <div className="p-4 grid gap-3 overflow-y-auto">
                    {materials.map(m => (
                        <div key={m.id} onClick={() => setEditing(m)} className="bg-white p-3 rounded border shadow-sm cursor-pointer hover:border-secondary">
                            <div className="flex justify-between">
                                <div className="font-bold">{m.line}</div>
                                <div className="font-bold text-green-700">${m.pricePerGallon}</div>
                            </div>
                            <div className="text-xs text-slate-500">{m.brand} • {m.grade}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const RoomNamesEditor = ({ roomNames, onUpdate, onBack }: { roomNames: string[], onUpdate: () => void, onBack: () => void }) => {
    const [newName, setNewName] = useState('');

    const handleAdd = async () => {
        if (!newName.trim()) return;
        await db.roomNames.put(newName.trim());
        setNewName('');
        onUpdate();
    };

    const handleDelete = async (name: string) => {
        await db.roomNames.delete(name);
        onUpdate();
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Room Names</h1>
            </header>
            <div className="p-4 border-b bg-white flex gap-2">
                <input 
                    className="flex-1 p-2 border rounded" 
                    placeholder="Add new room name..." 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button onClick={handleAdd} className="bg-secondary text-white px-4 rounded font-bold">Add</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                {roomNames.map(name => (
                    <div key={name} className="flex justify-between items-center p-3 bg-white border rounded mb-2 shadow-sm">
                        <span className="font-medium">{name}</span>
                        <button onClick={() => handleDelete(name)} className="text-red-400 p-2 hover:bg-red-50 rounded">
                            <Icon name="trash" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LaborSettings = ({ settings, onSave, onBack }: { settings: ProjectSettings, onSave: (s: ProjectSettings) => void, onBack: () => void }) => {
    const [local, setLocal] = useState(settings);

    const handleSave = () => {
        onSave(local);
        onBack();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={onBack}><Icon name="chevronLeft" className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg">Labor & Pricing</h1>
            </header>
            <div className="p-4 space-y-4">
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Labor Rate ($/hr)</label>
                     <input type="number" className="w-full p-3 border rounded" value={local.laborRatePerHour} onChange={e => setLocal({...local, laborRatePerHour: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Overhead % (0.10 = 10%)</label>
                     <input type="number" step="0.01" className="w-full p-3 border rounded" value={local.overheadPct} onChange={e => setLocal({...local, overheadPct: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Profit % (0.20 = 20%)</label>
                     <input type="number" step="0.01" className="w-full p-3 border rounded" value={local.profitPct} onChange={e => setLocal({...local, profitPct: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Tax Rate % (0.08 = 8%)</label>
                     <input type="number" step="0.01" className="w-full p-3 border rounded" value={local.taxRate} onChange={e => setLocal({...local, taxRate: parseFloat(e.target.value)})} />
                 </div>
                 <button onClick={handleSave} className="w-full py-3 bg-secondary text-white rounded font-bold mt-4">Save Defaults</button>
            </div>
        </div>
    );
};

// --- Updated Detail & Room Components ---

const EstimatePreview = ({ project, client, templates, branding, onClose }: { project: Project, client?: Client, templates: ItemTemplate[], branding: BrandingSettings, onClose: () => void }) => {
    // Calculation for display
    const getScope = (item: ItemInstance) => {
        const tpl = templates.find(t => t.id === item.templateId);
        return tpl?.description || '';
    };

    return (
        <div className="fixed inset-0 bg-slate-800 z-[100] overflow-y-auto">
            <div className="min-h-screen flex justify-center p-4 print:p-0">
                {/* Paper */}
                <div className="bg-white w-full max-w-4xl shadow-2xl print:shadow-none print:w-full p-8 md:p-12 relative flex flex-col min-h-[11in]">
                    
                    {/* Toolbar (Hidden in Print) */}
                    <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
                        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2">
                            <Icon name="briefcase" className="w-4 h-4"/> Print / Save PDF
                        </button>
                        <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded shadow font-bold">
                            Close
                        </button>
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex gap-6 items-center">
                            {branding.squareLogo && (
                                <img src={branding.squareLogo} alt="Logo" className="w-24 h-24 object-contain" />
                            )}
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-1">Estimate</h1>
                                <div className="text-slate-500 font-medium">#{project.id.slice(-6)}</div>
                                <div className="text-slate-500 font-medium">{new Date(project.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-slate-900">{branding.businessName}</div>
                            <div className="text-slate-500 whitespace-pre-wrap text-sm">{branding.contactInfo}</div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-10 flex justify-between bg-slate-50 p-4 rounded-lg print:bg-transparent print:p-0">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prepared For</h3>
                            <div className="font-bold text-xl text-slate-900">{client?.name || project.clientName}</div>
                            {client?.address && <div className="text-slate-600">{client.address}</div>}
                            {client?.phone && <div className="text-slate-600">{client.phone}</div>}
                            {client?.email && <div className="text-slate-600">{client.email}</div>}
                        </div>
                        <div className="text-right max-w-xs">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Site</h3>
                             <div className="text-slate-800 font-medium text-lg">{project.address || 'Same as client address'}</div>
                        </div>
                    </div>

                    {/* Rooms */}
                    <div className="space-y-8 flex-1">
                        {project.rooms.filter(r => r.included && r.items.length > 0).map(room => (
                            <div key={room.id} className="break-inside-avoid">
                                <div className="flex items-center gap-4 border-b border-slate-200 pb-2 mb-4">
                                    {room.photos?.[0] && (
                                        <img src={room.photos[0]} alt="Room" className="w-16 h-16 object-cover rounded border border-slate-200" />
                                    )}
                                    <h3 className="font-bold text-xl text-slate-800">{room.name}</h3>
                                </div>
                                
                                <table className="w-full text-sm text-left mb-2">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100">
                                            <th className="font-bold uppercase text-[10px] py-2 w-1/3">Item</th>
                                            <th className="font-bold uppercase text-[10px] py-2 w-2/3">Scope of Work</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {room.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="py-2 align-top font-bold text-slate-800 pr-4">
                                                    {item.name}
                                                    <div className="text-xs text-slate-400 font-normal mt-0.5">{item.color} • {item.sheen}</div>
                                                </td>
                                                <td className="py-2 align-top text-slate-600 pr-4">
                                                    {getScope(item)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="text-right mt-2 pt-2 bg-slate-50 px-2 rounded">
                                    <span className="text-xs font-bold text-slate-500 uppercase mr-4">Room Total</span>
                                    <span className="font-bold text-slate-900 text-lg">${calculateRoomTotal(room).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grand Total */}
                    <div className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-end">
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-500 uppercase mb-1">Estimate Total</div>
                            <div className="text-4xl font-black text-secondary">${project.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            <div className="text-xs text-slate-500 mt-2 italic">This estimate includes all Labor and Material needed to complete your project.</div>
                        </div>
                    </div>
                    
                    {/* Footer & Branding */}
                    <div className="mt-auto pt-8">
                        <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
                            <div className="flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-700 uppercase mb-2 text-xs">Terms & Conditions</h4>
                                    <p className="text-xs text-slate-500 mb-4">This estimate is valid for 30 days. An initial deposit is required to schedule work. Changes to scope will be billed via Change Order.</p>
                                    
                                    <h4 className="font-bold text-slate-700 uppercase mb-2 text-xs mt-4">Acceptance</h4>
                                    <div className="border-b border-slate-300 h-8 mb-1 w-full"></div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Signature</span>
                                        <span>Date</span>
                                    </div>
                                </div>
                                {branding.horizontalLogo && (
                                    <img src={branding.horizontalLogo} alt="Brand" className="mt-6 h-12 object-contain self-start" />
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl p-4 border border-slate-100">
                                {branding.qrCode ? (
                                    <>
                                        <img src={branding.qrCode} alt="QR Code" className="w-32 h-32 mb-3 mix-blend-multiply" />
                                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{branding.reviewBlurb}</p>
                                    </>
                                ) : (
                                    <div className="text-slate-400 text-xs italic">Add a QR Code in settings to show here.</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const AddRoomModal = ({ isOpen, onClose, onAdd, roomNames }: { isOpen: boolean, onClose: () => void, onAdd: (name: string, photo?: string) => void, roomNames: string[] }) => {
    const [customName, setCustomName] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    
    useEffect(() => {
        if(isOpen) {
            setCustomName('');
            setPhoto(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in-0">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg">Add Room</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="p-4">
                    <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference Photo</label>
                         <div className="flex items-center gap-3">
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                className="hidden" 
                                id="room-photo-input"
                                onChange={handlePhotoSelect}
                            />
                            <label 
                                htmlFor="room-photo-input" 
                                className="w-16 h-16 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200"
                            >
                                {photo ? (
                                    <img src={photo} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Icon name="camera" className="w-6 h-6 text-slate-400" />
                                )}
                            </label>
                            <div className="text-xs text-slate-500 flex-1">
                                Take a photo to distinguish this room (optional).
                                {photo && <button onClick={() => setPhoto(null)} className="block text-red-500 font-bold mt-1">Remove</button>}
                            </div>
                         </div>
                    </div>

                    <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Select</label>
                         <div className="flex flex-wrap gap-2">
                             {roomNames.map(name => (
                                 <button 
                                    key={name}
                                    onClick={() => setCustomName(name)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${customName === name ? 'bg-blue-50 border-secondary text-secondary' : 'bg-slate-100 border-transparent text-slate-700 hover:bg-slate-200'}`}
                                 >
                                     {name}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="border-t pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Room Name</label>
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                className="flex-1 p-2 border rounded"
                                placeholder="e.g. Sunroom"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && customName && onAdd(customName, photo || undefined)}
                            />
                            <button 
                                onClick={() => customName && onAdd(customName, photo || undefined)}
                                disabled={!customName}
                                className="bg-secondary text-white px-4 rounded font-bold disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetail = ({ project, client, templates, roomNames, branding, onBack, onUpdate, onSelectRoom }: { project: Project, client?: Client, templates: ItemTemplate[], roomNames: string[], branding: BrandingSettings, onBack: () => void, onUpdate: (p: Project) => void, onSelectRoom: (r: Room) => void }) => {
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoRoomId, setPhotoRoomId] = useState<string | null>(null);

  const handleAddRoom = (name: string, photo?: string) => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: name,
      length: 12, width: 12, height: 8,
      doors: 1, windows: 1,
      defaultCeilingGrade: PaintGrade.Contractor,
      defaultWallGrade: PaintGrade.Standard,
      defaultTrimGrade: PaintGrade.Premium,
      items: [],
      included: true,
      notes: '',
      photos: photo ? [photo] : []
    };
    const updated = { ...project, rooms: [...project.rooms, newRoom] };
    onUpdate(calculateProjectTotals(updated));
    setIsAddingRoom(false);
  };
  
  const handleDeleteRoom = (e: React.MouseEvent, roomId: string) => {
      e.stopPropagation();
      // Removed confirm dialog to ensure UI responsiveness in preview
      
      const updatedRooms = project.rooms.filter(r => r.id !== roomId);
      
      const updatedProject = calculateProjectTotals({
          ...project,
          rooms: updatedRooms
      });
      
      onUpdate(updatedProject);
  };

  const handlePhotoClick = (e: React.MouseEvent, roomId: string) => {
      e.stopPropagation();
      setPhotoRoomId(roomId);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; 
          fileInputRef.current.click();
      }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && photoRoomId) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  const MAX_SIZE = 800;
                  
                  if (width > height) {
                      if (width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                      }
                  } else {
                      if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                      }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  const photoUrl = canvas.toDataURL('image/jpeg', 0.7);

                  const updatedRooms = project.rooms.map(r => {
                      if (r.id === photoRoomId) {
                          return { ...r, photos: [photoUrl] };
                      }
                      return r;
                  });
                  onUpdate(calculateProjectTotals({ ...project, rooms: updatedRooms }));
                  setPhotoRoomId(null);
              };
              img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  if (isGeneratingPDF) {
      return (
          <EstimatePreview 
            project={project} 
            client={client}
            templates={templates} 
            branding={branding}
            onClose={() => setIsGeneratingPDF(false)} 
          />
      );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Hidden input for room photo updates */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        capture="environment" 
        onChange={handlePhotoFileChange} 
      />

      <header className="bg-white border-b px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <Icon name="chevronLeft" className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
            {/* Inline Editable Project Name */}
            <input 
               className="font-bold text-lg text-slate-900 w-full bg-transparent border-none focus:ring-0 p-0 placeholder-slate-400 focus:bg-slate-50 rounded px-1 -ml-1 truncate"
               value={project.name || ''}
               onChange={(e) => onUpdate({...project, name: e.target.value})}
               placeholder="Estimate Name (e.g. Exterior)"
            />
            {/* Client Name (ReadOnly) & Editable Address */}
            <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">{project.clientName}</span>
                <input 
                    className="text-xs text-slate-500 w-full bg-transparent border-none focus:ring-0 p-0 focus:bg-slate-50 rounded px-1 -ml-1 truncate"
                    value={project.address}
                    onChange={(e) => onUpdate({...project, address: e.target.value})}
                    placeholder="Job Site Address"
                />
            </div>
        </div>
        <div className="text-right shrink-0">
             <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total</div>
             <div className="text-xl font-black text-secondary">
                ${project.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             </div>
        </div>
      </header>
      
       <main className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-slate-700 font-semibold">Rooms</h2>
             <button onClick={() => setIsGeneratingPDF(true)} className="text-sm text-secondary font-medium px-3 py-1 hover:bg-blue-50 rounded flex items-center gap-1">
                 <Icon name="briefcase" className="w-4 h-4"/> Export PDF
             </button>
        </div>

        <div className="space-y-3">
          {project.rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:border-secondary group relative"
            >
               <div 
                   onClick={(e) => handlePhotoClick(e, room.id)}
                   className="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 relative group/photo"
               >
                   {room.photos && room.photos.length > 0 ? (
                       <img src={room.photos[0]} alt="" className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                           <Icon name="camera" className="w-5 h-5" />
                       </div>
                   )}
                   {/* Hint Overlay */}
                   <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/10 transition-colors flex items-center justify-center">
                       {(!room.photos || room.photos.length === 0) && (
                           <div className="opacity-0 group-hover/photo:opacity-100">
                               <Icon name="plus" className="w-3 h-3 text-slate-500" />
                           </div>
                       )}
                   </div>
               </div>

              <div className="flex-1">
                <h4 className="font-bold text-slate-800 group-hover:text-blue-600">{room.name}</h4>
                <p className="text-xs text-slate-500">
                   {room.items.length} items • {room.length}'x{room.width}'
                </p>
              </div>
              <div className="text-right pr-8">
                 <span className="block font-semibold text-slate-700">
                    ${calculateRoomTotal(room).toFixed(0)}
                 </span>
              </div>

              {/* Delete Button */}
              <button 
                  type="button"
                  onClick={(e) => handleDeleteRoom(e, room.id)}
                  className="absolute top-4 right-3 text-slate-300 hover:text-red-500 transition-colors p-1"
                  title="Delete Room"
              >
                  <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => setIsAddingRoom(true)}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-secondary hover:text-secondary transition-colors flex justify-center items-center gap-2"
          >
            <Icon name="plus" className="w-5 h-5" /> Add Room
          </button>
        </div>
      </main>

      <AddRoomModal 
        isOpen={isAddingRoom} 
        onClose={() => setIsAddingRoom(false)}
        onAdd={handleAddRoom}
        roomNames={roomNames}
      />
    </div>
  );
};

const RoomEditor = ({ room, projectSettings, templates, materials, onSave, onBack }: { room: Room, projectSettings: any, templates: ItemTemplate[], materials: MaterialLine[], onSave: (r: Room) => void, onBack: () => void }) => {
  const [localRoom, setLocalRoom] = useState(room);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getUnitLabel = (tplId: string) => {
    const t = templates.find(x => x.id === tplId);
    if (!t) return '';
    return t.measureType === MeasureType.Area ? 'sqft' : t.measureType === MeasureType.Length ? 'lf' : 'ea';
  };

  useEffect(() => {
    const recalculatedItems = localRoom.items.map(item => {
        const tpl = templates.find(t => t.id === item.templateId);
        if (!tpl) return item;
        const baseQty = calculateQuantity(localRoom, tpl);
        const updatedItem = { ...item, quantity: baseQty };
        return calculateItemCost(updatedItem, tpl, projectSettings, materials);
    });
    setLocalRoom(prev => ({ ...prev, items: recalculatedItems }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRoom.length, localRoom.width, localRoom.height, localRoom.doors, localRoom.windows]); 
  
  const handleUpdateItem = (itemId: string, updates: Partial<ItemInstance>) => {
      setLocalRoom(prev => {
          const idx = prev.items.findIndex(i => i.id === itemId);
          if (idx === -1) return prev;
          
          const oldItem = prev.items[idx];
          const tpl = templates.find(t => t.id === oldItem.templateId);
          if (!tpl) return prev;

          // Merge updates
          const newItemRaw = { ...oldItem, ...updates };
          
          // If updating materialId, also sync the grade for consistency/fallback logic
          if (updates.materialId) {
             const mat = materials.find(m => m.id === updates.materialId);
             if (mat) {
                 newItemRaw.grade = mat.grade;
             }
          }

          // Validate Quantity
          if (updates.quantity !== undefined && (isNaN(updates.quantity) || updates.quantity < 0)) {
              newItemRaw.quantity = 0;
          }

          // Validate Coats
          if (updates.coats !== undefined && (isNaN(updates.coats) || updates.coats < 0)) {
              newItemRaw.coats = 0;
          }

          // Recalculate Cost
          const costedItem = calculateItemCost(newItemRaw, tpl, projectSettings, materials);
          
          const newItems = [...prev.items];
          newItems[idx] = costedItem;
          return { ...prev, items: newItems };
      });
  };

  const handleAddItem = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    
    const qty = calculateQuantity(localRoom, tpl);
    const rawItem: ItemInstance = {
        id: Date.now().toString(),
        templateId: tpl.id,
        name: tpl.name,
        category: tpl.category,
        quantity: qty,
        grade: tpl.defaultGrade,
        sheen: PaintSheen.Eggshell, 
        color: 'White',
        coats: tpl.defaultCoats,
        laborMinutes: 0, laborCost: 0, materialCost: 0, totalPrice: 0
    };
    
    const costedItem = calculateItemCost(rawItem, tpl, projectSettings, materials);
    setLocalRoom(prev => ({ ...prev, items: [...prev.items, costedItem] }));
  };

  const handleAiGenerate = async () => {
      setIsThinking(true);
      try {
        const data = await parseRoomDescription(aiPromptText);
        if (data) {
            const updatedRoom = {
                ...localRoom,
                length: data.length || localRoom.length,
                width: data.width || localRoom.width,
                height: data.height || localRoom.height,
                doors: data.doors || localRoom.doors,
                windows: data.windows || localRoom.windows,
                notes: (localRoom.notes + " " + (data.notes || "")).trim()
            };
            setLocalRoom(updatedRoom);
            setShowAiPrompt(false);
        }
      } catch (e) {
          alert("AI Error. Check API Key.");
      } finally {
          setIsThinking(false);
      }
  };

  const toggleDetails = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const currentTotal = localRoom.items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="h-full flex flex-col bg-white">
       <header className="border-b px-4 py-3 flex items-center gap-4 bg-white z-10 sticky top-0">
        <button onClick={() => { onSave(localRoom); onBack(); }} className="p-2 -ml-2 text-secondary font-medium flex items-center">
          <Icon name="chevronLeft" className="w-5 h-5 mr-1" /> Done
        </button>
        <div className="flex-1 text-center">
             <div className="font-bold text-slate-800 leading-none">{localRoom.name}</div>
             <div className="text-sm font-bold text-secondary mt-0.5">
                ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
             </div>
        </div>
        <button onClick={() => setShowAiPrompt(!showAiPrompt)} className="p-2 text-purple-600 bg-purple-50 rounded-full">
            <Icon name="wand" className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
         {showAiPrompt && (
            <div className="p-4 bg-purple-50 border-b border-purple-100">
                <textarea 
                    className="w-full p-3 rounded border border-purple-200 text-sm mb-2"
                    placeholder="e.g., 'Master bed 15x18 with 9ft ceilings...'"
                    rows={3}
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                />
                <button onClick={handleAiGenerate} disabled={isThinking} className="w-full bg-purple-600 text-white text-sm py-2 rounded font-medium">
                    {isThinking ? 'Thinking...' : 'Update Room'}
                </button>
            </div>
         )}

         <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
            {['length', 'width', 'height'].map(k => (
                <div key={k} className="bg-white p-2 rounded border border-slate-200 text-center">
                    <label className="block text-[10px] uppercase text-slate-400 font-bold">{k}</label>
                    <input 
                        type="number"
                        value={(localRoom as any)[k]}
                        onChange={(e) => setLocalRoom({...localRoom, [k]: parseFloat(e.target.value) || 0})}
                        className="w-full text-center font-bold text-lg outline-none"
                    />
                </div>
            ))}
         </div>

         <div className="p-4 space-y-3">
            {localRoom.items.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                     <div className="flex justify-between mb-2 items-center">
                        <button onClick={() => toggleDetails(item.id)} className="flex items-center gap-1 text-slate-800 font-medium hover:text-secondary">
                            <Icon name={expandedItems.has(item.id) ? "chevronDown" : "chevronRight"} className="w-4 h-4 text-slate-400" />
                            {item.name}
                        </button>
                        <span className="font-bold text-slate-900">${item.totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded px-2 py-1 border border-transparent focus-within:border-secondary shrink-0">
                            <input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, { quantity: e.target.valueAsNumber })}
                                className="w-14 bg-transparent text-center font-bold text-slate-700 outline-none text-sm"
                            />
                            <span className="text-[10px] text-slate-500 font-bold uppercase ml-1 select-none">
                                {getUnitLabel(item.templateId)}
                            </span>
                        </div>

                         {/* Coats Input */}
                        <div className="flex flex-col items-center bg-slate-100 rounded px-1 py-0.5 border border-transparent focus-within:border-secondary shrink-0 w-12">
                            <label className="text-[6px] text-slate-400 uppercase font-bold leading-none">Coats</label>
                            <input 
                                type="number" 
                                min="0"
                                step="1"
                                value={item.coats}
                                onChange={(e) => handleUpdateItem(item.id, { coats: e.target.valueAsNumber })}
                                className="w-full bg-transparent text-center font-bold text-slate-700 outline-none text-sm"
                            />
                        </div>

                        {/* Material Selector - Replaces generic Grade selector */}
                        <select 
                            value={item.materialId || ''} 
                            onChange={(e) => handleUpdateItem(item.id, { materialId: e.target.value })}
                            className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-2 border-none outline-none font-medium flex-1 min-w-0 truncate"
                        >
                            <option value="" disabled>Select Material</option>
                            {Array.from(new Set(materials.map(m => m.surfaceCategory))).sort().map(cat => (
                                <optgroup key={cat} label={cat.toUpperCase()}>
                                    {materials
                                        .filter(m => m.surfaceCategory === cat)
                                        .map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.line} ({m.grade}) - ${m.pricePerGallon}
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            ))}
                        </select>

                        <button 
                            onClick={() => setLocalRoom({...localRoom, items: localRoom.items.filter(i => i.id !== item.id)})} 
                            className="text-red-400 p-1.5 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                            <Icon name="trash" className="w-4 h-4" />
                        </button>
                    </div>

                    {expandedItems.has(item.id) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 -mx-3 -mb-3 p-3 rounded-b-lg bg-slate-50">
                             {/* NEW: Sheen and Color Inputs */}
                             <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-200">
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sheen</label>
                                     <select 
                                        className="w-full p-2 border rounded text-xs bg-white"
                                        value={item.sheen}
                                        onChange={(e) => handleUpdateItem(item.id, { sheen: e.target.value as PaintSheen })}
                                     >
                                         {(Object.values(PaintSheen) as string[]).map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Color</label>
                                     <input 
                                        className="w-full p-2 border rounded text-xs bg-white"
                                        value={item.color}
                                        onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                                        placeholder="e.g. White Dove"
                                     />
                                 </div>
                             </div>

                            <div className="grid grid-cols-2 gap-y-1">
                                <div>Material Cost:</div>
                                <div className="font-mono text-right">${item.materialCost.toFixed(2)}</div>
                                
                                <div>Labor Cost:</div>
                                <div className="font-mono text-right">${item.laborCost.toFixed(2)}</div>
                                
                                <div>Overhead ({Math.round(projectSettings.overheadPct * 100)}%):</div>
                                <div className="font-mono text-right">${(item.overheadCost || 0).toFixed(2)}</div>
                                
                                <div>Profit ({Math.round(projectSettings.profitPct * 100)}%):</div>
                                <div className="font-mono text-right font-bold text-green-700">${(item.profitCost || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
         </div>
      </div>

      <div className="border-t bg-surface p-2 overflow-x-auto whitespace-nowrap pb-safe">
         <div className="flex gap-2 pb-2">
             {templates.map(tpl => (
                 <button 
                    key={tpl.id}
                    onClick={() => handleAddItem(tpl.id)}
                    className="inline-flex flex-col items-center justify-center p-3 min-w-[80px] bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-transform"
                 >
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{tpl.category}</span>
                     <span className="text-xs font-medium text-slate-800">{tpl.name.split(' ')[0]}</span>
                 </button>
             ))}
         </div>
      </div>
    </div>
  );
};

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

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const refresh = async () => {
    const [p, c, t, m, s, r, b] = await Promise.all([
      db.projects.toArray(),
      db.clients.toArray(),
      db.templates.toArray(),
      db.materials.toArray(),
      db.settings.get(),
      db.roomNames.toArray(),
      db.branding.get()
    ]);
    setProjects(p.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClients(c.sort((a, b) => a.name.localeCompare(b.name)));
    setTemplates(t);
    setMaterials(m);
    setSettings(s);
    setRoomNames(r);
    setBranding(b);
  };

  useEffect(() => {
    refresh();
  }, []);

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
  };

  const handleUpdateProject = async (p: Project) => {
      await db.projects.put(p);
      setSelectedProject(p);
      await refresh();
  };
  
  const handleUpdateClient = async (c: Client) => {
      await db.clients.put(c);
      
      // Sync address/name to all client's estimates
      const linkedProjects = projects.filter(p => p.clientId === c.id);
      if (linkedProjects.length > 0) {
          for (const p of linkedProjects) {
              // Only update if it matches the previous client name/address or if we want to force sync
              // For MVP user request "estimate address updated with clients address", we force sync.
              await db.projects.put({
                  ...p,
                  clientName: c.name,
                  address: c.address
              });
          }
      }

      await refresh();
      setSelectedClient(c);
  };

  const handleSaveRoom = async (updatedRoom: Room) => {
      if (!selectedProject) return;
      const updatedRooms = selectedProject.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
      const updatedProject = calculateProjectTotals({ ...selectedProject, rooms: updatedRooms });
      await handleUpdateProject(updatedProject);
      setSelectedRoom(null);
  };

  if (!settings || !branding) return <div className="flex h-screen items-center justify-center text-slate-400">Loading ProPaint...</div>;

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
      if (subView === 'labor') return <LaborSettings settings={settings} onSave={async (s) => { await db.settings.save(s); refresh(); }} onBack={() => setSubView(null)} />;
      if (subView === 'roomNames') return <RoomNamesEditor roomNames={roomNames} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'branding') return <BrandingEditor branding={branding} onSave={async (b) => { await db.branding.save(b); refresh(); }} onBack={() => setSubView(null)} />;
      if (subView === 'data') return <DataManagement onRefresh={refresh} onBack={() => setSubView(null)} />;
  }

  return (
      <div className="h-full bg-slate-50">
          {view === 'projects' && (
              <ProjectList 
                  projects={projects}
                  clients={clients}
                  onSelect={setSelectedProject}
                  onCreate={handleCreateProject}
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