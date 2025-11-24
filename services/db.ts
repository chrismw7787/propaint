import { Project, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings, Service, AreaName } from '../types';
import { DEFAULT_ITEM_TEMPLATES, DEFAULT_MATERIALS, DEFAULT_SETTINGS, DEFAULT_ROOM_NAMES, DEFAULT_SERVICES, DEFAULT_CATEGORIES } from '../constants';

const KEY_PROJECTS = 'propaint_projects';
const KEY_CLIENTS = 'propaint_clients';
const KEY_TEMPLATES = 'propaint_templates';
const KEY_MATERIALS = 'propaint_materials';
const KEY_GLOBAL_SETTINGS = 'propaint_global_settings';
const KEY_BRANDING_SETTINGS = 'propaint_branding_settings';
const KEY_ROOM_NAMES = 'propaint_room_names';
const KEY_SERVICES = 'propaint_services';
const KEY_CATEGORIES = 'propaint_categories';

const ALL_KEYS = {
    projects: KEY_PROJECTS,
    clients: KEY_CLIENTS,
    templates: KEY_TEMPLATES,
    materials: KEY_MATERIALS,
    globalSettings: KEY_GLOBAL_SETTINGS,
    branding: KEY_BRANDING_SETTINGS,
    roomNames: KEY_ROOM_NAMES,
    services: KEY_SERVICES,
    categories: KEY_CATEGORIES
};

// --- Specialized Stores ---

// 1. Object Store: For items that strictly have an 'id' property (e.g., Projects, Clients, Templates)
const createObjectStore = <T extends { id: string }>(key: string, defaultData: T[] = []) => {
    return {
        toArray: async (): Promise<T[]> => {
            const raw = localStorage.getItem(key);
            if (!raw) {
                if (defaultData.length > 0) {
                    localStorage.setItem(key, JSON.stringify(defaultData));
                    return defaultData;
                }
                return [];
            }
            try {
                return JSON.parse(raw);
            } catch (e) {
                console.error(`Error parsing ${key}`, e);
                return [];
            }
        },
        put: async (item: T): Promise<void> => {
            const raw = localStorage.getItem(key);
            const list: T[] = raw ? JSON.parse(raw) : [];
            const index = list.findIndex(x => String(x.id) === String(item.id));
            
            if (index >= 0) {
                list[index] = item;
            } else {
                list.push(item);
            }
            localStorage.setItem(key, JSON.stringify(list));
        },
        delete: async (id: string): Promise<void> => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list: T[] = JSON.parse(raw);
            // Strict ID filtering
            const filtered = list.filter(x => String(x.id) !== String(id));
            localStorage.setItem(key, JSON.stringify(filtered));
        },
        setAll: async (items: T[]): Promise<void> => {
            localStorage.setItem(key, JSON.stringify(items));
        }
    };
};

// 2. Value Store: For simple string lists (e.g., Categories)
const createValueStore = (key: string, defaultData: string[] = []) => {
    return {
        toArray: async (): Promise<string[]> => {
            const raw = localStorage.getItem(key);
            if (!raw) {
                if (defaultData.length > 0) {
                    localStorage.setItem(key, JSON.stringify(defaultData));
                    return defaultData;
                }
                return [];
            }
            try {
                return JSON.parse(raw);
            } catch (e) {
                return [];
            }
        },
        put: async (item: string): Promise<void> => {
            const raw = localStorage.getItem(key);
            const list: string[] = raw ? JSON.parse(raw) : [];
            if (!list.includes(item)) {
                list.push(item);
                localStorage.setItem(key, JSON.stringify(list));
            }
        },
        delete: async (value: string): Promise<void> => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list: string[] = JSON.parse(raw);
            const filtered = list.filter(x => x !== value);
            localStorage.setItem(key, JSON.stringify(filtered));
        },
        setAll: async (items: string[]): Promise<void> => {
            localStorage.setItem(key, JSON.stringify(items));
        }
    };
};

export const db = {
  projects: createObjectStore<Project>(KEY_PROJECTS),
  clients: createObjectStore<Client>(KEY_CLIENTS),
  templates: createObjectStore<ItemTemplate>(KEY_TEMPLATES, DEFAULT_ITEM_TEMPLATES),
  materials: createObjectStore<MaterialLine>(KEY_MATERIALS, DEFAULT_MATERIALS),
  roomNames: createObjectStore<AreaName>(KEY_ROOM_NAMES, DEFAULT_ROOM_NAMES),
  services: createObjectStore<Service>(KEY_SERVICES, DEFAULT_SERVICES),
  categories: createValueStore(KEY_CATEGORIES, DEFAULT_CATEGORIES),
  
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
          for (const [key, storageKey] of Object.entries(ALL_KEYS)) {
              if (data[key]) {
                  localStorage.setItem(storageKey, JSON.stringify(data[key]));
              }
          }
      }
  }
};