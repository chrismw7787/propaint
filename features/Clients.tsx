import React, { useState } from 'react';
import { Client, Project } from '../types';
import { db } from '../services/db';
import { Icon, DeleteConfirmButton } from '../components/Shared';

export const ClientForm = ({ initialData, onSave, onCancel }: { initialData: Partial<Client>, onSave: (data: Partial<Client>) => Promise<void>, onCancel: () => void }) => {
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

export const ClientSelectorModal = ({ clients, onSelect, onCreateNew, onCancel }: { clients: Client[], onSelect: (c: Client) => void, onCreateNew: () => void, onCancel: () => void }) => (
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

export const ClientList = ({ clients, onSelect, onRefresh, onDelete }: { clients: Client[], onSelect: (c: Client) => void, onRefresh: () => void, onDelete: (id: string) => void }) => {
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
                    <div key={c.id} onClick={() => onSelect(c)} className="bg-white p-4 rounded-lg shadow-sm border hover:border-secondary cursor-pointer group relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-lg">{c.name}</div>
                                <div className="text-sm text-slate-500">{c.phone} • {c.email}</div>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                                <DeleteConfirmButton onDelete={() => onDelete(c.id)} />
                            </div>
                        </div>
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

export const ClientDetail = ({ client, projects, onBack, onUpdate, onCreateEstimate, onSelectEstimate }: { 
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