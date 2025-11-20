
import { Project, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings, FileSystemFileHandle } from '../types';
import { DEFAULT_ITEM_TEMPLATES, DEFAULT_MATERIALS, DEFAULT_SETTINGS, DEFAULT_ROOM_NAMES } from '../constants';

const DB_NAME = 'propaint_db';
// Increment version to trigger upgrade for new 'handles' store
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            dbInstance = request.result;
            dbInstance.onversionchange = () => {
                dbInstance?.close();
                dbInstance = null;
            };
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            const create = (name: string, options?: IDBObjectStoreParameters) => {
                if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, options);
            };

            // Collections
            create('projects', { keyPath: 'id' });
            create('clients', { keyPath: 'id' });
            
            // Resources with defaults
            create('templates', { keyPath: 'id' });
            create('materials', { keyPath: 'id' });
            
            // Meta store for singletons (settings, branding, roomNames)
            create('meta');
            
            // Store for File Handles (for Sync)
            create('handles'); 
        };
    });
};

const transaction = async <T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);
        
        tx.oncomplete = () => resolve((request as IDBRequest<T>)?.result);
        tx.onerror = () => reject(tx.error);
    });
};

// --- Generic Store for Collections ---
const createCollectionStore = <T extends { id: string }>(storeName: string, defaultData: T[] = []) => {
    return {
        toArray: async (): Promise<T[]> => {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.getAll();
                
                req.onsuccess = () => {
                    const result = req.result as T[];
                    if (result.length === 0 && defaultData.length > 0) {
                        defaultData.forEach(item => store.put(item));
                        resolve(defaultData);
                    } else {
                        resolve(result);
                    }
                };
                req.onerror = () => reject(req.error);
            });
        },
        put: async (item: T): Promise<void> => {
            await transaction(storeName, 'readwrite', store => store.put(item));
        },
        delete: async (id: string): Promise<void> => {
            await transaction(storeName, 'readwrite', store => store.delete(id));
        },
        clear: async (): Promise<void> => {
            await transaction(storeName, 'readwrite', store => store.clear());
        }
    };
};

// --- Meta Store Helpers ---
const getMeta = async <T>(key: string, defaultValue: T): Promise<T> => {
    const val = await transaction<T>('meta', 'readonly', store => store.get(key));
    return val === undefined ? defaultValue : val;
};

const saveMeta = async <T>(key: string, value: T): Promise<void> => {
    await transaction('meta', 'readwrite', store => store.put(value, key));
};

// --- Backup & Restore ---
export interface BackupData {
    version: number;
    timestamp: string;
    projects: Project[];
    clients: Client[];
    templates: ItemTemplate[];
    materials: MaterialLine[];
    roomNames: string[];
    settings: ProjectSettings;
    branding: BrandingSettings;
}

const exportDatabase = async (): Promise<string> => {
    const projects = await db.projects.toArray();
    const clients = await db.clients.toArray();
    const templates = await db.templates.toArray();
    const materials = await db.materials.toArray();
    const roomNames = await db.roomNames.toArray();
    const settings = await db.settings.get();
    const branding = await db.branding.get();

    const backup: BackupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        projects,
        clients,
        templates,
        materials,
        roomNames,
        settings,
        branding
    };

    return JSON.stringify(backup, null, 2);
};

const importDatabase = async (jsonString: string): Promise<void> => {
    try {
        const data: BackupData = JSON.parse(jsonString);
        
        if (!data.projects || !data.clients || !data.settings) {
            throw new Error("Invalid backup file format");
        }

        await db.projects.clear();
        await db.clients.clear();
        await db.templates.clear();
        await db.materials.clear();
        
        for (const p of data.projects) await db.projects.put(p);
        for (const c of data.clients) await db.clients.put(c);
        for (const t of data.templates) await db.templates.put(t);
        for (const m of data.materials) await db.materials.put(m);
        
        await db.roomNames.save(data.roomNames || DEFAULT_ROOM_NAMES);
        await db.settings.save(data.settings || DEFAULT_SETTINGS);
        await db.branding.save(data.branding);

    } catch (e) {
        console.error("Import failed", e);
        throw e;
    }
};

// --- Cloud Sync (File System Access) ---
const saveSyncHandle = async (handle: FileSystemFileHandle): Promise<void> => {
    await transaction('handles', 'readwrite', store => store.put(handle, 'sync_handle'));
};

const getSyncHandle = async (): Promise<FileSystemFileHandle | undefined> => {
    return await transaction('handles', 'readonly', store => store.get('sync_handle'));
};

const syncToFile = async (handle: FileSystemFileHandle): Promise<void> => {
    try {
        // Check permissions
        const options = { mode: 'readwrite' as const };
        if ((await handle.queryPermission(options)) !== 'granted') {
            if ((await handle.requestPermission(options)) !== 'granted') {
                throw new Error("Permission denied");
            }
        }

        const json = await exportDatabase();
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        console.log("Synced to file successfully");
    } catch (e) {
        console.error("Sync failed", e);
        throw e;
    }
};

const syncFromFile = async (handle: FileSystemFileHandle): Promise<void> => {
    try {
        // Check permissions (Read only needed)
        const options = { mode: 'read' as const };
        if ((await handle.queryPermission(options)) !== 'granted') {
            if ((await handle.requestPermission(options)) !== 'granted') {
                throw new Error("Permission denied");
            }
        }
        
        const file = await handle.getFile();
        const text = await file.text();
        await importDatabase(text);
        console.log("Restored from file successfully");
    } catch (e) {
        console.error("Sync from file failed", e);
        throw e;
    }
}

export const db = {
  projects: createCollectionStore<Project>('projects'),
  clients: createCollectionStore<Client>('clients'),
  templates: createCollectionStore<ItemTemplate>('templates', DEFAULT_ITEM_TEMPLATES),
  materials: createCollectionStore<MaterialLine>('materials', DEFAULT_MATERIALS),
  
  roomNames: {
      toArray: async (): Promise<string[]> => getMeta('room_names', DEFAULT_ROOM_NAMES),
      put: async (name: string): Promise<void> => {
          const list = await getMeta<string[]>('room_names', DEFAULT_ROOM_NAMES);
          if (!list.includes(name)) {
              await saveMeta('room_names', [...list, name]);
          }
      },
      delete: async (name: string): Promise<void> => {
          const list = await getMeta<string[]>('room_names', DEFAULT_ROOM_NAMES);
          await saveMeta('room_names', list.filter(x => x !== name));
      },
      save: async (list: string[]) => saveMeta('room_names', list)
  },
  
  settings: {
      get: async () => getMeta('settings', DEFAULT_SETTINGS),
      save: async (s: ProjectSettings) => saveMeta('settings', s)
  },

  branding: {
      get: async () => getMeta('branding', { 
          businessName: 'ProPaint Contractors', 
          contactInfo: '123 Painter Lane\nCity, ST 12345\n(555) 555-5555',
          reviewBlurb: 'See what your neighbors are saying about us! Scan to read our 5-star reviews.'
      }),
      save: async (b: BrandingSettings) => saveMeta('branding', b)
  },

  backup: {
      export: exportDatabase,
      import: importDatabase
  },
  
  sync: {
      saveHandle: saveSyncHandle,
      getHandle: getSyncHandle,
      toFile: syncToFile,
      fromFile: syncFromFile
  }
};
