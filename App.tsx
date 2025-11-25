import React, { useState, useEffect } from 'react';
import { Project, Room, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings, Service, AreaName } from './types';
import { calculateProjectTotals } from './services/calculationEngine';
import { db } from './services/db';
import { BottomNav } from './components/Shared';

// Feature Components
import { ClientList, ClientDetail } from './features/Clients';
import { ProjectList, ProjectDetail } from './features/Projects';
import { RoomEditor } from './features/Rooms';
import { SettingsMenu, TemplatesEditor, MaterialsEditor, LaborSettings, AreaNamesEditor, BrandingEditor, DataManagement, BackupRestore } from './features/Settings';

const App = () => {
  const [view, setView] = useState<'projects' | 'clients' | 'settings'>('projects');
  const [subView, setSubView] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [roomNames, setRoomNames] = useState<AreaName[]>([]);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const refresh = async () => {
    const [p, c, t, m, s, r, b, svcs, cats] = await Promise.all([
      db.projects.toArray(),
      db.clients.toArray(),
      db.templates.toArray(),
      db.materials.toArray(),
      db.settings.get(),
      db.roomNames.toArray(),
      db.branding.get(),
      db.services.toArray(),
      db.categories.toArray()
    ]);
    setProjects(p.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClients(c.sort((a, b) => a.name.localeCompare(b.name)));
    setTemplates(t);
    setMaterials(m);
    setSettings(s);

    // Migration logic for legacy text-based room names
    // We must check if migration is needed, perform it, AND SAVE IT immediately
    // otherwise IDs will regenerate on every reload, breaking deletion.
    let loadedRoomNames = r as any[];
    if (loadedRoomNames.length > 0 && typeof loadedRoomNames[0] === 'string') {
        const migratedNames = loadedRoomNames.map(name => ({
            id: `area_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
            name: name,
            serviceId: 'svc_interior' // Default fallback
        }));
        
        // SAVE the migrated data so IDs persist
        await db.roomNames.setAll(migratedNames); 
        setRoomNames(migratedNames);
    } else {
        setRoomNames(loadedRoomNames as AreaName[]);
    }

    setBranding(b);
    setServices(svcs);
    setCategories(cats);
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

  const handleDeleteProject = async (projectId: string) => {
      await db.projects.delete(projectId);
      if (selectedProject?.id === projectId) setSelectedProject(null);
      await refresh();
  };
  
  const handleUpdateClient = async (c: Client) => {
      await db.clients.put(c);
      
      // Sync address/name to all client's estimates
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
  };

  const handleDeleteClient = async (clientId: string) => {
      await db.clients.delete(clientId);
      if (selectedClient?.id === clientId) setSelectedClient(null);
      await refresh();
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
            services={services}
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
             services={services}
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
      if (subView === 'templates') return <TemplatesEditor templates={templates} services={services} categories={categories} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'materials') return <MaterialsEditor materials={materials} categories={categories} services={services} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'labor') return <LaborSettings settings={settings} onSave={async (s) => { await db.settings.save(s); refresh(); }} onBack={() => setSubView(null)} />;
      if (subView === 'roomNames') return <AreaNamesEditor roomNames={roomNames} services={services} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'branding') return <BrandingEditor branding={branding} onSave={async (b) => { await db.branding.save(b); refresh(); }} onBack={() => setSubView(null)} />;
      if (subView === 'data') return <DataManagement services={services} categories={categories} onUpdate={refresh} onBack={() => setSubView(null)} />;
      if (subView === 'backup') return <BackupRestore onRefresh={refresh} onBack={() => setSubView(null)} />;
  }

  return (
      <div className="h-full bg-slate-50">
          {view === 'projects' && (
              <ProjectList 
                  projects={projects}
                  clients={clients}
                  onSelect={setSelectedProject}
                  onCreate={handleCreateProject}
                  onDelete={handleDeleteProject}
              />
          )}

          {view === 'clients' && (
              <ClientList 
                  clients={clients}
                  onSelect={setSelectedClient}
                  onRefresh={refresh}
                  onDelete={handleDeleteClient}
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