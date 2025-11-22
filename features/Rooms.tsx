import React, { useState, useEffect } from 'react';
import { Room, ItemTemplate, MaterialLine, Service, ItemInstance, PaintGrade, PaintSheen, MeasureType } from '../types';
import { calculateQuantity, calculateItemCost } from '../services/calculationEngine';
import { parseRoomDescription } from '../services/geminiService';
import { Icon } from '../components/Shared';

export const AddRoomModal = ({ isOpen, onClose, onAdd, roomNames, serviceId, serviceName }: { isOpen: boolean, onClose: () => void, onAdd: (name: string, photo?: string) => void, roomNames: any[], serviceId: string, serviceName: string }) => {
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

    // Filter room names by the current service
    const filteredNames = roomNames.filter(r => r.serviceId === serviceId);

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in-0">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg">Add {serviceName} Area</h3>
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
                                Take a photo to distinguish this area (optional).
                                {photo && <button onClick={() => setPhoto(null)} className="block text-red-500 font-bold mt-1">Remove</button>}
                            </div>
                         </div>
                    </div>

                    <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Select ({filteredNames.length})</label>
                         <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                             {filteredNames.length === 0 ? (
                                <div className="text-xs text-slate-400 italic">No saved names for {serviceName}.</div>
                             ) : (
                                 filteredNames.map(area => (
                                     <button 
                                        key={area.id}
                                        onClick={() => setCustomName(area.name)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${customName === area.name ? 'bg-blue-50 border-secondary text-secondary' : 'bg-slate-100 border-transparent text-slate-700 hover:bg-slate-200'}`}
                                     >
                                         {area.name}
                                     </button>
                                 ))
                             )}
                         </div>
                    </div>
                    <div className="border-t pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Area Name</label>
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

export const RoomEditor = ({ room, projectSettings, templates, materials, services, onSave, onBack }: { room: Room, projectSettings: any, templates: ItemTemplate[], materials: MaterialLine[], services: Service[], onSave: (r: Room) => void, onBack: () => void }) => {
  const [localRoom, setLocalRoom] = useState(room);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter templates to only show those matching the room's service
  const activeServiceId = room.serviceId || services[0]?.id; // Fallback to first service if legacy
  const filteredTemplates = templates.filter(t => t.serviceId === activeServiceId);
  
  // Filter materials to only show those matching the room's service
  const filteredMaterials = materials.filter(m => m.serviceId === activeServiceId);

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
                            {Array.from(new Set(filteredMaterials.map(m => m.surfaceCategory))).sort().map(cat => (
                                <optgroup key={cat} label={cat.toUpperCase()}>
                                    {filteredMaterials
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
         {filteredTemplates.length === 0 ? (
             <div className="p-4 text-center text-xs text-slate-400">
                 No templates found for {services.find(s => s.id === activeServiceId)?.name || 'this service'}. <br/>
                 Check Settings {'>'} Item Templates to add some.
             </div>
         ) : (
             <div className="flex gap-2 pb-2">
                 {filteredTemplates.map(tpl => (
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
         )}
      </div>
    </div>
  );
};