import {
  ActiveMarketState,
  ActiveMedicineState,
  SavedMemo,
  UserSettings,
} from '../types';

const DB_NAME = 'MY_MEMO_LOCAL_DB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Iftikhar Ahmed',
  currency: '৳',
  theme: 'light',
  dateFormat: 'DD MMMM YYYY',
  defaultShareFormat: 'image',
  numberFormat: 'bn',
};

export const DEFAULT_MARKET_STATE: ActiveMarketState = {
  title: 'সাপ্তাহিক বাজারের মেমো',
  items: [
    {
      id: 'm-1',
      name: 'মিনিকেট চাল',
      quantity: 5,
      unit: 'কেজি',
      pricePerUnit: 70,
      note: 'ভালো মানের',
      isPurchased: false,
      createdAt: Date.now() - 3000,
    },
    {
      id: 'm-2',
      name: 'মসুর ডাল',
      quantity: 2,
      unit: 'কেজি',
      pricePerUnit: 140,
      note: '',
      isPurchased: false,
      createdAt: Date.now() - 2000,
    },
    {
      id: 'm-3',
      name: 'সয়াবিন তেল',
      quantity: 3,
      unit: 'লিটার',
      pricePerUnit: 180,
      note: 'তাজা বোতল',
      isPurchased: true,
      createdAt: Date.now() - 1000,
    },
  ],
  updatedAt: Date.now(),
};

export const DEFAULT_MEDICINE_STATE: ActiveMedicineState = {
  title: 'নিয়মিত ঔষধের মেমো',
  mode: 'full',
  items: [
    {
      id: 'med-1',
      name: 'Napa 500mg (প্যারাসিটামল)',
      stripSize: 10,
      currentStockStrips: 0,
      currentStockPieces: 2,
      calcMethod: 'monthly',
      dailyRequirement: 0,
      monthlyRequirementStrips: 1,
      monthlyRequirementPieces: 3,
      priceType: 'strip',
      unitPrice: 15,
      note: 'জরুরি জ্বরের জন্য',
      finalPurchaseStrips: 2,
      finalPurchasePieces: 0,
      isPurchaseOverridden: true,
      createdAt: Date.now() - 2000,
    },
    {
      id: 'med-2',
      name: 'Seclo 20mg (গ্যাস্ট্রিক)',
      stripSize: 14,
      currentStockStrips: 1,
      currentStockPieces: 0,
      calcMethod: 'daily',
      dailyRequirement: 2,
      monthlyRequirementStrips: 0,
      monthlyRequirementPieces: 60,
      priceType: 'strip',
      unitPrice: 98,
      note: 'সকালে ও রাতে খাবারের আগে',
      finalPurchaseStrips: 4,
      finalPurchasePieces: 0,
      isPurchaseOverridden: false,
      createdAt: Date.now() - 1000,
    },
  ],
  requiredItems: [
    {
      id: 'req-1',
      name: 'Napa Extra',
      strips: 2,
      pieces: 0,
      unitPrice: 30,
      priceType: 'strip',
      note: 'মাথাব্যথা হলে',
      createdAt: Date.now() - 2000,
    },
    {
      id: 'req-2',
      name: 'Finix 20',
      strips: 1,
      pieces: 5,
      unitPrice: 7,
      priceType: 'piece',
      note: '',
      createdAt: Date.now() - 1000,
    },
  ],
  updatedAt: Date.now(),
};

type SaveListener = (status: 'saving' | 'saved' | 'error') => void;
const saveListeners: Set<SaveListener> = new Set();

export function onSaveStatusChange(listener: SaveListener) {
  saveListeners.add(listener);
  return () => {
    saveListeners.delete(listener);
  };
}

function notifySaveStatus(status: 'saving' | 'saved' | 'error') {
  saveListeners.forEach((fn) => fn(status));
}

// IndexedDB Helper
class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Store for active market memo
        if (!db.objectStoreNames.contains('active_market')) {
          db.createObjectStore('active_market', { keyPath: 'id' });
        }

        // Store for active medicine memo
        if (!db.objectStoreNames.contains('active_medicine')) {
          db.createObjectStore('active_medicine', { keyPath: 'id' });
        }

        // Store for saved memos
        if (!db.objectStoreNames.contains('saved_memos')) {
          const store = db.createObjectStore('saved_memos', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // Store for user settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async get<T>(storeName: string, key: string | number): Promise<T | null> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? (req.result.data !== undefined ? req.result.data : req.result) : null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB get error on ${storeName}:`, err);
      return null;
    }
  }

  async set<T>(storeName: string, key: string | number, value: T): Promise<void> {
    try {
      notifySaveStatus('saving');
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        // store either directly if object has keyPath or wrapper
        const dataObj = typeof value === 'object' && value !== null && 'id' in value
          ? value
          : { key, data: value };

        const req = store.put(dataObj);
        req.onsuccess = () => {
          notifySaveStatus('saved');
          resolve();
        };
        req.onerror = () => {
          notifySaveStatus('error');
          reject(req.error);
        };
      });
    } catch (err) {
      console.error(`IndexedDB set error on ${storeName}:`, err);
      notifySaveStatus('error');
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAll error on ${storeName}:`, err);
      return [];
    }
  }

  async delete(storeName: string, key: string | number): Promise<void> {
    try {
      notifySaveStatus('saving');
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => {
          notifySaveStatus('saved');
          resolve();
        };
        req.onerror = () => {
          notifySaveStatus('error');
          reject(req.error);
        };
      });
    } catch (err) {
      console.error(`IndexedDB delete error on ${storeName}:`, err);
      notifySaveStatus('error');
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error(`IndexedDB clear error on ${storeName}:`, err);
    }
  }
}

const dbManager = new IndexedDBManager();

// --- Active Market Memo ---
export async function getActiveMarket(): Promise<ActiveMarketState> {
  const result = await dbManager.get<{ id: string; data: ActiveMarketState }>('active_market', 'current');
  if (result && (result as any).data) {
    return (result as any).data;
  }
  if (result && (result as any).items) {
    return result as any;
  }
  // Try localStorage fallback
  try {
    const local = localStorage.getItem('my_memo_active_market');
    if (local) return JSON.parse(local);
  } catch (_) {}
  return DEFAULT_MARKET_STATE;
}

export async function saveActiveMarket(state: ActiveMarketState): Promise<void> {
  state.updatedAt = Date.now();
  await dbManager.set('active_market', 'current', { id: 'current', data: state });
  try {
    localStorage.setItem('my_memo_active_market', JSON.stringify(state));
  } catch (_) {}
}

// --- Active Medicine Memo ---
export async function getActiveMedicine(): Promise<ActiveMedicineState> {
  const result = await dbManager.get<{ id: string; data: ActiveMedicineState }>('active_medicine', 'current');
  if (result && (result as any).data) {
    return (result as any).data;
  }
  if (result && (result as any).items) {
    return result as any;
  }
  try {
    const local = localStorage.getItem('my_memo_active_medicine');
    if (local) return JSON.parse(local);
  } catch (_) {}
  return DEFAULT_MEDICINE_STATE;
}

export async function saveActiveMedicine(state: ActiveMedicineState): Promise<void> {
  state.updatedAt = Date.now();
  await dbManager.set('active_medicine', 'current', { id: 'current', data: state });
  try {
    localStorage.setItem('my_memo_active_medicine', JSON.stringify(state));
  } catch (_) {}
}

// --- Saved Memos ---
export async function getSavedMemos(): Promise<SavedMemo[]> {
  const list = await dbManager.getAll<SavedMemo>('saved_memos');
  if (list && list.length > 0) {
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }
  try {
    const local = localStorage.getItem('my_memo_saved_memos');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [];
}

export async function saveSavedMemo(memo: SavedMemo): Promise<void> {
  await dbManager.set('saved_memos', memo.id, memo);
  // sync to localStorage backup
  try {
    const all = await getSavedMemos();
    const existingIndex = all.findIndex((m) => m.id === memo.id);
    if (existingIndex >= 0) {
      all[existingIndex] = memo;
    } else {
      all.unshift(memo);
    }
    localStorage.setItem('my_memo_saved_memos', JSON.stringify(all));
  } catch (_) {}
}

export async function deleteSavedMemo(id: string): Promise<void> {
  await dbManager.delete('saved_memos', id);
  try {
    const all = await getSavedMemos();
    const filtered = all.filter((m) => m.id !== id);
    localStorage.setItem('my_memo_saved_memos', JSON.stringify(filtered));
  } catch (_) {}
}

// --- Settings ---
export async function getSettings(): Promise<UserSettings> {
  const res = await dbManager.get<{ key: string; data: UserSettings }>('settings', 'user_config');
  if (res && (res as any).data) {
    return (res as any).data;
  }
  try {
    const local = localStorage.getItem('my_memo_settings');
    if (local) return JSON.parse(local);
  } catch (_) {}
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await dbManager.set('settings', 'user_config', { key: 'user_config', data: settings });
  try {
    localStorage.setItem('my_memo_settings', JSON.stringify(settings));
  } catch (_) {}
}

// --- Full Backup & Restore ---
export interface BackupData {
  version: number;
  exportedAt: string;
  activeMarket: ActiveMarketState;
  activeMedicine: ActiveMedicineState;
  savedMemos: SavedMemo[];
  settings: UserSettings;
}

export async function exportAllData(): Promise<string> {
  const activeMarket = await getActiveMarket();
  const activeMedicine = await getActiveMedicine();
  const savedMemos = await getSavedMemos();
  const settings = await getSettings();

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    activeMarket,
    activeMedicine,
    savedMemos,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importAllData(jsonStr: string): Promise<boolean> {
  try {
    const data: BackupData = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');

    if (data.activeMarket) {
      await saveActiveMarket(data.activeMarket);
    }
    if (data.activeMedicine) {
      await saveActiveMedicine(data.activeMedicine);
    }
    if (Array.isArray(data.savedMemos)) {
      await dbManager.clear('saved_memos');
      for (const memo of data.savedMemos) {
        await saveSavedMemo(memo);
      }
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }

    notifySaveStatus('saved');
    return true;
  } catch (err) {
    console.error('Failed to import backup data:', err);
    return false;
  }
}

export async function clearAllLocalData(): Promise<void> {
  await dbManager.clear('active_market');
  await dbManager.clear('active_medicine');
  await dbManager.clear('saved_memos');
  await dbManager.clear('settings');

  try {
    localStorage.removeItem('my_memo_active_market');
    localStorage.removeItem('my_memo_active_medicine');
    localStorage.removeItem('my_memo_saved_memos');
    localStorage.removeItem('my_memo_settings');
  } catch (_) {}

  // Re-seed with fresh default state
  await saveActiveMarket(DEFAULT_MARKET_STATE);
  await saveActiveMedicine(DEFAULT_MEDICINE_STATE);
  await saveSettings(DEFAULT_SETTINGS);
}

// Aliases for seamless imports
export const getActiveMarketState = getActiveMarket;
export const saveActiveMarketState = saveActiveMarket;
export const getActiveMedicineState = getActiveMedicine;
export const saveActiveMedicineState = saveActiveMedicine;
export const getAllSavedMemos = getSavedMemos;
export const saveMemo = saveSavedMemo;
export const deleteMemoById = deleteSavedMemo;
export const getUserSettings = getSettings;
export const saveUserSettings = saveSettings;
export const exportAllDataAsJSON = exportAllData;
export const importDataFromJSON = importAllData;
export const clearAllData = clearAllLocalData;
