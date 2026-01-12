
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, collection, doc, getDoc, setDoc, deleteDoc, getDocs, 
    query, writeBatch, initializeFirestore, persistentLocalCache 
} from 'firebase/firestore';
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User 
} from 'firebase/auth';
import { 
    getStorage, ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';
import Dexie, { Table } from 'dexie';
import { Project, Client, ItemTemplate, MaterialLine, ProjectSettings, BrandingSettings, Service, AreaName, UserProfile } from '../types';
import { DEFAULT_ITEM_TEMPLATES, DEFAULT_MATERIALS, DEFAULT_SETTINGS, DEFAULT_ROOM_NAMES, DEFAULT_SERVICES, DEFAULT_CATEGORIES, ADMIN_EMAILS } from '../constants';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyByf04BuLsJmaSdjYhe4AR_QEPbmjXkscY",
  authDomain: "paint-estimator-pro-3848d.firebaseapp.com",
  projectId: "paint-estimator-pro-3848d",
  storageBucket: "paint-estimator-pro-3848d.firebasestorage.app",
  messagingSenderId: "574969854880",
  appId: "1:574969854880:web:8bd23b4d07002330a182c5"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence enabled
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

const auth = getAuth(app);
const storage = getStorage(app);

// --- Auth Exports ---
export const authService = {
    login: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    },
    logout: async () => {
        await signOut(auth);
    },
    onUserChange: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },
    getCurrentUser: () => auth.currentUser
};

// --- Storage Exports ---
export const storageService = {
    uploadImage: async (blob: Blob, path: string): Promise<string> => {
        const user = auth.currentUser;
        if (!user) throw new Error("Must be logged in to upload");
        
        const storageRef = ref(storage, `users/${user.uid}/${path}`);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    }
};

// --- Legacy Dexie DB (For Migration Only) ---
class LegacyProPaintDB extends Dexie {
    projects!: Table<Project>;
    clients!: Table<Client>;
    templates!: Table<ItemTemplate>;
    materials!: Table<MaterialLine>;
    services!: Table<Service>;
    roomNames!: Table<AreaName>;
    categories!: Table<{ value: string }>;
    keyValueStore!: Table<{ key: string, value: any }>;

    constructor() {
        super('ProPaintDB');
        (this as any).version(1).stores({
            projects: 'id, clientId, createdAt',
            clients: 'id, name',
            templates: 'id, serviceId',
            materials: 'id, serviceId',
            services: 'id',
            roomNames: 'id, serviceId',
            categories: 'value',
            keyValueStore: 'key'
        });
    }
}
const legacyDb = new LegacyProPaintDB();

// --- Migration Helper ---
const migrateLegacyData = async (user: User) => {
    // Check if we've already migrated this specific user
    const userSettingsRef = doc(firestore, 'users', user.uid, 'settings', 'global');
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    // If user has data in cloud, assume migration done or not needed
    if (userSettingsSnap.exists()) return;

    // Check if there is local data to migrate
    const projectCount = await legacyDb.projects.count();
    if (projectCount === 0) return; // Nothing to migrate

    console.log("Migrating legacy data to Firebase...");
    const batch = writeBatch(firestore);

    const projects = await legacyDb.projects.toArray();
    projects.forEach(p => batch.set(doc(firestore, 'users', user.uid, 'projects', p.id), p));

    const clients = await legacyDb.clients.toArray();
    clients.forEach(c => batch.set(doc(firestore, 'users', user.uid, 'clients', c.id), c));

    const templates = await legacyDb.templates.toArray();
    templates.forEach(t => batch.set(doc(firestore, 'users', user.uid, 'templates', t.id), t));

    const materials = await legacyDb.materials.toArray();
    materials.forEach(m => batch.set(doc(firestore, 'users', user.uid, 'materials', m.id), m));
    
    const services = await legacyDb.services.toArray();
    services.forEach(s => batch.set(doc(firestore, 'users', user.uid, 'services', s.id), s));
    
    const roomNames = await legacyDb.roomNames.toArray();
    roomNames.forEach(r => batch.set(doc(firestore, 'users', user.uid, 'roomNames', r.id), r));
    
    const categories = await legacyDb.categories.toArray();
    categories.forEach(c => batch.set(doc(firestore, 'users', user.uid, 'categories', c.value), c));

    const settings = await legacyDb.keyValueStore.get('settings');
    if (settings) batch.set(doc(firestore, 'users', user.uid, 'settings', 'global'), { value: settings.value });

    const branding = await legacyDb.keyValueStore.get('branding');
    if (branding) batch.set(doc(firestore, 'users', user.uid, 'settings', 'branding'), { value: branding.value });

    await batch.commit();
    console.log("Migration complete.");
};

// --- Database Wrapper (API Match) ---

const getCollectionRef = (collectionName: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return collection(firestore, 'users', user.uid, collectionName);
};

const createCollectionStore = <T extends { id: string }>(collectionName: string, defaults?: T[]) => {
    return {
        toArray: async (): Promise<T[]> => {
            if (!auth.currentUser) return [];
            const snapshot = await getDocs(getCollectionRef(collectionName));
            const items = snapshot.docs.map(d => d.data() as T);
            
            // Seed defaults if empty and defaults provided (only check once per session technically, but cheap enough here)
            if (items.length === 0 && defaults) {
                 const batch = writeBatch(firestore);
                 defaults.forEach(item => {
                     const ref = doc(getCollectionRef(collectionName), item.id);
                     batch.set(ref, item);
                 });
                 if (defaults.length > 0) await batch.commit();
                 return defaults;
            }
            return items;
        },
        put: async (item: T): Promise<void> => {
            if (!auth.currentUser) return;
            await setDoc(doc(getCollectionRef(collectionName), item.id), item);
        },
        delete: async (id: string): Promise<void> => {
            if (!auth.currentUser) return;
            await deleteDoc(doc(getCollectionRef(collectionName), id));
        },
        // Used for bulk updates/resets
        setAll: async (items: T[]): Promise<void> => {
            if (!auth.currentUser) return;
            // Note: In Firestore, 'setAll' usually implies deleting everything first, which is expensive.
            // For now, we'll just upsert. If we need to clear, we'd need to delete all docs.
            const batch = writeBatch(firestore);
            items.forEach(item => {
                 batch.set(doc(getCollectionRef(collectionName), item.id), item);
            });
            await batch.commit();
        }
    };
};

const createValueStore = (collectionName: string, defaultValueIfEmpty?: string[]) => {
    return {
        toArray: async (): Promise<string[]> => {
             if (!auth.currentUser) return [];
            const snapshot = await getDocs(getCollectionRef(collectionName));
            const items = snapshot.docs.map(d => d.data().value as string);
            
            if (items.length === 0 && defaultValueIfEmpty) {
                 const batch = writeBatch(firestore);
                 defaultValueIfEmpty.forEach(val => {
                     batch.set(doc(getCollectionRef(collectionName), val), { value: val });
                 });
                 await batch.commit();
                 return defaultValueIfEmpty;
            }
            return items;
        },
        put: async (val: string): Promise<void> => {
            if (!auth.currentUser) return;
            await setDoc(doc(getCollectionRef(collectionName), val), { value: val });
        },
        delete: async (val: string): Promise<void> => {
            if (!auth.currentUser) return;
            await deleteDoc(doc(getCollectionRef(collectionName), val));
        }
    };
};

export const db = {
    // Expose migration tool for App.tsx
    migrate: migrateLegacyData,

    // Profile Management for Subscription Check
    profile: {
        get: async (): Promise<UserProfile> => {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            
            // Check Admin/Dev list first (Hardcoded Override)
            if (user.email && ADMIN_EMAILS.includes(user.email)) {
                return { email: user.email, subscriptionStatus: 'active' };
            }

            const docRef = doc(firestore, 'users', user.uid, 'profile', 'status');
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                return snap.data() as UserProfile;
            } else {
                // Initial Default Profile: Inactive
                const newProfile: UserProfile = { 
                    email: user.email || '', 
                    subscriptionStatus: 'inactive' 
                };
                await setDoc(docRef, newProfile);
                return newProfile;
            }
        }
    },

    projects: createCollectionStore<Project>('projects'),
    clients: createCollectionStore<Client>('clients'),
    templates: createCollectionStore<ItemTemplate>('templates', DEFAULT_ITEM_TEMPLATES),
    materials: createCollectionStore<MaterialLine>('materials', DEFAULT_MATERIALS),
    services: createCollectionStore<Service>('services', DEFAULT_SERVICES),
    roomNames: createCollectionStore<AreaName>('roomNames', DEFAULT_ROOM_NAMES),
    
    categories: createValueStore('categories', DEFAULT_CATEGORIES),

    settings: {
        get: async (): Promise<ProjectSettings> => {
            if (!auth.currentUser) return DEFAULT_SETTINGS;
            const snap = await getDoc(doc(getCollectionRef('settings'), 'global'));
            return snap.exists() ? snap.data().value : DEFAULT_SETTINGS;
        },
        save: async (settings: ProjectSettings): Promise<void> => {
            if (!auth.currentUser) return;
            await setDoc(doc(getCollectionRef('settings'), 'global'), { value: settings });
        }
    },

    branding: {
        get: async (): Promise<BrandingSettings> => {
             if (!auth.currentUser) return { businessName: 'ProPaint', contactInfo: '' };
            const snap = await getDoc(doc(getCollectionRef('settings'), 'branding'));
            return snap.exists() ? snap.data().value : { 
                businessName: 'ProPaint Contractors', 
                contactInfo: '123 Painter Lane\nCity, ST 12345\n(555) 555-5555',
                reviewBlurb: 'See what your neighbors are saying about us! Scan to read our 5-star reviews.'
            };
        },
        save: async (settings: BrandingSettings): Promise<void> => {
             if (!auth.currentUser) return;
            await setDoc(doc(getCollectionRef('settings'), 'branding'), { value: settings });
        }
    },

    backup: {
        export: async (): Promise<string> => {
             if (!auth.currentUser) return '{}';
            const data: Record<string, any> = {};
            data.projects = await db.projects.toArray();
            data.clients = await db.clients.toArray();
            data.templates = await db.templates.toArray();
            data.materials = await db.materials.toArray();
            data.services = await db.services.toArray();
            data.roomNames = await db.roomNames.toArray();
            data.categories = await db.categories.toArray();
            data.globalSettings = await db.settings.get();
            data.branding = await db.branding.get();
            return JSON.stringify(data, null, 2);
        },
        import: async (jsonString: string): Promise<void> => {
             if (!auth.currentUser) return;
            const data = JSON.parse(jsonString);
            // This is a heavy operation. We overwrite.
            if (data.projects) await Promise.all(data.projects.map((p:any) => db.projects.put(p)));
            if (data.clients) await Promise.all(data.clients.map((c:any) => db.clients.put(c)));
            if (data.templates) await Promise.all(data.templates.map((t:any) => db.templates.put(t)));
            if (data.materials) await Promise.all(data.materials.map((m:any) => db.materials.put(m)));
            if (data.services) await Promise.all(data.services.map((s:any) => db.services.put(s)));
            if (data.roomNames) await Promise.all(data.roomNames.map((r:any) => db.roomNames.put(r)));
            if (data.categories) await Promise.all(data.categories.map((c:any) => db.categories.put(c)));
            if (data.globalSettings) await db.settings.save(data.globalSettings);
            if (data.branding) await db.branding.save(data.branding);
        }
    }
};
