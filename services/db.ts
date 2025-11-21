import { Project, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings } from '../types';
import { DEFAULT_ITEM_TEMPLATES, DEFAULT_MATERIALS, DEFAULT_SETTINGS, DEFAULT_ROOM_NAMES } from '../constants';

const KEY_PROJECTS = 'propaint_projects';
const KEY_CLIENTS = 'propaint_clients';
const KEY_TEMPLATES = 'propaint_templates';
const KEY_MATERIALS = 'propaint_materials';
const KEY_GLOBAL_SETTINGS = 'propaint_global_settings';
const KEY_BRANDING_SETTINGS = 'propaint_branding_settings';
const KEY_ROOM_NAMES = 'propaint_room_names';

const ALL_KEYS = {
    projects: KEY_PROJECTS,
    clients: KEY_CLIENTS,
    templates: KEY_TEMPLATES,
    materials: KEY_MATERIALS,
    globalSettings: KEY_GLOBAL_SETTINGS,
    branding: KEY_BRANDING_SETTINGS,
    roomNames: KEY_ROOM_NAMES
};

// Helper for generic local storage CRUD
const createStore = <T extends { id?: string } | string>(key: string, defaultData: T[] = []) => {
    return {
        toArray: async (): Promise<T[]> => {
            const raw = localStorage.getItem(key);
            if (!raw) {
                // Seed default data if empty
                if (defaultData.length > 0) {
                    localStorage.setItem(key, JSON.stringify(defaultData));
                    return defaultData;
                }
                return [];
            }
            return JSON.parse(raw);
        },
        put: async (item: T): Promise<void> => {
            const raw = localStorage.getItem(key);
            const list: T[] = raw ? JSON.parse(raw) : [];
            
            // Handle objects with IDs
            if (typeof item === 'object' && item !== null && 'id' in item) {
                const index = list.findIndex((x: any) => x.id === item.id);
                if (index >= 0) list[index] = item;
                else list.push(item);
            } 
            // Handle primitive strings (like room names)
            else {
                if (!list.includes(item)) list.push(item);
            }
            
            localStorage.setItem(key, JSON.stringify(list));
        },
        delete: async (idOrValue: string): Promise<void> => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list: any[] = JSON.parse(raw);
            
            let filtered;
            if (list.length > 0 && typeof list[0] === 'string') {
                filtered = list.filter(x => x !== idOrValue);
            } else {
                filtered = list.filter(x => x.id !== idOrValue);
            }
            
            localStorage.setItem(key, JSON.stringify(filtered));
        }
    };
};

export const db = {
  projects: createStore<Project>(KEY_PROJECTS),
  clients: createStore<Client>(KEY_CLIENTS),
  templates: createStore<ItemTemplate>(KEY_TEMPLATES, DEFAULT_ITEM_TEMPLATES),
  materials: createStore<MaterialLine>(KEY_MATERIALS, DEFAULT_MATERIALS),
  roomNames: createStore<string>(KEY_ROOM_NAMES, DEFAULT_ROOM_NAMES),
  
  settings: {
      get: async (): Promise<ProjectSettings> => {
          const raw = localStorage.getItem(KEY_GLOBAL_SETTINGS);
          return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
      },
      save: async (settings: ProjectSettings): Promise<void> => {
          localStorage.setItem(KEY_GLOBAL_SETTINGS, JSON.stringify(settings));
      }
  },

  branding: {
      get: async (): Promise<BrandingSettings> => {
          const raw = localStorage.getItem(KEY_BRANDING_SETTINGS);
          return raw ? JSON.parse(raw) : { 
              businessName: 'ProPaint Contractors', 
              contactInfo: '123 Painter Lane\nCity, ST 12345\n(555) 555-5555',
              reviewBlurb: 'See what your neighbors are saying about us! Scan to read our 5-star reviews.'
          };
      },
      save: async (settings: BrandingSettings): Promise<void> => {
          localStorage.setItem(KEY_BRANDING_SETTINGS, JSON.stringify(settings));
      }
  },

  backup: {
      export: async (): Promise<string> => {
          const data: Record<string, any> = {};
          for (const [key, storageKey] of Object.entries(ALL_KEYS)) {
              const raw = localStorage.getItem(storageKey);
              if (raw) {
                  data[key] = JSON.parse(raw);
              }
          }
          return JSON.stringify(data, null, 2);
      },
      import: async (jsonString: string): Promise<void> => {
          const data = JSON.parse(jsonString);
          // Basic validation and restore
          for (const [key, storageKey] of Object.entries(ALL_KEYS)) {
              if (data[key]) {
                  localStorage.setItem(storageKey, JSON.stringify(data[key]));
              }
          }
      }
  }
};