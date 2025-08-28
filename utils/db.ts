import { Agent, Task, MemoryEntry, CalendarNote } from '../types';

const DB_NAME = 'cassa-vegas-db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

export type AppStateKey = 'agents' | 'tasks' | 'memories' | 'notes';
export type AppStateValue = Agent[] | Task[] | MemoryEntry[] | Record<string, CalendarNote[]>;

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // The keyPath is 'key'. We'll store data as { key: 'agents', value: [...] }
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            dbPromise = null; // Reset promise on error
            reject('IndexedDB error');
        };
    });

    return dbPromise;
};

export const getAppState = async <T extends AppStateValue>(key: AppStateKey): Promise<T | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result?.value as T);
        };

        request.onerror = () => {
            console.error(`Error getting ${key} from DB:`, request.error);
            reject(request.error);
        };
    });
};

export const setAppState = async (key: AppStateKey, value: AppStateValue): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // We wrap the data in an object that matches the keyPath
        const request = store.put({ key, value });

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error(`Error setting ${key} in DB:`, request.error);
            reject(request.error);
        };
    });
};
