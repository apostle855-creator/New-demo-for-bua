import { AcademicResource, PendingUpload, ComplaintTicket, Leader, AuditLog } from './types';

export const GOOGLE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1KtDYFMSZ5ZjGxt-Z-9-mRxKAgLrYenMy";
export const GOOGLE_DRIVE_FOLDER_ID = "1KtDYFMSZ5ZjGxt-Z-9-mRxKAgLrYenMy";

const DB_NAME = 'ACADEMIC_PORTAL_STRIPED_DB';
const DB_VERSION = 4;

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const stores = [
          { name: 'resources', key: 'id' },
          { name: 'pending_uploads', key: 'trackingId' },
          { name: 'recycled_resources', key: 'id' },
          { name: 'suggestions', key: 'ticketId' },
          { name: 'reports', key: 'id' },
          { name: 'leadership', key: 'role' },
          { name: 'audit_logs', key: 'id' },
          { name: 'settings', key: 'key' }
        ];
        stores.forEach((s) => {
          if (!db.objectStoreNames.contains(s.name)) {
            db.createObjectStore(s.name, { keyPath: s.key });
          }
        });
      };

      req.onsuccess = (e) => {
        dbInstance = (e.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      req.onerror = (e) => {
        console.warn('IndexedDB unavailable, falling back to localStorage:', (e.target as IDBOpenDBRequest).error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB error:', err);
      resolve(null);
    }
  });
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    }
  } catch (e) {
    console.warn(`dbGetAll error for ${storeName}:`, e);
  }

  // LocalStorage fallback
  try {
    const raw = localStorage.getItem('acad_striped_' + storeName);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function dbGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
  } catch (e) {
    console.warn(`dbGet error for ${storeName} key ${key}:`, e);
  }

  try {
    const all = await dbGetAll<any>(storeName);
    const keyField = getKeyField(storeName);
    return all.find((item) => item[keyField] === key) || null;
  } catch {
    return null;
  }
}

function getKeyField(storeName: string): string {
  if (storeName === 'pending_uploads') return 'trackingId';
  if (storeName === 'suggestions') return 'ticketId';
  if (storeName === 'leadership') return 'role';
  if (storeName === 'settings') return 'key';
  return 'id';
}

function stripBlobsForLocalStorage(val: any): any {
  if (!val) return val;
  if (Array.isArray(val)) {
    return val.map((item) => stripBlobsForLocalStorage(item));
  }
  if (typeof val === 'object') {
    const copy = { ...val };
    if ('fileBlob' in copy) {
      delete copy.fileBlob;
    }
    return copy;
  }
  return val;
}

export async function dbPut<T>(storeName: string, value: T | T[]): Promise<T | T[]> {
  try {
    const db = await openDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          if (Array.isArray(value)) {
            value.forEach((v) => store.put(v));
          } else {
            store.put(value);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (e) {
    console.warn(`dbPut error for ${storeName}:`, e);
  }

  // Safe localStorage fallback without Blob quota errors
  try {
    let all = await dbGetAll<any>(storeName);
    const keyField = getKeyField(storeName);
    const safeValue = stripBlobsForLocalStorage(value);

    if (Array.isArray(safeValue)) {
      all = safeValue;
    } else {
      const idx = all.findIndex((item) => item[keyField] === (safeValue as any)[keyField]);
      if (idx >= 0) {
        all[idx] = safeValue;
      } else {
        all.push(safeValue);
      }
    }
    localStorage.setItem('acad_striped_' + storeName, JSON.stringify(all));
  } catch (e) {
    console.warn('localStorage sync warning (safe to ignore):', e);
  }

  return value;
}

export async function dbDelete(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (e) {
    console.warn(`dbDelete error for ${storeName}:`, e);
  }

  try {
    let all = await dbGetAll<any>(storeName);
    const keyField = getKeyField(storeName);
    all = all.filter((item) => item[keyField] !== key);
    localStorage.setItem('acad_striped_' + storeName, JSON.stringify(all));
  } catch {}

  return true;
}

export async function logAuditAction(action: string, performedBy: string, details: string) {
  const log: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    action,
    performedBy,
    details,
    timestamp: new Date().toISOString()
  };
  await dbPut('audit_logs', log);
}

export const INITIAL_RESOURCES: AcademicResource[] = [
  {
    id: "res-101",
    code: "BUS 101",
    title: "Introduction to Business & Enterprise Dynamics - Past Exam Compendium",
    level: "100 Level",
    type: "Past Question",
    format: "PDF",
    size: "3.4 MB",
    date: "2026-03-01",
    uploader: "Academic Directorate",
    description: "Full past examination series covering business definitions, forms of business ownership, and economic systems in developing markets.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-102",
    code: "BUS 103",
    title: "Principles of Management - Classical, Behavioral & Systems Approaches",
    level: "100 Level",
    type: "Lecture Note",
    format: "PDF",
    size: "4.2 MB",
    date: "2026-02-28",
    uploader: "Course Rep 100L",
    description: "Detailed course notes on Fayol's 14 principles, Max Weber's bureaucratic model, and Mary Parker Follett's organizational concepts.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-201",
    code: "BUS 201",
    title: "Organizational Management & Structural Strategy - Comprehensive Notes",
    level: "200 Level",
    type: "Lecture Note",
    format: "PDF",
    size: "5.8 MB",
    date: "2026-02-25",
    uploader: "Dr. K. Mohammed",
    description: "Advanced analysis of managerial functions: planning, organizing, staffing, directing, and controlling with Nigerian case studies.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-202",
    code: "BUS 203",
    title: "Business Mathematics & Decision Statistics - Solved Past Papers",
    level: "200 Level",
    type: "Past Question",
    format: "PDF",
    size: "6.1 MB",
    date: "2026-02-20",
    uploader: "Departmental Tutor",
    description: "Step-by-step solutions for probability, correlation, regression analysis, matrix algebra, and linear programming models.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-301",
    code: "BUS 301",
    title: "Organizational Behaviour & Psychological Dynamics - Syllabus Text",
    level: "300 Level",
    type: "Textbook",
    format: "PDF",
    size: "16.5 MB",
    date: "2026-02-15",
    uploader: "Central Library Repository",
    description: "Approved reference text on motivational theories (Maslow, Herzberg, Vroom), leadership styles, and group conflict resolution.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-302",
    code: "BUS 305",
    title: "Marketing Strategy & Brand Management - Case Study Handbook",
    level: "300 Level",
    type: "Assignment",
    format: "PDF",
    size: "2.8 MB",
    date: "2026-02-18",
    uploader: "Prof. B. Garba",
    description: "Comprehensive assignments on 4Ps marketing mix, digital advertising, consumer buying behaviour, and market segmentation.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-401",
    code: "BUS 401",
    title: "Business Policy & Strategic Corporate Analysis - Past Capstone Exams",
    level: "400 Level",
    type: "Past Question",
    format: "PDF",
    size: "7.2 MB",
    date: "2026-02-12",
    uploader: "EXCOS Academic Secretary",
    description: "Final year past questions focusing on SWOT, PESTEL, Porter's 5 Forces, corporate governance, and turnaround strategy.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  },
  {
    id: "res-402",
    code: "BUS 403",
    title: "International Business & Multinational Operations - Research Reader",
    level: "400 Level",
    type: "Textbook",
    format: "PDF",
    size: "14.1 MB",
    date: "2026-01-28",
    uploader: "Faculty Research Unit",
    description: "International trade theories, foreign direct investment, currency risk hedging, and cross-border mergers and acquisitions.",
    isDemo: false,
    driveUrl: GOOGLE_DRIVE_FOLDER_URL
  }
];

export const INITIAL_LEADERSHIP: Leader[] = [
  { role: "President", name: "Ibrahim Modu", tenure: "2025/2026", email: "president.basa@unimaid.edu.ng", phone: "+234 803 123 4567" },
  { role: "Vice President", name: "Fatima Abubakar", tenure: "2025/2026", email: "vp.basa@unimaid.edu.ng", phone: "+234 802 234 5678" },
  { role: "Secretary General", name: "Musa Usman", tenure: "2025/2026", email: "secgen.basa@unimaid.edu.ng", phone: "+234 809 345 6789" },
  { role: "Academic Director", name: "Zainab Mustapha", tenure: "2025/2026", email: "academic.basa@unimaid.edu.ng", phone: "+234 808 456 7890" }
];

export async function seedInitialData() {
  const existingResources = await dbGetAll<AcademicResource>('resources');
  if (existingResources.length === 0) {
    await dbPut('resources', INITIAL_RESOURCES);
  }

  const existingLeaders = await dbGetAll<Leader>('leadership');
  if (existingLeaders.length === 0) {
    await dbPut('leadership', INITIAL_LEADERSHIP);
  }

  const pinSetting = await dbGet<any>('settings', 'adminPin');
  if (!pinSetting) {
    await dbPut('settings', { key: 'adminPin', value: '2026' });
  }
}
