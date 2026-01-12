import React, { useState, useEffect } from 'react';
import { Project, Room, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings, Service, AreaName, UserProfile } from './types';
import { calculateProjectTotals } from './services/calculationEngine';
import { db, authService } from './services/db';
import { BottomNav } from './components/Shared';
import { LoginScreen, PaywallScreen } from './features/Auth';

// Feature Components
import { ClientList, ClientDetail } from './features/Clients';
import { ProjectList, ProjectDetail } from './features/Projects';
import { RoomEditor } from './features/Rooms';
import { SettingsMenu, TemplatesEditor, MaterialsEditor, LaborSettings, AreaNamesEditor, BrandingEditor, DataManagement, BackupRestore } from './features/Settings';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // App State
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

  useEffect(() => {
    // Auth Listener
    const unsubscribe = authService.onUserChange(async (u) => {
        setUser(u);
        if (u) {
            setLoading(true);
            try {
                // Check Subscription First
                const profile = await db.profile.get();
                setUserProfile(profile);

                if (profile.subscriptionStatus === 'active') {
                    // Try to migrate legacy data if first time login
                    await db.migrate(u);
                    await refresh();
                }
            } catch (e) {
                console.error("Migration/Load Error", e);
            } finally {
                // Always stop loading to avoid white screen
                setLoading(false);
            }
        } else {
            setUserProfile(null);
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  const refresh = async () => {
    if (!authService.getCurrentUser()) return;

    try {
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
        setRoomNames(r);
        setBranding(b);
        setServices(svcs);
        setCategories(cats);
    } catch (err) {
        console.error("Failed to refresh app data", err);
    }
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

  if (loading) {
      return (
          <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white font-bold p-6 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-xl tracking-tight">ProPaint</div>
              <div className="text-slate-500 text-sm mt-2 font-normal italic">Optimizing for tablet...</div>
          </div>
      );
  }

  if (!user) {
      return <LoginScreen />;
  }

  if (!userProfile || userProfile.subscriptionStatus !== 'active') {
      return <PaywallScreen />;
  }

  if (!settings || !branding) return <div className="flex h-screen items-center justify-center text-slate-400">Loading Data...</div>;

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