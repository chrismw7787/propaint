import React, { useState, useRef, useEffect } from 'react';
import { Project, Client, ItemTemplate, AreaName, BrandingSettings, Service, Room, PaintGrade, ItemInstance } from '../types';
import { db } from '../services/db';
import { Icon, DeleteConfirmButton } from '../components/Shared';
import { calculateProjectTotals, calculateRoomTotal } from '../services/calculationEngine';
import { ClientSelectorModal } from './Clients';
import { AddRoomModal } from './Rooms';

export const ProjectList = ({ projects, clients, onSelect, onCreate, onDelete }: { projects: Project[], clients: Client[], onSelect: (p: Project) => void, onCreate: (clientId: string) => void, onDelete: (id: string) => void }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  // Hard limit to 5 most recent. Sorting happens in App.tsx before passing here.
  const displayedProjects = projects.slice(0, 5);

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
          <h1 className="text-3xl font-bold text-slate-900">Recent Estimates</h1>
          <p className="text-slate-500">Your latest active projects</p>
        </div>
        <button 
          onClick={() => setShowClientModal(true)}
          className="bg-secondary hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" /> New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedProjects.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                <div className="text-slate-400 mb-2">No estimates yet</div>
                <button onClick={() => setShowClientModal(true)} className="text-secondary font-bold hover:underline">Create your first estimate</button>
            </div>
        ) : (
            displayedProjects.map(p => (
            <div 
                key={p.id} 
                onClick={() => onSelect(p)}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-secondary cursor-pointer transition-all relative group"
            >
                <div className="flex justify-between items-start mb-2">
                <div className="pr-8">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{p.name || 'Untitled Estimate'}</h3>
                    <div className="text-xs text-slate-500 font-medium">{p.clientName || 'Unknown Client'}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status.toUpperCase()}
                    </span>
                    <DeleteConfirmButton onDelete={() => onDelete(p.id)} />
                </div>
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
            ))
        )}
      </div>

      {projects.length > 5 && (
          <div className="text-center mt-8 p-4 bg-slate-100 rounded-lg text-sm text-slate-500">
              <Icon name="briefcase" className="w-5 h-5 mx-auto mb-2 text-slate-400" />
              Showing 5 most recent estimates.<br/>
              To view older history, find the client in the <strong>Clients</strong> tab.
          </div>
      )}

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

export const EstimatePreview = ({ project, client, templates, branding, services, onClose }: { project: Project, client?: Client, templates: ItemTemplate[], branding: BrandingSettings, services: Service[], onClose: () => void }) => {
    // Calculation for display
    const getScope = (item: ItemInstance) => {
        const tpl = templates.find(t => t.id === item.templateId);
        return tpl?.description || '';
    };

    // Group rooms by Service
    const serviceGroups = services.map(service => {
        const rooms = project.rooms.filter(r => (r.serviceId === service.id) || (!r.serviceId && service.id === services[0].id));
        const total = rooms.reduce((sum, r) => sum + calculateRoomTotal(r), 0);
        return { service, rooms, total };
    }).filter(g => g.rooms.length > 0); // Only show active services

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

                    {/* Grouped Rooms */}
                    <div className="space-y-10 flex-1">
                        {serviceGroups.map(group => (
                            <div key={group.service.id} className="break-inside-avoid">
                                {/* Service Divider */}
                                <div className="bg-slate-800 text-white px-4 py-2 mb-4 flex justify-between items-center print:bg-slate-900">
                                    <h2 className="font-bold uppercase tracking-widest text-sm">{group.service.name}</h2>
                                    <span className="font-medium opacity-80">${group.total.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
                                </div>

                                <div className="space-y-6">
                                    {group.rooms.filter(r => r.included && r.items.length > 0).map(room => (
                                        <div key={room.id} className="pl-2 break-inside-avoid">
                                            <div className="flex items-center gap-4 border-b border-slate-200 pb-2 mb-4">
                                                {room.photos?.[0] && (
                                                    <img src={room.photos[0]} alt="Room" className="w-12 h-12 object-cover rounded border border-slate-200" />
                                                )}
                                                <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
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
                                            <div className="text-right mt-2 pt-1 px-2 rounded">
                                                <span className="text-xs font-bold text-slate-400 uppercase mr-4">Room Total</span>
                                                <span className="font-bold text-slate-700">${calculateRoomTotal(room).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            </div>
                                        </div>
                                    ))}
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

export const ProjectDetail = ({ project, client, templates, roomNames, branding, services, onBack, onUpdate, onSelectRoom }: { project: Project, client?: Client, templates: ItemTemplate[], roomNames: AreaName[], branding: BrandingSettings, services: Service[], onBack: () => void, onUpdate: (p: Project) => void, onSelectRoom: (r: Room) => void }) => {
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [targetServiceId, setTargetServiceId] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoRoomId, setPhotoRoomId] = useState<string | null>(null);

  const handleAddRoomClick = (serviceId: string) => {
      setTargetServiceId(serviceId);
      setIsAddingRoom(true);
  };

  const handleAddRoom = async (name: string, photo?: string) => {
    // 1. Auto-save new area name to global list if it doesn't exist for this service
    const nameExists = roomNames.some(r => r.name.toLowerCase() === name.toLowerCase() && r.serviceId === targetServiceId);
    if (!nameExists) {
        await db.roomNames.put({
            id: `area_${Date.now()}`,
            name: name,
            serviceId: targetServiceId
        });
    }

    // 2. Add room to project
    const newRoom: Room = {
      id: Date.now().toString(),
      name: name,
      serviceId: targetServiceId, // Linked to specific service
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
                  if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
                  else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                  canvas.width = width; canvas.height = height;
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
            services={services}
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
             <h2 className="text-slate-700 font-semibold">Scope of Work</h2>
             <button onClick={() => setIsGeneratingPDF(true)} className="text-sm text-secondary font-medium px-3 py-1 hover:bg-blue-50 rounded flex items-center gap-1">
                 <Icon name="briefcase" className="w-4 h-4"/> Export PDF
             </button>
        </div>

        <div className="space-y-8">
          {services.map(service => {
              // Logic: Filter rooms for this service. Handle legacy rooms (undefined serviceId) by assigning to first service.
              const serviceRooms = project.rooms.filter(r => (r.serviceId === service.id) || (!r.serviceId && service.id === services[0].id));
              const serviceTotal = serviceRooms.reduce((sum, r) => sum + calculateRoomTotal(r), 0);

              return (
                  <div key={service.id}>
                      {/* Service Header Divider */}
                      <div className="flex justify-between items-center bg-slate-200 px-3 py-2 rounded mb-3">
                          <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">{service.name}</span>
                          {serviceTotal > 0 && <span className="font-bold text-slate-600 text-sm">${serviceTotal.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>}
                      </div>

                      <div className="space-y-3 pl-1">
                          {serviceRooms.map(room => (
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
                            onClick={() => handleAddRoomClick(service.id)}
                            className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-400 text-sm hover:border-secondary hover:text-secondary transition-colors flex justify-center items-center gap-2"
                          >
                            <Icon name="plus" className="w-4 h-4" /> Add {service.name} Area
                          </button>
                      </div>
                  </div>
              );
          })}
        </div>
      </main>

      <AddRoomModal 
        isOpen={isAddingRoom} 
        onClose={() => setIsAddingRoom(false)}
        onAdd={handleAddRoom}
        roomNames={roomNames}
        serviceId={targetServiceId}
        serviceName={services.find(s => s.id === targetServiceId)?.name || 'Area'}
      />
    </div>
  );
};