/**
 * API Lens - IndexedDB Persistence Engine
 * Provides reliable, client-side, zero-telemetry local persistence for analysis sessions.
 * Guarantees that sensitive credentials remain strictly redacted before serialization.
 */

import { sanitizeHarData, sanitizeHarEntry } from './redaction.js';

const DB_NAME = 'ApiLensDB';
const DB_VERSION = 1;
const STORE_NAME = 'analysis_sessions';
const SESSION_KEY = 'latest';

/**
 * Check if IndexedDB is available in current environment
 */
export function isIndexedDbSupported() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Open or initialize the IndexedDB database
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbSupported()) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message || 'Unknown error'}`));
    };
  });
}

/**
 * Deeply sanitize an entry to guarantee no unredacted secrets enter IndexedDB
 */
export function sanitizeEntry(entry) {
  return sanitizeHarEntry(entry);
}

/**
 * Save active analysis session into IndexedDB
 * Overwrites the singleton 'latest' key to avoid duplicate records.
 */
export async function saveSession(sessionData) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const sanitizedEntries = (sessionData.entries || []).map(sanitizeEntry);
      const savedAt = new Date().toISOString();

      const record = sanitizeHarData({
        id: SESSION_KEY,
        savedAt,
        fileName: sessionData.fileName || 'capture.har',
        fileSize: sessionData.fileSize || 0,
        entries: sanitizedEntries,
        metrics: sessionData.metrics || {},
        endpoints: sessionData.endpoints || [],
        securityFindings: sessionData.securityFindings || [],
        flowGraph: sessionData.flowGraph || { nodes: [], links: [] },
      });

      const request = store.put(record);

      request.onsuccess = () => {
        resolve({ success: true, savedAt });
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to save session to IndexedDB: ${event.target.error?.message}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    console.error('[IndexedDB] Failed to save the local analysis session.');
    return { success: false, error: 'Failed to save analysis session locally.' };
  }
}

/**
 * Load the latest saved analysis session from IndexedDB
 */
export async function loadLatestSession() {
  try {
    if (!isIndexedDbSupported()) return null;
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(SESSION_KEY);

      request.onsuccess = (event) => {
        const record = event.target.result;
        if (!record || !record.entries || record.entries.length === 0) {
          resolve(null);
          db.close();
          return;
        }

        const safeRecord = sanitizeHarData({
          ...record,
          entries: record.entries.map(sanitizeEntry),
          metrics: record.metrics || {},
          endpoints: record.endpoints || [],
          securityFindings: record.securityFindings || [],
          flowGraph: record.flowGraph || { nodes: [], links: [] },
        });
        const writeTx = db.transaction(STORE_NAME, 'readwrite');
        const writeRequest = writeTx.objectStore(STORE_NAME).put(safeRecord);
        writeTx.oncomplete = () => {
          db.close();
          resolve(safeRecord);
        };
        writeTx.onerror = () => {
          db.close();
          reject(new Error('Failed to sanitize the saved analysis session.'));
        };
        writeRequest.onerror = () => {
          db.close();
          reject(new Error('Failed to sanitize the saved analysis session.'));
        };
      };

      request.onerror = (event) => {
        db.close();
        reject(new Error(`Failed to load session from IndexedDB: ${event.target.error?.message}`));
      };
    });
  } catch {
    console.error('[IndexedDB] Failed to load the local analysis session.');
    return null;
  }
}

/**
 * Clear the saved session from IndexedDB
 */
export async function clearLatestSession() {
  try {
    if (!isIndexedDbSupported()) return { success: true };
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(SESSION_KEY);

      request.onsuccess = () => {
        resolve({ success: true });
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to clear session from IndexedDB: ${event.target.error?.message}`));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    console.error('[IndexedDB] Failed to clear the local analysis session.');
    return { success: false, error: 'Failed to clear analysis session locally.' };
  }
}
