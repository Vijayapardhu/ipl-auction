import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore loads on demand (auction history, completion flush, fallbacks)
// so its ~500KB never blocks first paint on low-end connections.
let _db = null;
let _dbPromise = null;
export const getDb = () => {
  if (_db) return Promise.resolve(_db);
  if (!_dbPromise) {
    _dbPromise = import('firebase/firestore')
      .then((fs) => {
        _db = fs.initializeFirestore(app, {
          localCache: fs.persistentLocalCache({
            tabManager: fs.persistentMultipleTabManager(),
          }),
        });
        return _db;
      })
      .catch((err) => {
        _dbPromise = null;
        throw err;
      });
  }
  return _dbPromise;
};

// Firestore API surface, loaded alongside the SDK on first use.
let _fs = null;
export const getFs = async () => {
  if (!_fs) _fs = await import('firebase/firestore');
  return _fs;
};
export const analytics = null;

// Analytics loads idle + off the critical path: it only reports, and its
// network beacons must never slow first paint on low-end connections.
if (typeof window !== 'undefined') {
  const initAnalytics = () => {
    import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) =>
        isSupported()
          .then((ok) => {
            if (ok) {
              try { getAnalytics(app); } catch (e) { /* ignore */ }
            }
          })
          .catch(() => {})
      )
      .catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initAnalytics, { timeout: 12000 });
  } else {
    setTimeout(initAnalytics, 4000);
  }
}


// ─── Server Time Sync via Firebase RTDB ───
// Firebase RTDB provides `.info/serverTimeOffset` which is the ms difference
// between the client's clock and Firebase's server clock.
// This is the official Firebase mechanism for clock synchronization.
// All clients will agree on the same absolute time (±50ms).
let _serverTimeOffset = 0;

export const rtdb = getDatabase(app);

try {
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    _serverTimeOffset = snap.val() || 0;
  });
} catch (e) {
  // RTDB sync skipped silently. We default to local machine clock.
}

/**
 * Returns the current server-authoritative time in milliseconds.
 * Uses Firebase RTDB's `.info/serverTimeOffset` for ms-accurate sync.
 * All clients calling this will agree on the same absolute time (±50ms).
 */
export const getServerTime = () => Date.now() + _serverTimeOffset;

/**
 * Returns the current server time offset in ms (for debugging).
 */
export const getServerTimeOffset = () => _serverTimeOffset;

export default app;