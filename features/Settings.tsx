import React, { useState, useRef, useEffect } from 'react';
import { AreaName, Service, BrandingSettings, ItemTemplate, MaterialLine, ProjectSettings, PaintGrade, MeasureType } from '../types';
import { db } from '../services/db';
import { Icon } from '../components/Shared';

export const SettingsMenu = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <div className="p-6 pb-24">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>
        <div className="space-y-3">
            
            {/* Data Management */}
            <button 
                onClick={() => onNavigate('data')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Services & Categories
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>

            {/* Area Names */}
            <button 
                onClick={() => onNavigate('roomNames')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Area Names
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>
            
             {/* Branding */}
            <button 
                onClick={() => onNavigate('branding')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Branding
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>

            {/* Templates */}
            <button 
                onClick={() => onNavigate('templates')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Item Templates
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>

            {/* Materials */}
            <button 
                onClick={() => onNavigate('materials')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Material Price Book
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>

            {/* Labor */}
            <button 
                onClick={() => onNavigate('labor')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Labor & Pricing
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>
            
            {/* Data & Backup */}
            <button 
                onClick={() => onNavigate('backup')}
                className="w-full text-left p-4 bg-white text-slate-800 font-bold text-lg border rounded-lg shadow-sm hover:border-secondary hover:shadow-md transition-all flex justify-between items-center"
            >
                Backup & Restore
                <Icon name="chevronLeft" className="w-5 h-5 rotate-180 text-slate-300" />
            </button>

        </div>
    </div>
);

// --- Shared Components for Consistent UI ---

const SettingsHeader = ({ title, onBack, onAdd, showAdd = true }: { title: string, onBack: () => void, onAdd?: () => void, showAdd?: boolean }) => (
    <header className="bg-white p-4 border-b flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><Icon name="chevronLeft" className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg flex-1">{title}</h1>
        {showAdd && onAdd && (
            <button onClick={onAdd} className="text-secondary font-bold px-3 py-1.5 hover:bg-blue-50 rounded flex items-center gap-1">
                <Icon name="plus" className="w-4 h-4"/> Add
            </button>
        )}
    </header>
);

const SettingsListItem = ({ 
    title, 
    subtitle, 
    badge,
    onEdit, 
    onDelete 
}: { 
    title: string, 
    subtitle?: string, 
    badge?: string,
    onEdit?: () => void, 
    onDelete: () => void 
}) => {
    const [confirming, setConfirming] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirming) {
            onDelete();
            setConfirming(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
            setConfirming(true);
            timeoutRef.current = window.setTimeout(() => setConfirming(false), 3000);
        }
    };

    return (
        <div className="flex justify-between items-center p-3 bg-white border rounded mb-2 shadow-sm hover:border-secondary transition-colors group relative overflow-hidden">
            <div onClick={onEdit} className={`flex-1 pr-4 ${onEdit ? 'cursor-pointer' : ''}`}>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{title}</span>
                    {badge && (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
            </div>
            <button 
                type="button"
                onClick={handleClick} 
                className={`flex items-center gap-1 p-2 rounded-lg transition-all shrink-0 z-20 ${
                    confirming 
                    ? 'bg-red-100 text-red-600 px-3' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                title={confirming ? "Click again to confirm" : "Delete"}
            >
                <Icon name="trash" className="w-5 h-5 pointer-events-none" />
                {confirming && <span className="text-xs font-bold animate-in fade-in">Confirm?</span>}
            </button>
        </div>
    );
};


export const DataManagement = ({ services, categories, onUpdate, onBack }: { services: Service[], categories: string[], onUpdate: () => void, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
    const [editing, setEditing] = useState<any | null>(null);

    const handleSave = async () => {
        if (!editing) return;
        const val = editing.value?.trim();
        if (!val) return;

        if (activeTab === 'services') {
            await db.services.put({ id: editing.id || `svc_${Date.now()}`, name: val });
        } else {
            await db.categories.put(val);
        }
        setEditing(null);
        onUpdate();
    };

    const handleDelete = async (idOrValue: string, name: string) => {
        // Confirmation is now handled by the UI component (SettingsListItem)
        if (activeTab === 'services') {
            // Services use ObjectStore, delete by ID
            await db.services.delete(idOrValue);
        } else {
            // Categories use ValueStore, delete by Value
            await db.categories.delete(idOrValue);
        }
        onUpdate();
    };

    const handleBack = () => {
        if (editing) setEditing(null);
        else onBack();
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <SettingsHeader 
                title={editing ? (activeTab === 'services' ? "Edit Service" : "Edit Category") : "Data Management"}
                onBack={handleBack}
                showAdd={!editing}
                onAdd={() => setEditing({ value: '' })}
            />
            
            {!editing && (
                <div className="flex bg-white border-b sticky top-[60px] z-10 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('services')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'services' ? 'border-secondary text-secondary' : 'border-transparent text-slate-500'}`}
                    >
                        Services
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'categories' ? 'border-secondary text-secondary' : 'border-transparent text-slate-500'}`}
                    >
                        Categories
                    </button>
                </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto">
                {editing ? (
                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Name</label>
                            <input 
                                autoFocus
                                className="w-full p-3 border rounded bg-white" 
                                value={editing.value} 
                                onChange={e => setEditing({...editing, value: e.target.value})}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                            />
                        </div>
                        <button onClick={handleSave} className="w-full bg-secondary text-white py-3 rounded font-bold">Save</button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'services' && services.map(s => (
                            <SettingsListItem 
                                key={s.id}
                                title={s.name}
                                onEdit={() => setEditing({ id: s.id, value: s.name })}
                                onDelete={() => handleDelete(s.id, s.name)}
                            />
                        ))}
                        {activeTab === 'categories' && categories.map(c => (
                            <SettingsListItem 
                                key={c}
                                title={c}
                                onEdit={() => setEditing({ value: c })} // Categories are strings, so "ID" is value
                                onDelete={() => handleDelete(c, c)}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export const AreaNamesEditor = ({ roomNames, services, onUpdate, onBack }: { roomNames: AreaName[], services: Service[], onUpdate: () => void, onBack: () => void }) => {
    const [editing, setEditing] = useState<Partial<AreaName> | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
    
    const handleSave = async () => {
        if (!editing || !editing.name) return;
        await db.roomNames.put({
            id: editing.id || `area_${Date.now()}`,
            name: editing.name,
            serviceId: editing.serviceId || services[0].id
        } as AreaName);
        setEditing(null);
        onUpdate();
    };

    const handleDelete = async (id: string, name: string) => {
        await db.roomNames.delete(id);
        onUpdate();
    };

    const filteredAreas = roomNames
        .filter(r => selectedServiceId === 'all' || r.serviceId === selectedServiceId)
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleBack = () => {
        if (editing) setEditing(null);
        else onBack();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
             <SettingsHeader 
                title={editing ? "Edit Area Name" : "Area Names"}
                onBack={handleBack}
                showAdd={!editing}
                onAdd={() => setEditing({ serviceId: selectedServiceId === 'all' ? services[0]?.id : selectedServiceId })}
            />

            {editing ? (
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Area Name</label>
                        <input 
                            className="w-full p-3 border rounded bg-white" 
                            value={editing.name || ''} 
                            onChange={e => setEditing({...editing, name: e.target.value})}
                            placeholder="e.g. Guest Bedroom"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Service</label>
                        <select 
                            className="w-full p-3 border rounded bg-white"
                            value={editing.serviceId || ''}
                            onChange={e => setEditing({...editing, serviceId: e.target.value})}
                        >
                            <option value="" disabled>Select Service</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSave} className="w-full bg-secondary text-white py-3 rounded font-bold">Save Area Name</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="px-4 py-2 border-b bg-slate-50">
                        <select 
                            className="w-full p-2 border rounded bg-white text-sm" 
                            value={selectedServiceId} 
                            onChange={e => setSelectedServiceId(e.target.value)}
                        >
                            <option value="all">All Services</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {filteredAreas.length === 0 ? (
                            <div className="text-center text-slate-400 py-10 italic">
                                No area names found for this service.
                            </div>
                        ) : (
                            filteredAreas.map(area => (
                                <SettingsListItem 
                                    key={area.id}
                                    title={area.name}
                                    badge={services.find(s => s.id === area.serviceId)?.name}
                                    onEdit={() => setEditing(area)}
                                    onDelete={() => handleDelete(area.id, area.name)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const TemplatesEditor = ({ templates, services, categories, onUpdate, onBack }: { templates: ItemTemplate[], services: Service[], categories: string[], onUpdate: () => void, onBack: () => void }) => {
    const [editingItem, setEditingItem] = useState<Partial<ItemTemplate> | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('all');

    const handleSave = async () => {
        if(!editingItem || !editingItem.name) return;
        await db.templates.put({
            ...editingItem,
            id: editingItem.id || `tpl_${Date.now()}`,
            category: editingItem.category || categories[0] || 'Other',
            serviceId: editingItem.serviceId || services[0]?.id || 'svc_interior',
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

    const handleDelete = async (id: string, name: string) => {
        await db.templates.delete(id);
        onUpdate();
    };

    const handleDeleteFromEdit = async () => {
        if (editingItem && editingItem.id && editingItem.name) {
            await db.templates.delete(editingItem.id);
            setEditingItem(null);
            onUpdate();
        }
    }

    const handleBack = () => {
        if (editingItem) setEditingItem(null);
        else onBack();
    };

    const filteredTemplates = templates
        .filter(t => selectedServiceId === 'all' || t.serviceId === selectedServiceId);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <SettingsHeader 
                title={editingItem ? "Edit Template" : "Item Templates"}
                onBack={handleBack}
                showAdd={!editingItem}
                onAdd={() => setEditingItem({ serviceId: selectedServiceId === 'all' ? services[0]?.id : selectedServiceId })}
            />
            
            {editingItem ? (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                        <input className="w-full p-2 border rounded bg-white" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Service</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingItem.serviceId || ''} onChange={e => setEditingItem({...editingItem, serviceId: e.target.value})}>
                                <option value="" disabled>Select Service</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                                <option value="" disabled>Select Category</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Measure Type</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingItem.measureType} onChange={e => setEditingItem({...editingItem, measureType: e.target.value as MeasureType})}>
                                {(Object.values(MeasureType) as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Prod (hr/unit)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded bg-white" 
                                value={editingItem.productivityMinutesPerUnit ? editingItem.productivityMinutesPerUnit / 60 : 0} 
                                onChange={e => setEditingItem({...editingItem, productivityMinutesPerUnit: parseFloat(e.target.value) * 60})} 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    {editingItem.id && (
                        <button onClick={handleDeleteFromEdit} className="w-full py-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded font-bold mt-2">Delete Template</button>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 border-b bg-slate-50">
                        <select 
                            className="w-full p-2 border rounded bg-white text-sm" 
                            value={selectedServiceId} 
                            onChange={e => setSelectedServiceId(e.target.value)}
                        >
                            <option value="all">All Services</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center text-slate-400 py-10 italic">
                                No templates found for this service.
                            </div>
                        ) : (
                            filteredTemplates.map(t => (
                                <SettingsListItem 
                                    key={t.id}
                                    title={t.name}
                                    subtitle={`${t.category} • ${t.measureType}`}
                                    badge={services.find(s => s.id === t.serviceId)?.name}
                                    onEdit={() => setEditingItem(t)}
                                    onDelete={() => handleDelete(t.id, t.name)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const MaterialsEditor = ({ materials, categories, services, onUpdate, onBack }: { materials: MaterialLine[], categories: string[], services: Service[], onUpdate: () => void, onBack: () => void }) => {
    const [editing, setEditing] = useState<Partial<MaterialLine> | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('all');

    const filteredMaterials = selectedServiceId === 'all' 
        ? materials 
        : materials.filter(m => m.serviceId === selectedServiceId);

    const handleSave = async () => {
        if(!editing || !editing.line) return;
        await db.materials.put({
            ...editing,
            id: editing.id || `mat_${Date.now()}`,
            brand: editing.brand || 'Generic',
            grade: editing.grade || PaintGrade.Standard,
            surfaceCategory: editing.surfaceCategory || categories[0] || 'Other',
            serviceId: editing.serviceId || services[0]?.id || 'svc_interior',
            coverageSqft: editing.coverageSqft || 350,
            pricePerGallon: editing.pricePerGallon || 45
        } as MaterialLine);
        setEditing(null);
        onUpdate();
    };

    const handleDelete = async (id: string, name: string) => {
        await db.materials.delete(id);
        onUpdate();
    };

    const handleDeleteFromEdit = async () => {
        if (editing && editing.id && editing.line) {
             await db.materials.delete(editing.id);
             setEditing(null);
             onUpdate();
        }
    }

    const handleBack = () => {
        if (editing) setEditing(null);
        else onBack();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <SettingsHeader 
                title={editing ? "Edit Material" : "Material Price Book"}
                onBack={handleBack}
                showAdd={!editing}
                onAdd={() => setEditing({ serviceId: selectedServiceId === 'all' ? services[0]?.id : selectedServiceId })}
            />

            {editing ? (
                 <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <input placeholder="Brand" className="w-full p-2 border rounded" value={editing.brand || ''} onChange={e => setEditing({...editing, brand: e.target.value})} />
                    <input placeholder="Product Line" className="w-full p-2 border rounded" value={editing.line || ''} onChange={e => setEditing({...editing, line: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Service</label>
                            <select className="w-full p-2 border rounded bg-white" value={editing.serviceId || ''} onChange={e => setEditing({...editing, serviceId: e.target.value})}>
                                <option value="" disabled>Select Service</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                            <select className="w-full p-2 border rounded bg-white" value={editing.surfaceCategory || ''} onChange={e => setEditing({...editing, surfaceCategory: e.target.value})}>
                                <option value="" disabled>Select Category</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Grade</label>
                            <select className="w-full p-2 border rounded" value={editing.grade} onChange={e => setEditing({...editing, grade: e.target.value as PaintGrade})}>
                                 <option value={PaintGrade.Contractor}>Contractor</option>
                                 <option value={PaintGrade.Standard}>Standard</option>
                                 <option value={PaintGrade.Premium}>Premium</option>
                                 <option value={PaintGrade.HighPerformance}>High Performance</option>
                            </select>
                        </div>
                    </div>
                    
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
                    {editing.id && (
                        <button onClick={handleDeleteFromEdit} className="w-full py-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded font-bold mt-2">Delete Material</button>
                    )}
                 </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 border-b bg-slate-50">
                        <select 
                            className="w-full p-2 border rounded bg-white text-sm" 
                            value={selectedServiceId} 
                            onChange={e => setSelectedServiceId(e.target.value)}
                        >
                            <option value="all">All Services</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {filteredMaterials.length === 0 ? (
                            <div className="text-center text-slate-400 py-10 italic">
                                No materials found for this service.
                            </div>
                        ) : (
                            filteredMaterials.map(m => (
                                <SettingsListItem 
                                    key={m.id}
                                    title={m.line}
                                    subtitle={`${m.brand} • ${m.grade} • $${m.pricePerGallon}/gal`}
                                    badge={services.find(s => s.id === m.serviceId)?.name}
                                    onEdit={() => setEditing(m)}
                                    onDelete={() => handleDelete(m.id, m.line)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const BackupRestore = ({ onBack, onRefresh }: { onBack: () => void, onRefresh: () => void }) => {
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
                <h1 className="font-bold text-lg">Backup & Restore</h1>
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

export const BrandingEditor = ({ branding, onSave, onBack }: { branding: BrandingSettings, onSave: (b: BrandingSettings) => void, onBack: () => void }) => {
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

export const LaborSettings = ({ settings, onSave, onBack }: { settings: ProjectSettings, onSave: (s: ProjectSettings) => void, onBack: () => void }) => {
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